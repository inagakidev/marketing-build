import type { SignalRule } from "../../types";
import { tokenOverlap } from "../../text";
import { Q } from "../../questionKeys";
import { answerIds, getAnswer } from "../helpers";

/**
 * Abaixo desta sobreposição de vocabulário, tratamos as duas percepções como
 * distantes. Valor calibrado para ser tolerante: 0,15 exige que praticamente
 * nenhuma palavra de conteúdo se repita entre as duas respostas.
 */
const MAX_DISTANT_OVERLAP = 0.15;

/**
 * `positioning_gap` — a percepção desejada está longe da atual.
 *
 * Não é um defeito da resposta, e sim do trabalho pela frente: quanto maior a
 * distância entre como a marca é vista hoje e como quer ser vista, maior o
 * esforço de reposicionamento — e maior o risco de a comunicação soar
 * inverossímil se a mudança for tratada como um simples ajuste de tom.
 *
 * HEURÍSTICA INICIAL, deliberadamente simples: sobreposição de vocabulário
 * (índice de Jaccard sobre tokens significativos). Ela não entende sinônimos —
 * "barata" e "acessível" contam como palavras diferentes. A evolução natural é
 * trocar `tokenOverlap` por similaridade de embeddings, mantendo esta mesma
 * assinatura de regra; nada além deste arquivo precisaria mudar.
 */
export const positioningGapRule: SignalRule = {
  code: "positioning_gap",
  category: "positioning",
  severity: "moderate",

  evaluate(ctx) {
    const current = getAnswer(ctx, Q.CURRENT_PERCEPTION);
    const desired = getAnswer(ctx, Q.DESIRED_PERCEPTION);
    // Faltando qualquer uma das duas, não há distância a medir. A ausência já
    // é tratada como dado obrigatório faltante no diagnóstico.
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
