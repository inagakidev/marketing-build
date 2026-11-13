import type { AnswerType, AnswerValue, QuestionOption } from "./types";

/**
 * Validação semântica de uma resposta contra o catálogo (DATA-03, FORM-05).
 *
 * O schema da borda (zod) só garante "string ou lista de strings". Aqui se
 * confere o que só o catálogo sabe: o formato certo para o tipo da pergunta,
 * opções que existem e limites de tamanho. Uma resposta inválida nunca chega
 * ao banco nem ao diagnóstico.
 *
 * Valores em branco não passam por aqui: em branco significa "limpar a
 * resposta" e é tratado antes (ver `saveAnswers`).
 */

export const ANSWER_LIMITS = {
  shortText: 500,
  longText: 10_000,
} as const;

export interface AnswerValidationTarget {
  answerType: AnswerType;
  options: QuestionOption[] | null;
}

/** Devolve a mensagem de erro (pt-BR), ou `null` quando o valor é válido. */
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
