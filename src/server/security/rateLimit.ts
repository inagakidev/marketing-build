import { prisma } from "../db";
import { logError } from "../log";
import {
  clientIp,
  RATE_LIMITS,
  rateLimitKey,
  retryAfterSeconds,
  windowStartFor,
  type RateLimitPolicy,
  type RateLimitResult,
  type RateLimitScope,
} from "./rateLimitRules";

export { RATE_LIMITS, rateLimitKey, type RateLimitScope } from "./rateLimitRules";

/**
 * Fixed-window rate limiting with the counter in Postgres (SEC-04, D2).
 *
 * On Vercel serverless each instance has its own memory, so a local counter
 * wouldn't limit anything. Postgres already exists — no new dependency.
 *
 * If the database fails to count, the request GOES THROUGH (fail-open):
 * blocking legitimate respondents over an infrastructure problem would be
 * worse than not limiting for a few moments.
 */

/**
 * Counts a request and says whether it's within the limit.
 *
 * A single `INSERT ... ON CONFLICT` does an atomic read and write: two
 * simultaneous requests never read the same old value.
 */
export async function consumeRateLimit(
  scope: string,
  identifier: string,
  policy: RateLimitPolicy,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const key = rateLimitKey(scope, identifier);
  const windowStart = windowStartFor(now, policy.windowMs);

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limit_buckets (key, window_start, count)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_buckets.window_start = EXCLUDED.window_start
          THEN rate_limit_buckets.count + 1
        ELSE 1
      END,
      window_start = EXCLUDED.window_start
    RETURNING count
  `;

  const count = Number(rows[0]?.count ?? 1);
  maybeCleanup(now);

  return {
    allowed: count <= policy.limit,
    remaining: Math.max(0, policy.limit - count),
    retryAfterSeconds: retryAfterSeconds(now, windowStart, policy.windowMs),
  };
}

/**
 * Occasional cleanup of idle keys, without a scheduled job: ~1% of calls
 * delete counters idle for over a day. Doesn't block the response.
 */
function maybeCleanup(now: Date): void {
  if (Math.random() >= 0.01) return;
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  prisma.rateLimitBucket
    .deleteMany({ where: { windowStart: { lt: cutoff } } })
    .catch(() => {
      // Cleanup is opportunistic; the next attempt will handle it.
    });
}

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many requests");
    this.name = "RateLimitError";
  }
}

/**
 * Applies the surface's limit and throws `RateLimitError` when exceeded.
 * `identifier` defaults to the IP; authenticated routes can pass the user id.
 */
export async function enforceRateLimit(
  request: Request,
  scope: RateLimitScope,
  identifier: string = clientIp(request.headers),
): Promise<void> {
  let result: RateLimitResult;
  try {
    result = await consumeRateLimit(scope, identifier, RATE_LIMITS[scope]);
  } catch (error) {
    // Fail-open (see the module comment). Logs only the scope, never the IP.
    logError("rate-limit", error, { scope });
    return;
  }
  if (!result.allowed) throw new RateLimitError(result.retryAfterSeconds);
}
