import type { EvalContext, QuestionCategory, QuestionSpec } from "./types";
import { visibleQuestions } from "./visibility";
import {
  QUESTION_CATEGORY_LABELS,
  QUESTION_CATEGORY_ORDER,
} from "./diagnosis/categoryMap";

/**
 * Builds the public form's steps.
 *
 * Neither one question at a time (slow and tiring) nor one huge list
 * (intimidating): blocks by category, with a cap on questions per screen.
 */

/** Cap on questions per step. A larger category becomes several steps. */
export const MAX_QUESTIONS_PER_STEP = 6;

export interface FormStep {
  /** 1-based index, for "Etapa 3 de 8". */
  index: number;
  category: QuestionCategory;
  title: string;
  /** True when the category was split and this isn't the first part. */
  continued: boolean;
  questionKeys: string[];
}

/**
 * Splits the visible questions into steps.
 *
 * CAREFUL when consuming: the number of steps CHANGES when `business_type` is
 * answered, because the branch adds questions. That's expected — the UI must
 * make clear the form grew, otherwise it looks like a bug.
 */
export function buildSteps(ctx: EvalContext): FormStep[] {
  const visible = visibleQuestions(ctx);
  const byCategory = groupByCategory(visible);

  const steps: FormStep[] = [];
  for (const category of QUESTION_CATEGORY_ORDER) {
    const questions = byCategory.get(category);
    if (!questions || questions.length === 0) continue;

    for (let start = 0; start < questions.length; start += MAX_QUESTIONS_PER_STEP) {
      const slice = questions.slice(start, start + MAX_QUESTIONS_PER_STEP);
      steps.push({
        index: steps.length + 1,
        category,
        title: QUESTION_CATEGORY_LABELS[category],
        continued: start > 0,
        questionKeys: slice.map((q) => q.key),
      });
    }
  }

  return steps;
}

function groupByCategory(
  questions: QuestionSpec[],
): Map<QuestionCategory, QuestionSpec[]> {
  const grouped = new Map<QuestionCategory, QuestionSpec[]>();
  for (const question of questions) {
    const list = grouped.get(question.category);
    if (list) list.push(question);
    else grouped.set(question.category, [question]);
  }
  return grouped;
}
