import type { SignalRule } from "../../types";
import { tokenOverlap } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";

/**
 * Below this vocabulary overlap, the two perceptions are treated as distant.
 * Calibrated to be lenient: 0.15 requires practically no content word to be
 * repeated between the two answers.
 */
const MAX_DISTANT_OVERLAP = 0.15;

/**
 * `positioning_gap` — the desired perception is far from the current one.
 *
 * It's not a flaw in the answer but in the work ahead: the bigger the distance
 * between how the brand is seen today and how it wants to be seen, the bigger
 * the repositioning effort — and the bigger the risk of the communication
 * sounding implausible if the change is treated as a simple tone adjustment.
 *
 * INITIAL HEURISTIC, deliberately simple: vocabulary overlap (Jaccard index on
 * meaningful tokens). It doesn't understand synonyms — "barata" and
 * "acessível" count as different words. The natural evolution is to swap
 * `tokenOverlap` for embedding similarity while keeping this same
 * rule signature; nothing beyond this file would need to change.
 */
export const positioningGapRule: SignalRule = {
  code: "positioning_gap",
  category: "positioning",
  severity: "moderate",

  evaluate(ctx) {
    const current = getAnswer(ctx, Q.CURRENT_PERCEPTION);
    const desired = getAnswer(ctx, Q.DESIRED_PERCEPTION);
    // If either is missing, there's no distance to measure. The absence is
    // already handled as missing required data in the diagnosis.
    if (!current || !desired) return null;

    const overlap = tokenOverlap(String(current.value), String(desired.value));
    if (overlap > MAX_DISTANT_OVERLAP) return null;

    return {
      description:
        "A percepção desejada quase não compartilha vocabulário com a percepção atual, indicando um reposicionamento amplo — não um ajuste de tom. Vale confirmar se a distância é intencional e se há prova para sustentá-la.",
      sourceAnswerIds: answerIds(current, desired),
    };
  },
};
