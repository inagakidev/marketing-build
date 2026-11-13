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

/** Point penalty per signal severity. */
export const SEVERITY_PENALTY: Readonly<Record<SignalSeverity, number>> = {
  light: 15,
  moderate: 25,
  strong: 40,
};

export const STARTING_SCORE = 100;

/** Floor of each status band. */
export const SCORE_BANDS = {
  green: 80,
  yellow: 50,
} as const;

/**
 * Converts a score into a status.
 * 80–100 green · 50–79 yellow · 0–49 red.
 */
export function scoreToStatus(score: number): Exclude<DiagnosisStatus, "gray"> {
  if (score >= SCORE_BANDS.green) return "green";
  if (score >= SCORE_BANDS.yellow) return "yellow";
  return "red";
}

/**
 * Computes the diagnosis for the 5 categories.
 *
 * Each category starts at 100 points and loses points per detected signal.
 * The exception is missing required data: if a required and VISIBLE question
 * in the category was left unanswered, the category isn't scored and gets
 * `gray` ("not enough data"), ignoring any signal. Scoring incomplete data
 * would produce a number that looks like an evaluation without being one.
 *
 * Filtering by visibility matters: branch questions for other business types
 * are required in the catalog but invisible to this briefing — demanding them
 * would leave every category permanently gray.
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

/** Keys of unanswered visible required questions, grouped by category. */
function findMissingRequired(
  ctx: EvalContext,
  visible: ReadonlySet<string>,
): Partial<Record<DiagnosisCategory, string[]>> {
  const missing: Partial<Record<DiagnosisCategory, string[]>> = {};

  for (const question of ctx.questions) {
    if (!question.required) continue;
    if (!visible.has(question.key)) continue;

    const category = QUESTION_TO_DIAGNOSIS_CATEGORY[question.category];
    if (category == null) continue; // `closing` isn't evaluated

    const answer = ctx.answersByKey[question.key];
    if (answer && !isBlank(answer.value)) continue;

    (missing[category] ??= []).push(question.key);
  }

  return missing;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
