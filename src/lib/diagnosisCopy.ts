/**
 * The one-line explanation under each diagnosis category (DS v2 frame 04).
 * Microcopy rule: say what's there and what's missing, never judge the
 * client. Pure, so every phrasing has a unit test.
 */

type Severity = "light" | "moderate" | "strong";

const SEVERITY_ORDER: Severity[] = ["strong", "moderate", "light"];
const SEVERITY_WORD: Record<Severity, [string, string]> = {
  strong: ["forte", "fortes"],
  moderate: ["moderado", "moderados"],
  light: ["leve", "leves"],
};

const plural = (n: number, [one, many]: [string, string]) => (n === 1 ? one : many);

export function describeCategory(
  diagnosis: {
    status: string;
    signals: { severity: Severity }[];
    missingRequiredKeys: string[];
  },
  questionTextByKey: Record<string, string>,
): string {
  if (diagnosis.status === "gray") return describeMissing(diagnosis.missingRequiredKeys, questionTextByKey);

  const { signals } = diagnosis;
  if (signals.length === 0) return "Nenhum sinal de alerta.";

  const counts = SEVERITY_ORDER.map((severity) => ({
    severity,
    n: signals.filter((s) => s.severity === severity).length,
  })).filter((c) => c.n > 0);

  const total = `${signals.length} ${plural(signals.length, ["sinal", "sinais"])}`;
  if (counts.length === 1) return `${total} ${plural(counts[0].n, SEVERITY_WORD[counts[0].severity])}.`;
  return `${total}: ${counts.map((c) => `${c.n} ${plural(c.n, SEVERITY_WORD[c.severity])}`).join(", ")}.`;
}

function describeMissing(keys: string[], texts: Record<string, string>): string {
  const named = keys.map((k) => texts[k]).filter(Boolean);
  if (named.length === 0) return "Faltam respostas obrigatórias para avaliar esta categoria.";

  const quoted = named.map((t) => `“${t}”`);
  if (keys.length === 1) return `Falta 1 resposta: ${quoted[0]}.`;
  if (keys.length === 2 && quoted.length === 2) return `Faltam 2 respostas: ${quoted[0]} e ${quoted[1]}.`;
  const examples = quoted.length === 1 ? quoted[0] : `${quoted[0]} e ${quoted[1]}`;
  return `Faltam ${keys.length} respostas, entre elas ${examples}.`;
}
