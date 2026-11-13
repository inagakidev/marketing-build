/**
 * Text utilities for the signal rules.
 *
 * Everything here works on NORMALIZED text (lowercase, no accents), because
 * answers are typed by hand by clients: "Não sei", "nao sei" and "NÃO SEI"
 * must collide. No rule should compare raw text.
 */

import type { AnswerValue, QuestionOption } from "./types";

/** Lowercase, no accents, collapsed whitespace. */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strips the diacritics split off by NFD
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Flattens an answer value into a single string. multi_choice becomes the
 * options separated by spaces, which is enough for term search.
 */
export function valueToText(value: AnswerValue | undefined | null): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(" ");
  return value;
}

/**
 * Swaps the stored code(s) for the option's readable label, for display in
 * the panel and the PDF. Without `options` (text questions) or without a label
 * registered for the code, returns the raw value as is.
 */
export function toDisplayValue(
  value: AnswerValue | null | undefined,
  options: readonly QuestionOption[] | null,
): string | string[] | null {
  if (value == null) return null;
  if (!options || options.length === 0) return value;

  const labelByValue = new Map(options.map((o) => [o.value, o.label]));
  if (Array.isArray(value)) {
    return value.map((v) => labelByValue.get(v) ?? v);
  }
  return labelByValue.get(value) ?? value;
}

/** An answer is empty if it has no useful content (blank string or []). */
export function isBlank(value: AnswerValue | undefined | null): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((v) => v.trim() === "");
  }
  return value.trim() === "";
}

/** Alphanumeric tokens of the normalized text. */
export function words(input: string): string[] {
  const normalized = normalize(input);
  if (!normalized) return [];
  return normalized.split(/[^a-z0-9]+/).filter(Boolean);
}

export function wordCount(input: string): number {
  return words(input).length;
}

/** Does the text contain any digit? Used to detect a goal without a number. */
export function hasDigit(input: string): boolean {
  return /\d/.test(input);
}

/**
 * Does the text contain any of the terms? Compares on the normalized form and
 * respects word boundaries, so "caro" doesn't match inside "carro". Terms
 * with spaces ("todo mundo") are searched as a phrase.
 */
export function containsAny(input: string, terms: readonly string[]): boolean {
  return matchedTerms(input, terms).length > 0;
}

/** Like `containsAny`, but returns which terms matched (useful in messages). */
export function matchedTerms(
  input: string,
  terms: readonly string[],
): string[] {
  const haystack = normalize(input);
  if (!haystack) return [];

  return terms.filter((term) => {
    const needle = normalize(term);
    if (!needle) return false;
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`,
    );
    return pattern.test(haystack);
  });
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Portuguese stopwords. Removed before measuring overlap between two texts,
 * otherwise "de/a/o/para" inflate the similarity of unrelated sentences.
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  "a", "ao", "aos", "as", "com", "como", "da", "das", "de", "dela", "dele",
  "delas", "deles", "do", "dos", "e", "ela", "elas", "ele", "eles", "em",
  "entre", "era", "essa", "esse", "esta", "este", "eu", "foi", "for", "isso",
  "ja", "la", "lhe", "mais", "mas", "me", "mesmo", "meu", "minha", "muito",
  "na", "nao", "nas", "nem", "no", "nos", "nossa", "nosso", "num", "numa",
  "o", "os", "ou", "para", "pela", "pelo", "por", "que", "quem", "sao", "se",
  "sem", "ser", "seu", "sua", "seus", "suas", "so", "sobre", "somos", "sou",
  "tem", "tenho", "ter", "teu", "tua", "um", "uma", "voce", "voces", "vos",
]);

/** Meaningful tokens: no stopwords and at least 3 characters long. */
export function contentTokens(input: string): Set<string> {
  return new Set(
    words(input).filter((w) => w.length >= 3 && !STOPWORDS.has(w)),
  );
}

/**
 * Jaccard index between the meaningful tokens of two texts: 0 = nothing in
 * common, 1 = identical. Two empty texts return 0 (no evidence of
 * similarity).
 */
export function tokenOverlap(a: string, b: string): number {
  const setA = contentTokens(a);
  const setB = contentTokens(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
