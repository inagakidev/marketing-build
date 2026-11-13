import type {
  CategoryDiagnosis,
  DetectedSignal,
  DiagnosisCategory,
  DiagnosisStatus,
  EvalContext,
  SignalSeverity,
} from "../types";
import { isBlank } from "../text";
import { resolveVisibility } from "../visibility";
import {
  DIAGNOSIS_CATEGORIES,
  QUESTION_TO_DIAGNOSIS_CATEGORY,
} from "./categoryMap";

/** Penalidade em pontos por severidade de sinal. */
export const SEVERITY_PENALTY: Readonly<Record<SignalSeverity, number>> = {
  light: 15,
  moderate: 25,
  strong: 40,
};

export const STARTING_SCORE = 100;

/** Piso de cada faixa de status. */
export const SCORE_BANDS = {
  green: 80,
  yellow: 50,
} as const;

/**
 * Converte pontuação em status.
 * 80–100 verde · 50–79 amarelo · 0–49 vermelho.
 */
export function scoreToStatus(score: number): Exclude<DiagnosisStatus, "gray"> {
  if (score >= SCORE_BANDS.green) return "green";
  if (score >= SCORE_BANDS.yellow) return "yellow";
  return "red";
}

/**
 * Calcula o diagnóstico das 5 categorias.
 *
 * Cada categoria começa com 100 pontos e perde pontos por sinal detectado.
 * A exceção é a falta de dado obrigatório: se uma pergunta obrigatória e
 * VISÍVEL da categoria ficou sem resposta, a categoria não é pontuada e recebe
 * `gray` ("sem dados suficientes"), ignorando qualquer sinal. Pontuar sobre
 * dado incompleto produziria um número que parece uma avaliação sem ser uma.
 *
 * O recorte por visibilidade importa: as perguntas ramificadas de outros tipos
 * de negócio são obrigatórias no catálogo mas invisíveis para este briefing —
 * cobrá-las deixaria toda categoria permanentemente cinza.
 */
export function buildDiagnosis(
  ctx: EvalContext,
  signals: readonly DetectedSignal[],
): CategoryDiagnosis[] {
  const visible = resolveVisibility(ctx);
  const missingByCategory = findMissingRequired(ctx, visible);

  return DIAGNOSIS_CATEGORIES.map((category) => {
    const categorySignals = signals.filter((s) => s.category === category);
    const missingRequiredKeys = missingByCategory[category] ?? [];

    if (missingRequiredKeys.length > 0) {
      return {
        category,
        score: null,
        status: "gray" as const,
        signals: categorySignals,
        missingRequiredKeys,
      };
    }

    const penalty = categorySignals.reduce(
      (total, signal) => total + SEVERITY_PENALTY[signal.severity],
      0,
    );
    const score = clamp(STARTING_SCORE - penalty, 0, STARTING_SCORE);

    return {
      category,
      score,
      status: scoreToStatus(score),
      signals: categorySignals,
      missingRequiredKeys,
    };
  });
}

/** Chaves das obrigatórias visíveis sem resposta, agrupadas por categoria. */
function findMissingRequired(
  ctx: EvalContext,
  visible: ReadonlySet<string>,
): Partial<Record<DiagnosisCategory, string[]>> {
  const missing: Partial<Record<DiagnosisCategory, string[]>> = {};

  for (const question of ctx.questions) {
    if (!question.required) continue;
    if (!visible.has(question.key)) continue;

    const category = QUESTION_TO_DIAGNOSIS_CATEGORY[question.category];
    if (category == null) continue; // `closing` não é avaliada

    const answer = ctx.answersByKey[question.key];
    if (answer && !isBlank(answer.value)) continue;

    (missing[category] ??= []).push(question.key);
  }

  return missing;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
