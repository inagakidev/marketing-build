import type { SignalRule } from "../../types";
import { containsAny, normalize } from "../../text";
import { CONVERSION_GOALS, Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";
import { CTA_OFFER_TERMS } from "../keywords";

/**
 * Respostas de presença digital varridas em busca de menção a conversão.
 * Se nenhuma delas fala em oferta ou chamada para ação, a execução não está
 * apontada para o objetivo declarado.
 */
const DIGITAL_PRESENCE_KEYS: readonly string[] = [
  Q.ACTIVE_CHANNELS,
  Q.POSTING_FREQUENCY,
  Q.PAID_TRAFFIC,
  Q.WHAT_WORKED,
  Q.WHAT_DID_NOT_WORK,
];

/**
 * `goal_behavior_contradiction` — quer vendas/leads, mas nada na presença
 * digital aponta para conversão.
 *
 * É o sinal mais caro do conjunto (`strong`) porque contradiz o objetivo
 * declarado: publicar conteúdo sem nenhuma oferta ou chamada para ação e
 * esperar venda é o descompasso mais comum — e o mais caro de não corrigir.
 */
export const goalBehaviorContradictionRule: SignalRule = {
  code: "goal_behavior_contradiction",
  category: "current_marketing",
  severity: "strong",

  evaluate(ctx) {
    const goalAnswer = getAnswer(ctx, Q.CLOSEST_GOAL);
    if (!goalAnswer) return null;

    const goal = normalize(String(goalAnswer.value));
    if (!CONVERSION_GOALS.includes(goal)) return null;

    const presenceAnswers = DIGITAL_PRESENCE_KEYS.map((key) =>
      getAnswer(ctx, key),
    ).filter((a) => a != null);

    const mentionsConversion = presenceAnswers.some((answer) =>
      containsAny(
        Array.isArray(answer.value) ? answer.value.join(" ") : answer.value,
        CTA_OFFER_TERMS,
      ),
    );
    if (mentionsConversion) return null;

    return {
      description: `O objetivo declarado é "${goal}", mas nenhuma resposta sobre presença digital menciona oferta ou chamada para ação. A execução atual não está apontada para o objetivo.`,
      sourceAnswerIds: answerIds(goalAnswer, ...presenceAnswers),
    };
  },
};
