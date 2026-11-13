import { customAlphabet } from "nanoid";
import { prisma } from "./db";
import { serverEnv } from "./env";
import type { Prisma } from "@/generated/prisma/client";
import {
  buildContext,
  processBriefing,
  visibleQuestions,
  Q,
  type AnswerValue,
  type BusinessType,
  type EvalContext,
  type QuestionOption,
  type QuestionSpec,
  type VisibilityRule,
  validateAnswerValue,
  type ProcessedBriefing,
} from "@/core";

/**
 * Camada de adaptação entre o banco e o motor de regras.
 *
 * Tudo o que envolve Prisma vive aqui; `src/core` continua sem saber que
 * existe um banco de dados.
 */

/**
 * Alfabeto sem caracteres ambíguos (0/O, 1/l/I): o link é lido e digitado por
 * pessoas. 24 caracteres deste alfabeto dão ~124 bits de entropia — o token é
 * a única credencial do respondente, então não pode ser adivinhável.
 */
const generateToken = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  24,
);

export type BriefingAccessProblem =
  | "not_found"
  | "expired"
  | "already_submitted";

/** Cliente do Prisma ou transação em curso: as leituras servem aos dois. */
type Db = Prisma.TransactionClient;

const CLOSED_STATUSES = ["submitted", "ready_for_review", "approved"];

/**
 * Por que um briefing não aceita mais respostas, ou `null` se aceita.
 *
 * "Já enviado" vem antes de "expirado": um briefing enviado cujo link venceu
 * depois continua sendo, para o respondente, um briefing enviado.
 */
export function briefingAccessProblem(
  briefing: { status: string; expiresAt: Date | null },
  now: Date = new Date(),
): "expired" | "already_submitted" | null {
  if (CLOSED_STATUSES.includes(briefing.status)) return "already_submitted";
  if (briefing.expiresAt && briefing.expiresAt < now) return "expired";
  return null;
}

/** O briefing não aceita mais respostas (enviado ou expirado). */
export class BriefingClosedError extends Error {
  constructor(public readonly problem: "expired" | "already_submitted") {
    super(problem === "expired" ? "Link expirado" : "Briefing já enviado");
    this.name = "BriefingClosedError";
  }
}

/** Respostas incompatíveis com o catálogo. `issues` é indexado pela chave da pergunta. */
export class InvalidAnswersError extends Error {
  constructor(
    public readonly issues: Record<string, string>,
    message = "Respostas inválidas",
  ) {
    super(message);
    this.name = "InvalidAnswersError";
  }
}

/**
 * Trava a linha do briefing até o fim da transação.
 *
 * Autosave, envio e reprocessamento passam todos por aqui: com a linha
 * travada eles se enfileiram, então nenhum deles vê um estado intermediário
 * do outro (DATA-01).
 */
