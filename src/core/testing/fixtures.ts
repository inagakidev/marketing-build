/**
 * Context builders for tests.
 *
 * They live in `src/core` (not in `tests/`) because they're part of the
 * engine's vocabulary: building a context requires knowing the shape of
 * `QuestionSpec` and `AnswerRecord`, and duplicating that in every test file
 * would invite drift.
 */

import type {
  AnswerRecord,
  AnswerValue,
  BusinessType,
  EvalContext,
  QuestionSpec,
  VisibilityRule,
} from "../types";
import { buildContext } from "../index";

let orderCounter = 0;

/** A question with sensible defaults; override only what the test needs. */
export function question(
  key: string,
  overrides: Partial<QuestionSpec> = {},
): QuestionSpec {
  orderCounter += 1;
  return {
    key,
    category: "business",
    answerType: "long_text",
    required: false,
    order: orderCounter,
    visibilityRule: null,
    ...overrides,
  };
}

/** Resets the order counter so each test is independent. */
export function resetQuestionOrder(): void {
  orderCounter = 0;
}

export function answer(
  questionKey: string,
  value: AnswerValue,
  id = `ans-${questionKey}`,
): AnswerRecord {
  return { id, questionKey, value };
}

/**
 * Minimal context: questions are inferred from the given answers, unless
 * `questions` is passed explicitly.
 */
export function context(input: {
  businessType?: BusinessType | null;
  questions?: QuestionSpec[];
  answers?: AnswerRecord[];
}): EvalContext {
  const answers = input.answers ?? [];
  const questions =
    input.questions ?? answers.map((a) => question(a.questionKey));

  return buildContext({
    businessType: input.businessType ?? null,
    questions,
    answers,
  });
}

export type { VisibilityRule };
