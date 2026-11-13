import { createHash } from "node:crypto";

/**
 * Regras puras do rate limiting (SEC-04): políticas, janela, IP e chave.
 * Separadas de `rateLimit.ts` para serem testadas sem banco.
 */

export interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

/** Limites por superfície. Ajustar aqui, com teste, nunca espalhado nas rotas. */
export const RATE_LIMITS = {
  /** Abrir o formulário público. */
  publicRead: { limit: 60, windowMs: 60_000 },
  /** Autosave: o front já faz debounce; isso só segura abuso. */
  publicAutosave: { limit: 120, windowMs: 60_000 },
  /** Envio final. */
  publicSubmit: { limit: 10, windowMs: 60_000 },
  /** PDF abre um Chromium: é a rota mais cara do sistema. */
  pdf: { limit: 10, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitPolicy>;

export type RateLimitScope = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function windowStartFor(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export function retryAfterSeconds(now: Date, windowStart: Date, windowMs: number): number {
  const remainingMs = windowStart.getTime() + windowMs - now.getTime();
  return Math.max(1, Math.ceil(remainingMs / 1000));
}

/**
 * IP de quem fez a requisição. Na Vercel o `X-Forwarded-For` é reescrito pela
 * plataforma, então o primeiro valor é confiável; fora dela, é o melhor
 * disponível.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Chave do contador. O identificador (IP, id) vira hash: não guardamos PII. */
export function rateLimitKey(scope: string, identifier: string): string {
  const digest = createHash("sha256").update(`${scope}\u0000${identifier}`).digest("hex");
  return `${scope}:${digest.slice(0, 32)}`;
}
