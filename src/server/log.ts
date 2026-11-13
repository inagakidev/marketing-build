/**
 * Server error logging without tokens or personal data.
 *
 * Prisma and library errors often carry query values in the message (an email
 * in a unique conflict, a token in a where). The log keeps name, code and a
 * redacted message — never the whole object. Output is single-line JSON,
 * readable by Vercel's logs.
 */

const MAX_MESSAGE = 500;

const PATTERNS: [RegExp, string][] = [
  [/(postgres(?:ql)?:\/\/)[^@\s]+@/gi, "$1[credentials]@"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]"],
  [/(?:\+?55\s?)?\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}/g, "[phone]"],
  // Link tokens (24 characters) and long secrets: alphanumerics with 20+.
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
