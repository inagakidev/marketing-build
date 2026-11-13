import type { SignalRule } from "../../types";
import { containsAny, hasDigit } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import { NO_PAID_TRAFFIC_TERMS } from "../keywords";

/**
 * `paid_traffic_no_metrics` — invested in paid traffic but doesn't know the
 * result in numbers.
 *
 * `light` severity on purpose: it's an information gap to raise in the
 * meeting, not a strategy error. Whoever answered they never invested doesn't
 * trigger the rule — there's no metric to ask for.
 */
export const paidTrafficNoMetricsRule: SignalRule = {
  code: "paid_traffic_no_metrics",
  category: "current_marketing",
  severity: "light",

  evaluate(ctx) {
    const answer = getAnswer(ctx, Q.PAID_TRAFFIC);
    if (!answer) return null;

    const text = String(answer.value);
    if (containsAny(text, NO_PAID_TRAFFIC_TERMS)) return null;
    if (hasDigit(text)) return null;

    return {
      description:
        "Houve investimento em tráfego pago, mas a resposta não traz nenhum número (valor investido, retorno, custo por lead). Sem isso não dá para saber se o canal funcionou.",
      sourceAnswerIds: answerIds(answer),
    };
  },
};
