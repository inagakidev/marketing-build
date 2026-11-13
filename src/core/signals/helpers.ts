/**
 * Auxiliares comuns às regras de sinal.
 *
 * Todas as regras leem respostas por estas funções para que o tratamento de
 * "não respondida" seja idêntico em todas elas.
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

/** Texto achatado de uma resposta; string vazia se não respondida. */
export function getText(ctx: EvalContext, key: string): string {
  const answer = getAnswer(ctx, key);
  return answer ? valueToText(answer.value) : "";
}

/** Valores de uma resposta de múltipla escolha; [] se não respondida. */
export function getValues(ctx: EvalContext, key: string): string[] {
  const answer = getAnswer(ctx, key);
  if (!answer) return [];
  return Array.isArray(answer.value) ? answer.value : [answer.value];
}

/** Ids das respostas informadas, ignorando as ausentes. Para rastreabilidade. */
export function answerIds(
  ...answers: (AnswerRecord | undefined)[]
): string[] {
  return answers.filter((a): a is AnswerRecord => a != null).map((a) => a.id);
}
