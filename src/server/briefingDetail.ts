import { prisma } from "./db";
import { loadEvalContext } from "./briefing";
import {
  buildSummary,
  DIAGNOSIS_CATEGORY_LABELS,
  QUESTION_CATEGORY_LABELS,
  QUESTION_CATEGORY_ORDER,
  toDisplayValue,
  visibleQuestions,
  type CategoryDiagnosis,
  type DetectedSignal,
  type DiagnosisSummary,
  type QuestionOption,
} from "@/core";

/**
 * Monta a visão completa de um briefing para o painel e para o PDF.
 *
 * Reconstrói os sinais e o diagnóstico a partir do que está GRAVADO, e não
 * recalculando: o painel precisa mostrar o mesmo resultado que foi produzido no
 * envio, mesmo que as regras tenham mudado desde então. Recalcular é uma ação
 * explícita da administradora (`/reprocess`).
 */

export interface AnswerView {
  questionKey: string;
  text: string;
  helpText: string | null;
  answerType: string;
  required: boolean;
  /** Valor cru, como está no banco. Alimenta a aba de respostas brutas. */
  value: string | string[] | null;
  /**
   * Valor legível: em perguntas de escolha, o RÓTULO da opção em vez do
   * código. Sem isso o painel e o PDF mostrariam "1_a_3_anos" para quem
   * precisa ler e escrever a estratégia a partir daí.
   */
  displayValue: string | string[] | null;
  answeredAt: Date | null;
}

export interface CategoryView {
  category: string;
  label: string;
  answers: AnswerView[];
}

export interface BriefingDetail {
  briefing: {
    id: string;
    status: string;
    token: string;
    businessType: string | null;
    createdAt: Date;
    expiresAt: Date | null;
    submittedAt: Date | null;
  };
  client: {
    id: string;
    name: string;
    contactEmail: string;
    phone: string | null;
    projectType: string | null;
    internalNotes: string | null;
  };
  categories: CategoryView[];
  diagnoses: (CategoryDiagnosis & { label: string })[];
  summary: DiagnosisSummary;
  /** Perguntas obrigatórias visíveis ainda sem resposta. */
  missingRequiredKeys: string[];
  answeredCount: number;
  visibleCount: number;
}

export async function loadBriefingDetail(
  briefingId: string,
  userId: string,
): Promise<BriefingDetail | null> {
  const briefing = await prisma.briefing.findFirst({
    // O filtro por `userId` sobe pela relação: um id de briefing de outra
    // conta não deve nem confirmar que existe.
    where: { id: briefingId, client: { userId } },
    select: {
      id: true,
      status: true,
      token: true,
      businessType: true,
      createdAt: true,
      expiresAt: true,
      submittedAt: true,
      client: {
        select: {
          id: true,
          name: true,
          contactEmail: true,
          phone: true,
          projectType: true,
          internalNotes: true,
        },
      },
      // Ordem explícita: sem ela o painel e o sumário herdariam a ordem
      // física do banco, que pode mudar entre leituras (DATA-06).
      signals: { orderBy: { code: "asc" } },
      diagnoses: { orderBy: { category: "asc" } },
    },
  });

  if (!briefing) return null;

  const ctx = await loadEvalContext(briefing.id);
  const visible = visibleQuestions(ctx);

  const rows = await prisma.question.findMany({
    where: { key: { in: visible.map((q) => q.key) } },
    select: {
      key: true,
      text: true,
      helpText: true,
      answerType: true,
      required: true,
      category: true,
      options: true,
    },
  });
  const rowByKey = new Map(rows.map((r) => [r.key, r] as const));

  const answeredAt = new Map(
    (
      await prisma.answer.findMany({
        where: { briefingId: briefing.id },
        select: { answeredAt: true, question: { select: { key: true } } },
      })
    ).map((a) => [a.question.key, a.answeredAt] as const),
  );

  const views: AnswerView[] = visible.flatMap((spec) => {
    const row = rowByKey.get(spec.key);
    if (!row) return [];

    const value = ctx.answersByKey[spec.key]?.value ?? null;
    const options = (row.options as QuestionOption[] | null) ?? null;

    return [
      {
        questionKey: spec.key,
        text: row.text,
        helpText: row.helpText,
        answerType: row.answerType,
        required: row.required,
        value,
        displayValue: toDisplayValue(value, options),
        answeredAt: answeredAt.get(spec.key) ?? null,
      },
    ];
  });

  const categories: CategoryView[] = QUESTION_CATEGORY_ORDER.flatMap(
    (category) => {
      const answers = views.filter(
        (view) => rowByKey.get(view.questionKey)?.category === category,
      );
      if (answers.length === 0) return [];
      return [
        {
          category,
          label: QUESTION_CATEGORY_LABELS[category],
          answers,
        },
      ];
    },
  );

  // Reidrata o diagnóstico gravado no formato que o motor produz, para que o
  // painel e o `buildSummary` trabalhem com a mesma estrutura dos testes.
  const signalById = new Map(
    briefing.signals.map((s) => [
      s.id,
      {
        code: s.code,
        category: s.category,
        severity: s.severity,
        description: s.description,
        sourceAnswerIds: s.sourceAnswerIds,
      } satisfies DetectedSignal,
    ]),
  );

  const diagnoses = briefing.diagnoses.map((d) => ({
    category: d.category,
    score: d.score,
    status: d.status,
    signals: d.signalIds
      .map((id) => signalById.get(id))
      .filter((s): s is DetectedSignal => s != null),
    missingRequiredKeys: [] as string[],
    label: DIAGNOSIS_CATEGORY_LABELS[d.category],
  }));

  const missingRequiredKeys = visible
    .filter((q) => q.required)
    .filter((q) => {
      const value = ctx.answersByKey[q.key]?.value;
      if (value == null) return true;
      return Array.isArray(value)
        ? value.length === 0
        : value.trim() === "";
    })
    .map((q) => q.key);

  return {
    briefing: {
      id: briefing.id,
      status: briefing.status,
      token: briefing.token,
      businessType: briefing.businessType,
      createdAt: briefing.createdAt,
      expiresAt: briefing.expiresAt,
      submittedAt: briefing.submittedAt,
    },
    client: briefing.client,
    categories,
    diagnoses,
    summary: buildSummary(ctx, diagnoses),
    missingRequiredKeys,
    answeredCount: views.filter((v) => v.value != null).length,
    visibleCount: views.length,
  };
}
