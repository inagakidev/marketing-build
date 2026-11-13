import type { SignalRule } from "../../types";
import { contentTokens, matchedTerms, words } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import { GENERIC_DIFFERENTIATOR_TERMS } from "../keywords";

/**
 * How many own tokens (outside the generic vocabulary) are enough to consider
 * the answer contains something specific.
 */
const MIN_SPECIFIC_TOKENS = 3;

/** Tokens that make up the generic terms — excluded from the count. */
const GENERIC_TOKENS: ReadonlySet<string> = new Set(
  GENERIC_DIFFERENTIATOR_TERMS.flatMap((term) => words(term)),
);

/**
 * `generic_differentiator` — the differentiator applies to any competitor.
 *
 * Mentioning "qualidade" isn't enough: the rule only fires if, once generic
 * terms are removed, almost nothing is left. "Qualidade no atendimento e o
 * único ateliê da cidade com forno a lenha importado" mentions "qualidade" but
 * has substance — so it doesn't fire.
 */
export const genericDifferentiatorRule: SignalRule = {
  code: "generic_differentiator",
  category: "positioning",
  severity: "moderate",

  evaluate(ctx) {
    const answer = getAnswer(ctx, Q.DIFFERENTIATOR);
    if (!answer) return null;

    const text = String(answer.value);
    const generic = matchedTerms(text, GENERIC_DIFFERENTIATOR_TERMS);
    if (generic.length === 0) return null;

    const specific = [...contentTokens(text)].filter(
      (token) => !GENERIC_TOKENS.has(token),
    );
    if (specific.length >= MIN_SPECIFIC_TOKENS) return null;

    return {
      description: `O diferencial se apoia em termos que qualquer concorrente também alegaria (${generic.join(", ")}), sem nada verificável. Isso não sustenta posicionamento.`,
      sourceAnswerIds: answerIds(answer),
    };
  },
};
