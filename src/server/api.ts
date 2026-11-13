import { ZodError } from "zod";
import { UnauthorizedError } from "./auth";
import { ForbiddenError } from "./security/authorization";
import { ForbiddenOriginError } from "./security/origin";
import { RateLimitError } from "./security/rateLimit";
import { logError } from "./log";

/**
 * API route helpers.
 *
 * Goal: no route needs to build `Response.json` by hand or repeat the same
 * `try/catch`, and no internal error leaks implementation details to the
 * client. Response messages are user-facing (pt-BR).
 */

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, { status: 200, ...init });
}

export function created<T>(data: T): Response {
  return Response.json(data, { status: 201 });
}

export function fail(
  status: number,
  message: string,
  extra?: Record<string, unknown>,
  headers?: HeadersInit,
): Response {
  return Response.json({ error: message, ...extra }, { status, headers });
}

/**
 * Wraps a route body, translating known exceptions into HTTP statuses.
 *
 * Unexpected errors become a 500 with a generic message — the details go to
 * the server log, not to the response.
 */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(401, "Não autenticado.");
    }
    if (error instanceof ForbiddenError) {
      return fail(403, "Você não tem permissão para fazer isso.");
    }
    if (error instanceof ForbiddenOriginError) {
      return fail(403, "Origem da requisição não permitida.");
    }
    if (error instanceof RateLimitError) {
      return fail(
        429,
        "Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente de novo.",
        { retryAfterSeconds: error.retryAfterSeconds },
        { "Retry-After": String(error.retryAfterSeconds) },
      );
    }
    if (error instanceof InvalidJsonError) {
      return fail(400, "O corpo da requisição não é um JSON válido.");
    }
    if (error instanceof ZodError) {
      return fail(400, "Dados inválidos.", { issues: formatIssues(error) });
    }
    logError("api", error);
    return fail(500, "Erro interno. Tente novamente.");
  }
}

function formatIssues(error: ZodError): Record<string, string> {
  const issues: Record<string, string> = {};
  for (const issue of error.issues) {
    issues[issue.path.join(".") || "_"] = issue.message;
  }
  return issues;
}

/** Unreadable request body: a client error (400), not a server error (NEW-01). */
export class InvalidJsonError extends Error {
  constructor() {
    super("Request body is not valid JSON");
    this.name = "InvalidJsonError";
  }
}

/** Reads and validates the request's JSON body. */
export async function parseBody<T>(
  request: Request,
  schema: { parse: (input: unknown) => T },
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new InvalidJsonError();
  }
  return schema.parse(raw);
}
