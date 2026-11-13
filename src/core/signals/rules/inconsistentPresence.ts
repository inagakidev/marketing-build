import type { SignalRule } from "../../types";
import { normalize } from "../../text";
import { POSTING, Q } from "../../questionKeys";
import { answerIds, getAnswer, getValues } from "../helpers";

/** Frequências que caracterizam presença abandonada ou irregular. */
const INCONSISTENT_FREQUENCIES: readonly string[] = [
  POSTING.SPORADIC,
  POSTING.STOPPED,
];

/**
 * `inconsistent_presence` — há canais ativos, mas sem cadência.
 *
 * Perfil parado é pior do que perfil inexistente: o visitante que chega
 * encontra a última publicação de meses atrás e conclui que o negócio parou.
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
