import type { SignalRule } from "../../types";
import { wordCount } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";

const MIN_WORDS = 10;

/**
 * `unclear_conversion` — o caminho até a compra não está descrito.
 *
 * Diferente das outras regras, esta dispara também quando a resposta está em
 * branco: `purchase_process` é opcional, então a ausência nunca viraria `gray`
 * e passaria despercebida. Sem saber como o cliente compra hoje, não há como
 * apontar onde a conversão trava.
 */
export const unclearConversionRule: SignalRule = {
  code: "unclear_conversion",
  category: "offer",
  severity: "moderate",

  evaluate(ctx) {
    const answer = getAnswer(ctx, Q.PURCHASE_PROCESS);

    if (!answer) {
      return {
        description:
          "O processo de compra atual não foi descrito. Sem mapear o caminho até a venda não é possível identificar onde a conversão trava.",
        sourceAnswerIds: [],
      };
    }

    if (wordCount(String(answer.value)) >= MIN_WORDS) return null;

    return {
      description:
        "O processo de compra atual foi descrito em poucas palavras, sem etapas identificáveis. Vale detalhar o caminho do primeiro contato até o pagamento.",
      sourceAnswerIds: answerIds(answer),
    };
  },
};
