import type { DetectedSignal, EvalContext, SignalRule } from "../types";
import { resolveVisibility } from "../visibility";
import { SIGNAL_RULES } from "./registry";

/**
 * Runs every rule and returns the detected signals.
 *
 * Before evaluating, the context is filtered to contain only answers to
 * VISIBLE questions. Without this, a client who answered as `local_business`
 * and then switched to `ecommerce` would carry orphan answers able to fire
 * signals about questions they no longer even see — the same criterion
 * already applied in `resolveVisibility`.
 */
export function runSignals(
  ctx: EvalContext,
  rules: readonly SignalRule[] = SIGNAL_RULES,
): DetectedSignal[] {
  const visibleCtx = withVisibleAnswersOnly(ctx);

  const detected: DetectedSignal[] = [];
  for (const rule of rules) {
    const hit = rule.evaluate(visibleCtx);
    if (!hit) continue;

    detected.push({
      code: rule.code,
      category: rule.category,
      severity: rule.severity,
      description: hit.description,
      sourceAnswerIds: hit.sourceAnswerIds,
    });
  }
  return detected;
}

/** An equivalent context, without answers to invisible questions. */
export function withVisibleAnswersOnly(ctx: EvalContext): EvalContext {
  const visible = resolveVisibility(ctx);

  const answersByKey: EvalContext["answersByKey"] = {};
  for (const [key, answer] of Object.entries(ctx.answersByKey)) {
    if (visible.has(key)) answersByKey[key] = answer;
  }

  return { ...ctx, answersByKey };
}
