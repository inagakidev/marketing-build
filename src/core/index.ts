/**
 * Rules engine entry point.
 *
 * Everything the API layer needs to know is here: build an `EvalContext` with
 * the questions and answers, call `processBriefing`, persist the result.
 */

import type {
  AnswerRecord,
  BusinessType,
  CategoryDiagnosis,
  DetectedSignal,
  EvalContext,
  QuestionSpec,
} from "./types";
import { runSignals, withVisibleAnswersOnly } from "./signals/run";
import { buildDiagnosis } from "./diagnosis/score";
import { buildSummary, type DiagnosisSummary } from "./diagnosis/summary";

export * from "./types";
export { Q, GOAL, POSTING, CONVERSION_GOALS } from "./questionKeys";
export { resolveVisibility, visibleQuestions, evaluateRule } from "./visibility";
export { buildSteps, MAX_QUESTIONS_PER_STEP } from "./form";
export type { FormStep } from "./form";
export { runSignals, withVisibleAnswersOnly } from "./signals/run";
export { SIGNAL_RULES } from "./signals/registry";
export {
  buildDiagnosis,
  scoreToStatus,
  SEVERITY_PENALTY,
  SCORE_BANDS,
  STARTING_SCORE,
} from "./diagnosis/score";
export { buildSummary } from "./diagnosis/summary";
export { toDisplayValue } from "./text";
export { validateAnswerValue, ANSWER_LIMITS } from "./answerValidation";
export type { AnswerValidationTarget } from "./answerValidation";
export type {
  DiagnosisSummary,
  DiagnosisProblem,
  DiagnosisOpportunity,
} from "./diagnosis/summary";
export {
  QUESTION_TO_DIAGNOSIS_CATEGORY,
  DIAGNOSIS_CATEGORIES,
  DIAGNOSIS_CATEGORY_LABELS,
  QUESTION_CATEGORY_LABELS,
  QUESTION_CATEGORY_ORDER,
} from "./diagnosis/categoryMap";

export interface ProcessedBriefing {
  signals: DetectedSignal[];
  diagnoses: CategoryDiagnosis[];
  summary: DiagnosisSummary;
}

/**
 * Builds an evaluation context. Indexing answers by `key` happens once here,
 * not inside each rule.
 */
export function buildContext(input: {
  businessType: BusinessType | null;
  questions: QuestionSpec[];
  answers: AnswerRecord[];
}): EvalContext {
  const answersByKey: Record<string, AnswerRecord> = {};
  for (const answer of input.answers) {
    answersByKey[answer.questionKey] = answer;
  }
  return {
    businessType: input.businessType,
    questions: input.questions,
    answersByKey,
  };
}

/**
 * Runs the whole engine: signals, per-category scoring and the lists of
 * problems and opportunities.
 *
 * The context is filtered ONCE, at the start, to contain only answers to
 * visible questions — so all three stages see exactly the same data. The
 * operation is idempotent: removing invisible answers doesn't change the
 * visibility calculation, since they never entered it.
 */
export function processBriefing(ctx: EvalContext): ProcessedBriefing {
  const visibleCtx = withVisibleAnswersOnly(ctx);
  const signals = runSignals(visibleCtx);
  const diagnoses = buildDiagnosis(visibleCtx, signals);
  const summary = buildSummary(visibleCtx, diagnoses);
  return { signals, diagnoses, summary };
}
