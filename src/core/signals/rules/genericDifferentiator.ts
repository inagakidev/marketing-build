import type { SignalRule } from "../../types";
import { contentTokens, matchedTerms, words } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import { GENERIC_DIFFERENTIATOR_TERMS } from "../keywords";

/**
 * Quantos tokens próprios (fora do vocabulário genérico) bastam para
 * considerar que há algo específico na resposta.
 */
const MIN_SPECIFIC_TOKENS = 3;

/** Tokens que compõem os termos genéricos — descontados da contagem. */
const GENERIC_TOKENS: ReadonlySet<string> = new Set(
  GENERIC_DIFFERENTIATOR_TERMS.flatMap((term) => words(term)),
);

/**
 * `generic_differentiator` — o diferencial vale para qualquer concorrente.
 *
 * Não basta citar "qualidade": a regra só dispara se, removidos os termos
 * genéricos, quase nada sobra. "Qualidade no atendimento e o único ateliê da
 * cidade com forno a lenha importado" cita "qualidade", mas tem substância —
 * e por isso não dispara.
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
