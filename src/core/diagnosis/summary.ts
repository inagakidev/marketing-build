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
  /** Presente quando a oportunidade vem de uma categoria bem avaliada. */
  category?: DiagnosisCategory;
  label: string;
  detail: string;
}

export interface DiagnosisSummary {
  problems: DiagnosisProblem[];
  opportunities: DiagnosisOpportunity[];
}

/**
 * Monta as duas listas do painel a partir do diagnóstico já calculado.
 *
 * Problemas = categorias vermelhas, da pior para a menos pior, cada uma com os
 * sinais que causaram a queda (ordenados por peso, para a causa principal
 * aparecer primeiro).
 *
 * Oportunidades = categorias verdes, que são as alavancas já prontas para usar,
 * mais o que o próprio cliente relatou ter funcionado — a evidência mais barata
 * que existe, porque já foi validada no negócio dele.
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
