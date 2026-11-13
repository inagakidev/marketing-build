import type { SignalRule } from "../../types";
import { matchedTerms, wordCount } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import { BROAD_AUDIENCE_TERMS } from "../keywords";

const MIN_WORDS = 15;

/**
 * `broad_audience` — the ideal client has no segmentation.
 *
 * "Todo mundo" (everyone) is the obvious case; the less obvious one is an
 * answer too short to contain any segmentation ("mulheres"), which doesn't
 * guide any channel or message decision either.
 */
export const broadAudienceRule: SignalRule = {
  code: "broad_audience",
  category: "audience",
  severity: "strong",

  evaluate(ctx) {
    const answer = getAnswer(ctx, Q.IDEAL_CLIENT);
    if (!answer) return null;

    const text = String(answer.value);
    const broad = matchedTerms(text, BROAD_AUDIENCE_TERMS);
    const isTooShort = wordCount(text) < MIN_WORDS;
    if (broad.length === 0 && !isTooShort) return null;

    const reason =
      broad.length > 0
        ? `descreve o público como "${broad.join('", "')}"`
        : "descreve o público em poucas palavras, sem nenhum recorte";

    return {
      description: `O cliente ideal ${reason}. Público sem recorte inviabiliza escolher canal, tom e oferta.`,
      sourceAnswerIds: answerIds(answer),
    };
  },
};
