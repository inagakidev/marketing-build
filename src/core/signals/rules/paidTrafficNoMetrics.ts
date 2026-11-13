import type { SignalRule } from "../../types";
import { containsAny, hasDigit } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import { NO_PAID_TRAFFIC_TERMS } from "../keywords";

/**
 * `paid_traffic_no_metrics` — investiu em tráfego pago, mas não sabe o
 * resultado em número.
 *
 * Severidade `light` de propósito: é uma lacuna de informação a levantar na
 * reunião, não um erro de estratégia. Quem respondeu que nunca investiu não
 * dispara a regra — não há métrica a cobrar.
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
