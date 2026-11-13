import type { SignalRule } from "../../types";
import { hasDigit, matchedTerms, wordCount } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import { VAGUE_GOAL_TERMS } from "../keywords";

/** Abaixo disto, a resposta é curta demais para conter uma meta real. */
const MIN_WORDS = 15;

/**
 * `vague_goal` — a meta de 6 meses não tem número nem prazo.
 *
 * A presença de um dígito é o que mais separa meta de desejo: "quero crescer"
 * vs. "quero 30 clientes novos até dezembro". Por isso qualquer resposta com
 * número escapa da regra, mesmo que curta.
 */
export const vagueGoalRule: SignalRule = {
  code: "vague_goal",
  category: "current_marketing",
  severity: "strong",

  evaluate(ctx) {
    const answer = getAnswer(ctx, Q.SUCCESS_6_MONTHS);
    // Sem resposta não é sinal: a ausência vira `gray` no diagnóstico.
    if (!answer) return null;

    const text = String(answer.value);
    if (hasDigit(text)) return null;

    const vague = matchedTerms(text, VAGUE_GOAL_TERMS);
    const isTooShort = wordCount(text) < MIN_WORDS;
    if (vague.length === 0 && !isTooShort) return null;

    const reason =
      vague.length > 0
        ? `usa apenas termos genéricos (${vague.join(", ")}) e não cita número nem prazo`
        : "é curta demais e não cita número nem prazo";

    return {
      description: `A meta de 6 meses ${reason}. Sem um alvo mensurável não há como saber se a estratégia funcionou.`,
      sourceAnswerIds: answerIds(answer),
    };
  },
};
