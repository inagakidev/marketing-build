import type { DiagnosisCategory, QuestionCategory } from "../types";

/**
 * De qual categoria de diagnóstico cada categoria de pergunta faz parte.
 *
 * Os dois conjuntos são distintos de propósito. As categorias de PERGUNTA
 * existem para agrupar o formulário em blocos que fazem sentido para quem
 * responde ("marca", "concorrência"). As categorias de DIAGNÓSTICO existem
 * para agrupar o que é avaliado junto — e várias categorias de pergunta
 * alimentam a mesma avaliação: marca, negócio e concorrência formam, juntas,
 * o posicionamento.
 *
 * `closing` não alimenta nenhuma: são perguntas de arremate, sem peso na
 * avaliação.
 */
export const QUESTION_TO_DIAGNOSIS_CATEGORY: Readonly<
  Record<QuestionCategory, DiagnosisCategory | null>
> = {
  business: "positioning",
  brand: "positioning",
  competition: "positioning",
  audience: "audience",
  offer: "offer",
  digital_presence: "digital_presence",
  goals: "current_marketing",
  closing: null,
};

/** As categorias avaliadas, na ordem em que aparecem no painel. */
export const DIAGNOSIS_CATEGORIES: readonly DiagnosisCategory[] = [
  "positioning",
  "audience",
  "offer",
  "digital_presence",
  "current_marketing",
];

/** Rótulos em português para o painel e o PDF. */
export const DIAGNOSIS_CATEGORY_LABELS: Readonly<
  Record<DiagnosisCategory, string>
> = {
  positioning: "Posicionamento",
  audience: "Público",
  offer: "Oferta",
  digital_presence: "Presença digital",
  current_marketing: "Marketing atual",
};

export const QUESTION_CATEGORY_LABELS: Readonly<
  Record<QuestionCategory, string>
> = {
  business: "O negócio",
  goals: "Objetivos",
  audience: "Público",
  brand: "Marca",
  competition: "Concorrência",
  digital_presence: "Presença digital",
  offer: "Oferta",
  closing: "Para finalizar",
};

/** Ordem dos blocos no formulário público. */
export const QUESTION_CATEGORY_ORDER: readonly QuestionCategory[] = [
  "business",
  "goals",
  "audience",
  "brand",
  "competition",
  "digital_presence",
  "offer",
  "closing",
];
