import type {
  CategoryDiagnosis,
  DetectedSignal,
  DiagnosisCategory,
  EvalContext,
} from "../types";
import { Q } from "../questionKeys";
import { valueToText } from "../text";
import { DIAGNOSIS_CATEGORY_LABELS } from "./categoryMap";

export interface DiagnosisProblem {
  category: DiagnosisCategory;
  label: string;
  score: number;
  signals: DetectedSignal[];
}

export interface DiagnosisOpportunity {
  /** Present when the opportunity comes from a well-rated category. */
  category?: DiagnosisCategory;
  label: string;
  detail: string;
}

export interface DiagnosisSummary {
  problems: DiagnosisProblem[];
  opportunities: DiagnosisOpportunity[];
}

/**
 * Builds the panel's two lists from the already computed diagnosis.
 *
 * Problems = red categories, worst first, each with the signals that caused
 * the drop (sorted by weight, so the main cause appears first).
 *
 * Opportunities = green categories, the levers already ready to use, plus
 * what the client reported has worked — the cheapest evidence there is,
 * because it's already been validated in their business.
 */
export function buildSummary(
  ctx: EvalContext,
  diagnoses: readonly CategoryDiagnosis[],
): DiagnosisSummary {
  const problems: DiagnosisProblem[] = diagnoses
    .filter((d) => d.status === "red" && d.score != null)
    .map((d) => ({
      category: d.category,
      label: DIAGNOSIS_CATEGORY_LABELS[d.category],
      score: d.score as number,
      signals: [...d.signals].sort(
        (a, b) => severityWeight(b.severity) - severityWeight(a.severity),
      ),
    }))
    .sort((a, b) => a.score - b.score);

  const opportunities: DiagnosisOpportunity[] = diagnoses
    .filter((d) => d.status === "green")
    .map((d) => ({
      category: d.category,
      label: DIAGNOSIS_CATEGORY_LABELS[d.category],
      detail:
        "Categoria bem definida — pode ser usada como base para as demais em vez de ser retrabalhada.",
    }));

  const whatWorked = valueToText(ctx.answersByKey[Q.WHAT_WORKED]?.value).trim();
  if (whatWorked) {
    opportunities.push({
      label: "O que já funcionou",
      detail: whatWorked,
    });
  }

  return { problems, opportunities };
}

function severityWeight(severity: DetectedSignal["severity"]): number {
  if (severity === "strong") return 3;
  if (severity === "moderate") return 2;
  return 1;
}
