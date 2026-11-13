import type { SignalRule } from "../../types";
import { normalize } from "../../text";
import { POSTING, Q } from "../../questionKeys";
import { answerIds, getAnswer, getValues } from "../helpers";

/** Frequencies that characterize an abandoned or irregular presence. */
const INCONSISTENT_FREQUENCIES: readonly string[] = [
  POSTING.SPORADIC,
  POSTING.STOPPED,
];

/**
 * `inconsistent_presence` — there are active channels, but no cadence.
 *
 * A stale profile is worse than no profile: a visitor finds the last post from
 * months ago and concludes the business has stopped.
 */
export const inconsistentPresenceRule: SignalRule = {
  code: "inconsistent_presence",
  category: "digital_presence",
  severity: "moderate",

  evaluate(ctx) {
    const channelsAnswer = getAnswer(ctx, Q.ACTIVE_CHANNELS);
    const frequencyAnswer = getAnswer(ctx, Q.POSTING_FREQUENCY);
    if (!channelsAnswer || !frequencyAnswer) return null;

    const channels = getValues(ctx, Q.ACTIVE_CHANNELS);
    if (channels.length === 0) return null;

    const frequency = normalize(String(frequencyAnswer.value));
    if (!INCONSISTENT_FREQUENCIES.includes(frequency)) return null;

    return {
      description: `Há ${channels.length} canal(is) ativo(s) declarado(s), mas a frequência de publicação é "${frequency}". Canal parado comunica que o negócio parou.`,
      sourceAnswerIds: answerIds(channelsAnswer, frequencyAnswer),
    };
  },
};
