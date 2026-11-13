import type { AnswerType, AnswerValue, QuestionOption } from "./types";

/**
 * Semantic validation of an answer against the catalog (DATA-03, FORM-05).
 *
 * The boundary schema (zod) only guarantees "string or list of strings". This
 * checks what only the catalog knows: the right shape for the question type,
 * options that exist and length limits. An invalid answer never reaches the
 * database or the diagnosis.
 *
 * Blank values don't come through here: blank means "clear the answer" and is
 * handled earlier (see `saveAnswers`).
 */

export const ANSWER_LIMITS = {
  shortText: 500,
  longText: 10_000,
} as const;

export interface AnswerValidationTarget {
  answerType: AnswerType;
  options: QuestionOption[] | null;
}

/** Returns the error message (pt-BR, user-facing), or `null` when the value is valid. */
export function validateAnswerValue(
  question: AnswerValidationTarget,
  value: AnswerValue,
): string | null {
  switch (question.answerType) {
    case "short_text":
    case "long_text": {
      if (typeof value !== "string") return "Esta pergunta espera um texto.";
      const max =
        question.answerType === "short_text" ? ANSWER_LIMITS.shortText : ANSWER_LIMITS.longText;
      if (value.length > max) return `Use no máximo ${max} caracteres.`;
      return null;
    }

    case "single_choice": {
      if (typeof value !== "string") return "Escolha apenas uma opção.";
      return isKnownOption(question, value) ? null : "Escolha uma das opções disponíveis.";
    }

    case "multi_choice": {
      if (!Array.isArray(value)) return "Esta pergunta espera uma lista de opções.";
      if (new Set(value).size !== value.length) return "Há opções repetidas.";
      return value.every((v) => isKnownOption(question, v))
        ? null
        : "Escolha apenas entre as opções disponíveis.";
    }
  }
}

function isKnownOption(question: AnswerValidationTarget, value: string): boolean {
  return (question.options ?? []).some((option) => option.value === value);
}
