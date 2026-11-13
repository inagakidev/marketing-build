import type { SignalRule } from "../types";
import { broadAudienceRule } from "./rules/broadAudience";
import { genericDifferentiatorRule } from "./rules/genericDifferentiator";
import { goalBehaviorContradictionRule } from "./rules/goalBehaviorContradiction";
import { inconsistentPresenceRule } from "./rules/inconsistentPresence";
import { paidTrafficNoMetricsRule } from "./rules/paidTrafficNoMetrics";
import { positioningGapRule } from "./rules/positioningGap";
import { regulatedProfessionFlagRule } from "./rules/regulatedProfessionFlag";
import { unclearConversionRule } from "./rules/unclearConversion";
import { vagueGoalRule } from "./rules/vagueGoal";

/**
 * Todas as regras de sinal. Registrar uma nova é adicionar o arquivo em
 * `rules/` e a linha aqui — nada mais no sistema precisa saber que ela existe.
 *
 * A ordem não afeta o resultado: as regras são independentes e a pontuação
 * apenas soma as penalidades.
 */
export const SIGNAL_RULES: readonly SignalRule[] = [
  // positioning
  genericDifferentiatorRule,
  positioningGapRule,
  regulatedProfessionFlagRule,
  // audience
  broadAudienceRule,
  // offer
  unclearConversionRule,
  // digital_presence
  inconsistentPresenceRule,
  // current_marketing
  vagueGoalRule,
  paidTrafficNoMetricsRule,
  goalBehaviorContradictionRule,
];
