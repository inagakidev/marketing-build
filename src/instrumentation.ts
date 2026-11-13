import type { Instrumentation } from "next";

/**
 * Roda uma vez quando a instância do servidor sobe.
 *
 * Valida o ambiente aqui para que configuração errada impeça o servidor de
 * subir, com a lista do que falta, em vez de aparecer como erro no meio do
 * uso (NEW-03).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { serverEnv } = await import("./server/env");
  serverEnv();
}

/**
 * Erros não tratados de renderização e de rotas. O caminho pode conter o
 * token do link, então tudo passa pela redação do logger.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logError, redact } = await import("./server/log");
  logError("request", error, {
    method: request.method,
    path: redact(request.path),
    routeType: context.routeType,
  });
};
