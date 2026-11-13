import type { SignalRule } from "../../types";
import { wordCount } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";

const MIN_WORDS = 10;

/**
 * `unclear_conversion` — the path to purchase isn't described.
 *
 * Unlike the other rules, this one also fires when the answer is blank:
 * `purchase_process` is optional, so its absence would never become `gray`
 * and would go unnoticed. Without knowing how the client buys today, there's
 * no way to point out where conversion stalls.
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