async function lockBriefing(tx: Db, briefingId: string) {
  const rows = await tx.$queryRaw<{ status: string; expiresAt: Date | null }[]>`
    SELECT status::text AS status, "expiresAt"
    FROM briefings
    WHERE id = ${briefingId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

/** Perguntas do catálogo, no formato que o motor entende. */
export async function loadQuestionSpecs(db: Db = prisma): Promise<QuestionSpec[]> {
  const questions = await db.question.findMany({
    orderBy: { order: "asc" },
  });

  return questions.map((q) => ({
    key: q.key,
    category: q.category,
    answerType: q.answerType,
    required: q.required,
    order: q.order,
    visibilityRule: (q.visibilityRule as VisibilityRule | null) ?? null,
  }));
}

/** Monta o contexto de avaliação de um briefing a partir do banco. */
export async function loadEvalContext(
  briefingId: string,
  db: Db = prisma,
): Promise<EvalContext> {
  const [briefing, questions, answers] = await Promise.all([
    db.briefing.findUniqueOrThrow({
      where: { id: briefingId },
      select: { businessType: true },
    }),
    loadQuestionSpecs(db),
    db.answer.findMany({
      where: { briefingId },
      select: { id: true, value: true, question: { select: { key: true } } },
    }),
  ]);

  return buildContext({
    businessType: briefing.businessType as BusinessType | null,
    questions,
    answers: answers.map((a) => ({
      id: a.id,
      questionKey: a.question.key,
      value: a.value as AnswerValue,
    })),
  });
}

/**
 * Recalcula e regrava sinais e diagnóstico (reprocessamento explícito).
 *
 * Leitura das respostas, cálculo e gravação acontecem na MESMA transação, com
 * a linha do briefing travada: o resultado corresponde exatamente às
 * respostas gravadas naquele instante.
 */
export async function processAndPersist(briefingId: string): Promise<ProcessedBriefing> {
  return prisma.$transaction(async (tx) => {
    await lockBriefing(tx, briefingId);
    const result = processBriefing(await loadEvalContext(briefingId, tx));
    await persistResult(tx, briefingId, result);
    return result;
  });
}

/**
 * Apaga e recria sinais e diagnóstico. Idempotente: um sinal que deixou de
 * valer não sobrevive. Precisa rodar dentro de uma transação.
 */
async function persistResult(tx: Db, briefingId: string, result: ProcessedBriefing) {
  await tx.signal.deleteMany({ where: { briefingId } });
  await tx.diagnosis.deleteMany({ where: { briefingId } });

  // Os sinais precisam ser criados antes para que o diagnóstico possa
  // referenciar seus ids em `signalIds`.
  const createdSignals = [];
  for (const signal of result.signals) {
    createdSignals.push(
      await tx.signal.create({
        data: {
          briefingId,
          code: signal.code,
          category: signal.category,
          severity: signal.severity,
          description: signal.description,
          sourceAnswerIds: signal.sourceAnswerIds,
        },
        select: { id: true, code: true },
      }),
    );
  }

  const signalIdByCode = new Map(createdSignals.map((s) => [s.code, s.id] as const));

  await tx.diagnosis.createMany({
    data: result.diagnoses.map((diagnosis) => ({
      briefingId,
      category: diagnosis.category,
      score: diagnosis.score,
      status: diagnosis.status,
      signalIds: diagnosis.signals
        .map((s) => signalIdByCode.get(s.code))
        .filter((id): id is string => id != null),
    })),
  });
}

/** Cria um briefing com token único e prazo de validade. */
export async function createBriefing(clientId: string, ttlDays?: number) {
  const days = ttlDays ?? serverEnv().briefingLinkTtlDays;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  return prisma.briefing.create({
    data: {
      clientId,
      token: generateToken(),
      status: "awaiting_response",
      expiresAt,
    },
  });
}

/**
 * Carrega um briefing pelo token e diz se ele ainda pode ser respondido.
 *
 * Devolve `problem` em vez de lançar: cada motivo de recusa tem uma mensagem
 * diferente para o respondente, e um link expirado não é um erro do sistema.
 */
export async function loadBriefingByToken(token: string) {
  const briefing = await prisma.briefing.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      businessType: true,
      expiresAt: true,
      submittedAt: true,
      // Apenas o nome do cliente: o formulário público NUNCA expõe e-mail,
      // telefone ou notas internas.
      client: { select: { name: true, user: { select: { name: true } } } },
    },
  });

  if (!briefing) return { problem: "not_found" as const, briefing: null };

  return { problem: briefingAccessProblem(briefing), briefing };
}

/**
 * Grava respostas (autosave). Faz upsert por (briefing, pergunta) e mantém
 * `businessType` do briefing em sincronia com a pergunta de ramificação.
 *
 * Respostas em branco APAGAM o registro em vez de gravar vazio: assim
 * "respondida e depois limpa" e "nunca respondida" são o mesmo estado, que é o
 * que o motor de regras espera.
 */
export async function saveAnswers(
  briefingId: string,
  entries: { questionKey: string; value: AnswerValue }[],
) {
  const keys = entries.map((e) => e.questionKey);
  const questions = await prisma.question.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true, answerType: true, options: true },
  });
  const questionByKey = new Map(questions.map((q) => [q.key, q] as const));

  const unknown = keys.filter((key) => !questionByKey.has(key));
  if (unknown.length > 0) {
    throw new InvalidAnswersError(
      Object.fromEntries(unknown.map((key) => [key, "Pergunta desconhecida."])),
      `Perguntas desconhecidas: ${unknown.join(", ")}`,
    );
  }

  // Valida o lote inteiro antes de gravar: ou entra tudo, ou nada (DATA-03).
  const issues: Record<string, string> = {};
  for (const entry of entries) {
    if (isBlankValue(entry.value)) continue;
    const question = questionByKey.get(entry.questionKey)!;
    const problem = validateAnswerValue(
      {
        answerType: question.answerType,
        options: (question.options as QuestionOption[] | null) ?? null,
      },
      entry.value,
    );
    if (problem) issues[entry.questionKey] = problem;
  }
  if (Object.keys(issues).length > 0) throw new InvalidAnswersError(issues);

  await prisma.$transaction(async (tx) => {
    // O estado é conferido COM a linha travada: um envio concorrente ou já
    // concluído impede a gravação (DATA-01).
    const current = await lockBriefing(tx, briefingId);
    if (!current) throw new Error(`Briefing ${briefingId} não encontrado`);
    const problem = briefingAccessProblem(current);
    if (problem) throw new BriefingClosedError(problem);

    for (const entry of entries) {
      const questionId = questionByKey.get(entry.questionKey)!.id;

      if (isBlankValue(entry.value)) {
        await tx.answer.deleteMany({ where: { briefingId, questionId } });
        continue;
      }

      const value = entry.value as unknown as Prisma.InputJsonValue;
      await tx.answer.upsert({
        where: { briefingId_questionId: { briefingId, questionId } },
        create: { briefingId, questionId, value },
        update: { value },
      });
    }

    const branch = entries.find((e) => e.questionKey === Q.BUSINESS_TYPE);
    const data: Prisma.BriefingUpdateInput = {};

    if (branch) {
      // Já validado contra as opções do catálogo, que espelham o enum.
      data.businessType = isBlankValue(branch.value)
        ? null
        : (String(branch.value) as BusinessType);
    }

    // Primeira resposta tira o briefing de "aguardando".
    if (current.status === "awaiting_response" || current.status === "draft") {
      data.status = "in_progress";
    }

    if (Object.keys(data).length > 0) {
      await tx.briefing.update({ where: { id: briefingId }, data });
    }
  });
}

export type SubmitOutcome =
  | { ok: true; alreadySubmitted: boolean }
  | { ok: false; missing: string[] }
  | { ok: false; problem: "expired" | "not_found" };

/**
 * Fecha o briefing de forma atômica (DATA-01).
 *
 * Numa única transação, com a linha travada: confere o estado, valida as
 * obrigatórias visíveis, roda o motor, grava sinais e diagnóstico e muda o
 * status. Se qualquer passo falhar, nada muda — o briefing nunca fica fechado
 * sem diagnóstico. Reenvio (duplo clique, envio concorrente) é idempotente.
 */
export async function submitBriefing(briefingId: string): Promise<SubmitOutcome> {
  return prisma.$transaction(async (tx) => {
    const current = await lockBriefing(tx, briefingId);
    if (!current) return { ok: false, problem: "not_found" };

    const problem = briefingAccessProblem(current);
    if (problem === "already_submitted") return { ok: true, alreadySubmitted: true };
    if (problem === "expired") return { ok: false, problem: "expired" };

    const ctx = await loadEvalContext(briefingId, tx);
    const missing = missingRequiredKeys(ctx);
    if (missing.length > 0) return { ok: false, missing };

    await persistResult(tx, briefingId, processBriefing(ctx));
    await tx.briefing.update({
      where: { id: briefingId },
      data: { status: "ready_for_review", submittedAt: new Date() },
    });

    return { ok: true, alreadySubmitted: false };
  });
}

/** Chaves das obrigatórias visíveis ainda sem resposta. */
export function missingRequiredKeys(ctx: EvalContext): string[] {
  return visibleQuestions(ctx)
    .filter((q) => q.required)
    .filter((q) => {
      const answer = ctx.answersByKey[q.key];
      return !answer || isBlankValue(answer.value);
    })
    .map((q) => q.key);
}

function isBlankValue(value: AnswerValue | null | undefined): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((v) => v.trim() === "");
  }
  return value.trim() === "";
}
