import type { Instrumentation } from "next";

/**
 * Runs once when the server instance starts.
 *
 * Validates the environment here so a wrong configuration stops the server
 * from starting, listing what's missing, instead of surfacing as an error
 * mid-use (NEW-03).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { serverEnv } = await import("./server/env");
  serverEnv();
}

/**
 * Unhandled rendering and route errors. The path may contain the link token,
 * so everything goes through the logger's redaction.
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
