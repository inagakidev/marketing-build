import type { SignalRule } from "../../types";
import { containsAny, matchedTerms } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import {
  REGULATED_FIELD_TERMS,
  REGULATION_AWARENESS_TERMS,
} from "../keywords";

/**
 * Campos onde uma menção a cuidado com divulgação apareceria naturalmente.
 * "Prazo/orçamento/restrição" é o lugar mais provável depois da descrição.
 */
const AWARENESS_KEYS: readonly string[] = [
  Q.BUSINESS_DESCRIPTION,
  Q.PRODUCTS_SERVICES,
  Q.CONSTRAINTS,
];

/**
 * `regulated_profession_flag` — autônoma de área com publicidade regulada, sem
 * menção a restrição de divulgação.
 *
 * Não é um julgamento sobre o negócio: é um lembrete de que a campanha precisa
 * passar pelas regras do conselho de classe (CFM, OAB, CVM…) antes de ir ao ar.
 * Descobrir isso depois da peça pronta custa retrabalho.
 *
 * A pergunta ramificada `free_regulated_council` existe justamente para
 * levantar o tema — se ela foi respondida, o assunto já está na mesa e a regra
 * não dispara, inclusive quando a resposta é "não há restrição".
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

    // O tema já foi levantado explicitamente pela pergunta ramificada.
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
