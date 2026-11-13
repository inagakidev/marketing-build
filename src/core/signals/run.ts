import type { DetectedSignal, EvalContext, SignalRule } from "../types";
import { resolveVisibility } from "../visibility";
import { SIGNAL_RULES } from "./registry";

/**
 * Roda todas as regras e devolve os sinais detectados.
 *
 * Antes de avaliar, o contexto é filtrado para conter apenas respostas de
 * perguntas VISÍVEIS. Sem isso, um cliente que respondeu como `local_business`
 * e depois trocou para `ecommerce` carregaria respostas órfãs capazes de
 * disparar sinais sobre perguntas que ele nem enxerga mais — o mesmo critério
 * já aplicado em `resolveVisibility`.
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

/** Um contexto equivalente, sem as respostas de perguntas invisíveis. */
export function withVisibleAnswersOnly(ctx: EvalContext): EvalContext {
  const visible = resolveVisibility(ctx);

  const answersByKey: EvalContext["answersByKey"] = {};
  for (const [key, answer] of Object.entries(ctx.answersByKey)) {
    if (visible.has(key)) answersByKey[key] = answer;
  }

  return { ...ctx, answersByKey };
}
