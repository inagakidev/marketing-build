import { createHash } from "node:crypto";

/**
 * Pure rate-limiting rules (SEC-04): policies, window, IP and key.
 * Split from `rateLimit.ts` so they can be tested without a database.
 */

export interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

/** Limits per surface. Tune them here, with tests, never scattered in routes. */
export const RATE_LIMITS = {
  /** Opening the public form. */
  publicRead: { limit: 60, windowMs: 60_000 },
  /** Autosave: the frontend already debounces; this only stops abuse. */
  publicAutosave: { limit: 120, windowMs: 60_000 },
  /** Final submission. */
  publicSubmit: { limit: 10, windowMs: 60_000 },
  /**
   * Accepting an invitation creates a login account. Tight on purpose: the
   * link is the credential, so guessing must be slow.
   */
  invitationAccept: { limit: 10, windowMs: 15 * 60_000 },
  /** The PDF launches a Chromium: the most expensive route in the system. */
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
 * The requester's IP. On Vercel `X-Forwarded-For` is rewritten by the
 * platform, so the first value is trustworthy; elsewhere it's the best
 * available.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Counter key. The identifier (IP, id) is hashed: no PII is stored. */
export function rateLimitKey(scope: string, identifier: string): string {
  const digest = createHash("sha256").update(`${scope}\u0000${identifier}`).digest("hex");
  return `${scope}:${digest.slice(0, 32)}`;
}
