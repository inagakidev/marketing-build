import { customAlphabet } from "nanoid";
import { prisma } from "./db";
import type { Prisma } from "@/generated/prisma/client";
import {
  buildContext,
  processBriefing,
  visibleQuestions,
  Q,
  type AnswerValue,
  type BusinessType,
  type EvalContext,
  type QuestionSpec,
  type VisibilityRule,
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

/** Perguntas do catálogo, no formato que o motor entende. */
export async function loadQuestionSpecs(): Promise<QuestionSpec[]> {
  const questions = await prisma.question.findMany({
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
export async function loadEvalContext(briefingId: string): Promise<EvalContext> {
  const [briefing, questions, answers] = await Promise.all([
    prisma.briefing.findUniqueOrThrow({
      where: { id: briefingId },
      select: { businessType: true },
    }),
    loadQuestionSpecs(),
    prisma.answer.findMany({
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
 * Roda o motor e regrava sinais e diagnóstico.
 *
 * Apaga tudo antes de recriar, dentro de uma transação: reprocessar precisa ser
 * idempotente, e um sinal que deixou de valer (porque o cliente corrigiu a
 * resposta) não pode sobreviver ao reprocessamento.
 */
export async function processAndPersist(briefingId: string) {
  const ctx = await loadEvalContext(briefingId);
  const result = processBriefing(ctx);

  await prisma.$transaction(async (tx) => {
    await tx.signal.deleteMany({ where: { briefingId } });
    await tx.diagnosis.deleteMany({ where: { briefingId } });

    // Os sinais precisam ser criados antes para que o diagnóstico possa
    // referenciar seus ids em `signalIds`.
    const createdSignals = await Promise.all(
      result.signals.map((signal) =>
        tx.signal.create({
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
      ),
    );

    const signalIdByCode = new Map(
      createdSignals.map((s) => [s.code, s.id] as const),
    );

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
  });

  return result;
}

/** Cria um briefing com token único e prazo de validade. */
export async function createBriefing(clientId: string, ttlDays?: number) {
  const days = ttlDays ?? Number(process.env.BRIEFING_LINK_TTL_DAYS ?? 30);
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

  if (briefing.expiresAt && briefing.expiresAt < new Date()) {
    return { problem: "expired" as const, briefing };
  }

  const closed = ["submitted", "ready_for_review", "approved"];
  if (closed.includes(briefing.status)) {
    return { problem: "already_submitted" as const, briefing };
  }

  return { problem: null, briefing };
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
    select: { id: true, key: true },
  });
  const questionIdByKey = new Map(questions.map((q) => [q.key, q.id] as const));

  const unknown = keys.filter((key) => !questionIdByKey.has(key));
  if (unknown.length > 0) {
    throw new Error(`Perguntas desconhecidas: ${unknown.join(", ")}`);
  }

  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      const questionId = questionIdByKey.get(entry.questionKey) as string;
      const blank = isBlankValue(entry.value);

      if (blank) {
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
      data.businessType = isBlankValue(branch.value)
        ? null
        : (String(branch.value) as BusinessType);
    }

    // Primeira resposta tira o briefing de "aguardando".
    const current = await tx.briefing.findUniqueOrThrow({
      where: { id: briefingId },
      select: { status: true },
    });
    if (current.status === "awaiting_response" || current.status === "draft") {
      data.status = "in_progress";
    }

    if (Object.keys(data).length > 0) {
      await tx.briefing.update({ where: { id: briefingId }, data });
    }
  });
}

/**
 * Fecha o briefing: valida as obrigatórias visíveis, roda o motor e muda o
 * status. Devolve as pendências em vez de lançar quando falta algo.
 */
export async function submitBriefing(briefingId: string) {
  const ctx = await loadEvalContext(briefingId);
  const missing = missingRequiredKeys(ctx);

  if (missing.length > 0) {
    return { ok: false as const, missing };
  }

  await prisma.briefing.update({
    where: { id: briefingId },
    data: { status: "ready_for_review", submittedAt: new Date() },
  });
  const result = await processAndPersist(briefingId);

  return { ok: true as const, result };
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
