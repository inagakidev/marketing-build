/**
 * Ponto de entrada do motor de regras.
 *
 * Tudo o que a camada de API precisa saber está aqui: monte um `EvalContext`
 * com as perguntas e respostas, chame `processBriefing`, persista o resultado.
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
 * Monta um contexto de avaliação. Indexar as respostas por `key` acontece uma
 * vez aqui, e não dentro de cada regra.
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
 * Roda o motor inteiro: sinais, pontuação por categoria e as listas de
 * problemas e oportunidades.
 *
 * O contexto é filtrado UMA vez, no começo, para conter apenas respostas de
 * perguntas visíveis — assim as três etapas enxergam exatamente o mesmo
 * conjunto de dados. A operação é idempotente: remover respostas invisíveis
 * não muda o cálculo de visibilidade, já que elas nunca entraram nele.
 */
export function processBriefing(ctx: EvalContext): ProcessedBriefing {
  const visibleCtx = withVisibleAnswersOnly(ctx);
  const signals = runSignals(visibleCtx);
  const diagnoses = buildDiagnosis(visibleCtx, signals);
  const summary = buildSummary(visibleCtx, diagnoses);
  return { signals, diagnoses, summary };
}
