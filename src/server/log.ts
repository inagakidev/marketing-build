/**
 * Log de erros do servidor sem tokens nem dados pessoais.
 *
 * Erros do Prisma e de bibliotecas costumam carregar valores da consulta na
 * mensagem (um e-mail num conflito de unique, um token num where). O log
 * guarda nome, código e uma mensagem redigida — nunca o objeto inteiro.
 * Saída em JSON de uma linha, legível pelos logs da Vercel.
 */

const MAX_MESSAGE = 500;

const PATTERNS: [RegExp, string][] = [
  [/(postgres(?:ql)?:\/\/)[^@\s]+@/gi, "$1[credenciais]@"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]"],
  [/(?:\+?55\s?)?\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}/g, "[telefone]"],
  // Tokens de link (24 caracteres) e segredos longos: alfanuméricos com 20+.
  [/\b[A-Za-z0-9_-]{20,}\b/g, "[token]"],
];

export function redact(text: string): string {
  let out = text;
  for (const [pattern, replacement] of PATTERNS) out = out.replace(pattern, replacement);
  return out.length > MAX_MESSAGE ? `${out.slice(0, MAX_MESSAGE)}…` : out;
}

export interface SerializedError {
  name: string;
  code?: string;
  message: string;
}

export function serializeError(error: unknown): SerializedError {
  if (!(error instanceof Error)) return { name: "NonError", message: redact(String(error)) };
  const code = (error as { code?: unknown }).code;
  return {
    name: error.name,
    ...(typeof code === "string" ? { code } : {}),
    message: redact(error.message),
  };
}

export function logError(scope: string, error: unknown, context: Record<string, string> = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      time: new Date().toISOString(),
      ...context,
      error: serializeError(error),
    }),
  );
}
