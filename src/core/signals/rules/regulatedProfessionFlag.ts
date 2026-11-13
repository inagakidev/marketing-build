import type { SignalRule } from "../../types";
import { containsAny, matchedTerms } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import {
  REGULATED_FIELD_TERMS,
  REGULATION_AWARENESS_TERMS,
} from "../keywords";

/**
 * Fields where a mention of advertising caution would naturally appear.
 * "Deadline/budget/restriction" is the most likely place after the description.
 */
const AWARENESS_KEYS: readonly string[] = [
  Q.BUSINESS_DESCRIPTION,
  Q.PRODUCTS_SERVICES,
  Q.CONSTRAINTS,
];

/**
 * `regulated_profession_flag` — a freelancer in a field with regulated
 * advertising, with no mention of advertising restrictions.
 *
 * It's not a judgment about the business: it's a reminder that the campaign
 * must go through the professional council's rules (CFM, OAB, CVM…) before
 * going live. Finding out after the piece is done costs rework.
 *
 * The branch question `free_regulated_council` exists precisely to raise the
 * topic — if it was answered, the subject is already on the table and the
 * rule doesn't fire, even when the answer is "there's no restriction".
 */
export const regulatedProfessionFlagRule: SignalRule = {
  code: "regulated_profession_flag",
  category: "positioning",
  severity: "moderate",

  evaluate(ctx) {
    if (ctx.businessType !== "freelancer") return null;

    const description = getAnswer(ctx, Q.BUSINESS_DESCRIPTION);
    if (!description) return null;

    const fields = matchedTerms(String(description.value), REGULATED_FIELD_TERMS);
    if (fields.length === 0) return null;

    // The topic was already raised explicitly by the branch question.
    if (getAnswer(ctx, Q.FREE_REGULATED_COUNCIL)) return null;

    const mentionsRegulation = AWARENESS_KEYS.some((key) =>
      containsAny(
        String(getAnswer(ctx, key)?.value ?? ""),
        REGULATION_AWARENESS_TERMS,
      ),
    );
    if (mentionsRegulation) return null;

    return {
      description: `A atuação é em área de publicidade regulada (${fields.join(", ")}) e nada foi dito sobre restrições de divulgação. Confirmar as regras do conselho de classe antes de produzir as peças.`,
      sourceAnswerIds: answerIds(description),
    };
  },
};
