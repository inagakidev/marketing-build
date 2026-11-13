import { ZodError } from "zod";
import { UnauthorizedError } from "./auth";
import { ForbiddenOriginError } from "./security/origin";
import { RateLimitError } from "./security/rateLimit";

/**
 * Helpers das rotas de API.
 *
 * Objetivo: nenhuma rota precisa montar `Response.json` na mão nem repetir o
 * mesmo `try/catch`, e nenhum erro interno vaza detalhe de implementação para
 * o cliente.
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
 * Envolve o corpo de uma rota, traduzindo exceções conhecidas em status HTTP.
 *
 * Erros inesperados viram 500 com mensagem genérica — o detalhe vai para o log
 * do servidor, não para a resposta.
 */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(401, "Não autenticado.");
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
    console.error("[api]", error);
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

/** Corpo da requisição ilegível: erro do cliente (400), não do servidor (NEW-01). */
export class InvalidJsonError extends Error {
  constructor() {
    super("Corpo da requisição não é JSON válido.");
    this.name = "InvalidJsonError";
  }
}

/** Lê e valida o corpo JSON da requisição. */
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
