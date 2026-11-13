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
 * A question as declared in the seed. `order` doesn't appear here: it's
 * assigned automatically by position in the list, so reordering questions
 * means moving lines instead of renumbering everything by hand.
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

/** "Only shown for this business type" rule. */
export function onlyFor(businessType: string): VisibilityRule {
  return { field: "business_type", operator: "equals", value: businessType };
}

/** Options from [value, label] pairs. */
export function options(
  ...pairs: [string, string][]
): QuestionOption[] {
  return pairs.map(([value, label]) => ({ value, label }));
}
