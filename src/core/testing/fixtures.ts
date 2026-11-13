/**
 * Construtores de contexto para os testes.
 *
 * Ficam em `src/core` (e não em `tests/`) porque são parte do vocabulário do
 * motor: montar um contexto exige conhecer a forma de `QuestionSpec` e
 * `AnswerRecord`, e duplicar isso em cada arquivo de teste convidaria a
 * divergências.
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

/** Uma pergunta com padrões sensatos; sobrescreva só o que o teste precisa. */
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

/** Zera o contador de ordem para que cada teste seja independente. */
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
 * Contexto mínimo: as perguntas são inferidas das respostas informadas,
 * salvo se `questions` for passado explicitamente.
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
