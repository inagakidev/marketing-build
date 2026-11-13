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
 * All signal rules. Registering a new one means adding the file in `rules/`
 * and the line here — nothing else in the system needs to know it exists.
 *
 * Order doesn't affect the result: rules are independent and scoring just
 * adds up the penalties.
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
