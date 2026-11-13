import type { EvalContext, QuestionCategory, QuestionSpec } from "./types";
import { visibleQuestions } from "./visibility";
import {
  QUESTION_CATEGORY_LABELS,
  QUESTION_CATEGORY_ORDER,
} from "./diagnosis/categoryMap";

/**
 * Montagem das etapas do formulário público.
 *
 * Nem uma pergunta por vez (lento e cansativo), nem uma lista única enorme
 * (intimidadora): blocos por categoria, com teto de perguntas por tela.
 */

/** Teto de perguntas por etapa. Categoria maior que isso vira várias etapas. */
export const MAX_QUESTIONS_PER_STEP = 6;

export interface FormStep {
  /** Índice base 1, para "Etapa 3 de 8". */
  index: number;
  category: QuestionCategory;
  title: string;
  /** Verdadeiro quando a categoria foi dividida e esta não é a primeira parte. */
  continued: boolean;
  questionKeys: string[];
}

/**
 * Divide as perguntas visíveis em etapas.
 *
 * ATENÇÃO ao consumir: o total de etapas MUDA quando `business_type` é
 * respondida, porque a ramificação acrescenta perguntas. Isso é esperado — a
 * interface precisa deixar claro que o formulário cresceu, senão parece bug.
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
