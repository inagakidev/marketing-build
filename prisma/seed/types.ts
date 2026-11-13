import type {
  AnswerType,
  QuestionCategory,
  VisibilityRule,
} from "../../src/core/types";

export interface QuestionOption {
  value: string;
  label: string;
}

/**
 * Uma pergunta como declarada no seed. `order` não aparece aqui: é atribuído
 * automaticamente pela posição na lista, para que reordenar perguntas seja
 * mover linhas em vez de renumerar tudo à mão.
 */
export interface QuestionSeed {
  key: string;
  text: string;
  category: QuestionCategory;
  answerType: AnswerType;
  required?: boolean;
  helpText?: string;
  options?: QuestionOption[];
  visibilityRule?: VisibilityRule;
}

/** Regra "só aparece para este tipo de negócio". */
export function onlyFor(businessType: string): VisibilityRule {
  return { field: "business_type", operator: "equals", value: businessType };
}

/** Opções a partir de pares [valor, rótulo]. */
export function options(
  ...pairs: [string, string][]
): QuestionOption[] {
  return pairs.map(([value, label]) => ({ value, label }));
}
