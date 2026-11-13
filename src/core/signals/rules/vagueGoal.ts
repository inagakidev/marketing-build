import type { SignalRule } from "../../types";
import { hasDigit, matchedTerms, wordCount } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import { VAGUE_GOAL_TERMS } from "../keywords";

/** Below this, the answer is too short to contain a real goal. */
const MIN_WORDS = 15;

/**
 * `vague_goal` — the 6-month goal has no number or deadline.
 *
 * A digit is what best separates a goal from a wish: "quero crescer" vs.
 * "quero 30 clientes novos até dezembro". That's why any answer with a number
 * escapes the rule, even a short one.
 */
export const vagueGoalRule: SignalRule = {
  code: "vague_goal",
  category: "current_marketing",
  severity: "strong",

  evaluate(ctx) {
    const answer = getAnswer(ctx, Q.SUCCESS_6_MONTHS);
    // No answer isn't a signal: the absence becomes `gray` in the diagnosis.
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
