import type { SignalRule } from "../../types";
import { containsAny, normalize } from "../../text";
import { CONVERSION_GOALS, Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import { CTA_OFFER_TERMS } from "../keywords";

/**
 * Digital-presence answers scanned for any mention of conversion. If none of
 * them talks about an offer or a call to action, execution isn't aimed at the
 * stated goal.
 */
const DIGITAL_PRESENCE_KEYS: readonly string[] = [
  Q.ACTIVE_CHANNELS,
  Q.POSTING_FREQUENCY,
  Q.PAID_TRAFFIC,
  Q.WHAT_WORKED,
  Q.WHAT_DID_NOT_WORK,
];

/**
 * `goal_behavior_contradiction` — wants sales/leads, but nothing in the
 * digital presence points to conversion.
 *
 * It's the costliest signal in the set (`strong`) because it contradicts the
 * stated goal: publishing content without any offer or call to action and
 * expecting sales is the most common mismatch — and the costliest to leave
 * uncorrected.
 */
export const goalBehaviorContradictionRule: SignalRule = {
  code: "goal_behavior_contradiction",
  category: "current_marketing",
  severity: "strong",

  evaluate(ctx) {
    const goalAnswer = getAnswer(ctx, Q.CLOSEST_GOAL);
    if (!goalAnswer) return null;

    const goal = normalize(String(goalAnswer.value));
    if (!CONVERSION_GOALS.includes(goal)) return null;

    const presenceAnswers = DIGITAL_PRESENCE_KEYS.map((key) =>
      getAnswer(ctx, key),
    ).filter((a) => a != null);

    const mentionsConversion = presenceAnswers.some((answer) =>
      containsAny(
        Array.isArray(answer.value) ? answer.value.join(" ") : answer.value,
        CTA_OFFER_TERMS,
      ),
    );
    if (mentionsConversion) return null;

    return {
      description: `O objetivo declarado é "${goal}", mas nenhuma resposta sobre presença digital menciona oferta ou chamada para ação. A execução atual não está apontada para o objetivo.`,
      sourceAnswerIds: answerIds(goalAnswer, ...presenceAnswers),
    };
  },
};
