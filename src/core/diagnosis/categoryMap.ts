import type { DiagnosisCategory, QuestionCategory } from "../types";

/**
 * Which diagnosis category each question category belongs to.
 *
 * The two sets are distinct on purpose. QUESTION categories exist to group
 * the form into blocks that make sense to the respondent ("brand",
 * "competition"). DIAGNOSIS categories exist to group what is evaluated
 * together — and several question categories feed the same evaluation: brand,
 * business and competition together make up positioning.
 *
 * `closing` feeds none: they're wrap-up questions with no weight in the
 * evaluation.
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

/** The evaluated categories, in the order they appear in the panel. */
export const DIAGNOSIS_CATEGORIES: readonly DiagnosisCategory[] = [
  "positioning",
  "audience",
  "offer",
  "digital_presence",
  "current_marketing",
];

/** Portuguese labels for the panel and the PDF (user-facing). */
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

/** Order of the blocks in the public form. */
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
