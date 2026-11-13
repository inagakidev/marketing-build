/**
 * Utilidades de texto para as regras de sinal.
 *
 * Tudo aqui trabalha sobre texto NORMALIZADO (minúsculo, sem acento), porque
 * as respostas vêm digitadas à mão por clientes: "Não sei", "nao sei" e
 * "NÃO SEI" precisam colidir. Nenhuma regra deve comparar texto cru.
 */

import type { AnswerValue, QuestionOption } from "./types";

/** Minúsculo, sem acento, espaços colapsados. */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove os diacríticos separados pelo NFD
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Achata um valor de resposta em texto único. multi_choice vira as opções
 * separadas por espaço, o que é o suficiente para busca de termos.
 */
export function valueToText(value: AnswerValue | undefined | null): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(" ");
  return value;
}

/**
 * Troca o(s) código(s) gravado(s) pelo rótulo legível da opção, para exibição
 * no painel e no PDF. Sem `options` (perguntas de texto) ou sem rótulo
 * cadastrado para o código, devolve o valor cru como veio.
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

/** Uma resposta é vazia se não tem conteúdo útil (string em branco ou []). */
export function isBlank(value: AnswerValue | undefined | null): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((v) => v.trim() === "");
  }
  return value.trim() === "";
}

/** Tokens alfanuméricos do texto normalizado. */
export function words(input: string): string[] {
  const normalized = normalize(input);
  if (!normalized) return [];
  return normalized.split(/[^a-z0-9]+/).filter(Boolean);
}

export function wordCount(input: string): number {
  return words(input).length;
}

/** Há algum dígito no texto? Usado para detectar meta sem número. */
export function hasDigit(input: string): boolean {
  return /\d/.test(input);
}

/**
 * O texto contém algum dos termos? Compara sobre a forma normalizada e
 * respeita fronteira de palavra, para "caro" não casar dentro de "carro".
 * Termos com espaço ("todo mundo") são buscados como expressão.
 */
export function containsAny(input: string, terms: readonly string[]): boolean {
  return matchedTerms(input, terms).length > 0;
}

/** Como `containsAny`, mas devolve quais termos casaram (útil em mensagens). */
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
 * Stopwords do português. Removidas antes de medir sobreposição entre dois
 * textos, senão "de/a/o/para" inflam a semelhança de frases sem relação.
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

/** Tokens significativos: sem stopwords e com pelo menos 3 caracteres. */
export function contentTokens(input: string): Set<string> {
  return new Set(
    words(input).filter((w) => w.length >= 3 && !STOPWORDS.has(w)),
  );
}

/**
 * Índice de Jaccard entre os tokens significativos de dois textos: 0 = nada em
 * comum, 1 = idênticos. Dois textos vazios devolvem 0 (não há evidência de
 * semelhança).
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
