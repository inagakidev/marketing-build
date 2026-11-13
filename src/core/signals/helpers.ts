/**
 * Helpers shared by the signal rules.
 *
 * Every rule reads answers through these functions so that "unanswered" is
 * handled identically in all of them.
 */

import type { AnswerRecord, EvalContext } from "../types";
import { isBlank, valueToText } from "../text";

export function getAnswer(
  ctx: EvalContext,
  key: string,
): AnswerRecord | undefined {
  const answer = ctx.answersByKey[key];
  if (!answer || isBlank(answer.value)) return undefined;
  return answer;
}

/** An answer's flattened text; empty string if unanswered. */
export function getText(ctx: EvalContext, key: string): string {
  const answer = getAnswer(ctx, key);
  return answer ? valueToText(answer.value) : "";
}

/** A multiple-choice answer's values; [] if unanswered. */
export function getValues(ctx: EvalContext, key: string): string[] {
  const answer = getAnswer(ctx, key);
  if (!answer) return [];
  return Array.isArray(answer.value) ? answer.value : [answer.value];
}

/** Ids of the given answers, ignoring missing ones. For traceability. */
export function answerIds(
  ...answers: (AnswerRecord | undefined)[]
): string[] {
  return answers.filter((a): a is AnswerRecord => a != null).map((a) => a.id);
}
