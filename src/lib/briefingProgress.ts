/**
 * Per-step answer counts for the public form's review (DS v2 F3). Pure, so
 * the counting rules and the copy have unit tests.
 */

type Value = string | string[] | null | undefined;

export interface StepProgress {
  answered: number;
  total: number;
  optionalBlank: number;
  requiredMissing: number;
}

export function isBlank(value: Value): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  return value.trim() === "";
}

export function stepProgress(
  questionKeys: string[],
  questionByKey: ReadonlyMap<string, { required: boolean }>,
  values: Record<string, Value>,
): StepProgress {
  const progress: StepProgress = { answered: 0, total: questionKeys.length, optionalBlank: 0, requiredMissing: 0 };
  for (const key of questionKeys) {
    if (!isBlank(values[key])) progress.answered += 1;
    else if (questionByKey.get(key)?.required) progress.requiredMissing += 1;
    else progress.optionalBlank += 1;
  }
  return progress;
}

export function describeStepProgress({ answered, total, optionalBlank, requiredMissing }: StepProgress): string {
  const base = `${answered} de ${total}`;
  if (requiredMissing > 0) {
    return requiredMissing === 1 ? `${base} · falta 1 obrigatória` : `${base} · faltam ${requiredMissing} obrigatórias`;
  }
  if (optionalBlank > 0) {
    return `${base} · ${optionalBlank} ${optionalBlank === 1 ? "opcional" : "opcionais"} em branco`;
  }
  return `${base} respondidas`;
}
