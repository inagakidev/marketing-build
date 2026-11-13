import { z } from "zod";

/**
 * Server environment variables, validated (NEW-03).
 *
 * A wrong configuration must fail at server startup, with a message saying
 * what to fix — not turn into a broken briefing link or a 500 mid-use. The
 * validation runs in `src/instrumentation.ts`.
 *
 * Messages never echo the variable's VALUE: it may be a secret.
 */

export interface ServerEnv {
  databaseUrl: string;
  /** Public URL without a trailing slash (briefing links, PDF). */
  appUrl: string;
  briefingLinkTtlDays: number;
  supabaseConfigured: boolean;
  /** Service role key present: the server can create login accounts
   *  (accepting invitations, EP-04.4). */
  supabaseAdminConfigured: boolean;
}

const url = (name: string) =>
  z.url({
    protocol: /^https?$/,
    message: `${name} must be a full URL (e.g. https://app.example.com).`,
  });

const schema = z.object({
  DATABASE_URL: z
    .string({ message: "DATABASE_URL is not set." })
    .min(1, "DATABASE_URL is not set.")
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must be a postgresql:// connection string."),
  NEXT_PUBLIC_APP_URL: url("NEXT_PUBLIC_APP_URL").optional(),
  NEXT_PUBLIC_SUPABASE_URL: url("NEXT_PUBLIC_SUPABASE_URL").optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  BRIEFING_LINK_TTL_DAYS: z.coerce
    .number({ message: "BRIEFING_LINK_TTL_DAYS must be a number of days." })
    .int("BRIEFING_LINK_TTL_DAYS must be a whole number of days.")
    .min(1, "BRIEFING_LINK_TTL_DAYS must be between 1 and 365.")
    .max(365, "BRIEFING_LINK_TTL_DAYS must be between 1 and 365.")
    .default(30),
  DEV_ADMIN_EMAIL: z.string().optional(),
});

export type EnvResult =
  | { ok: true; env: ServerEnv; warnings: string[] }
  | { ok: false; errors: string[] };

/** Empty variables count as unset (.env.example uses ""). */
function withoutEmpty(raw: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== undefined && value.trim() !== ""),
  );
}

export function parseServerEnv(
  raw: Record<string, string | undefined>,
  nodeEnv: string | undefined,
): EnvResult {
  const parsed = schema.safeParse(withoutEmpty(raw));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const vars = parsed.data;
  const errors: string[] = [];

  if (nodeEnv === "production") {
    if (!vars.NEXT_PUBLIC_APP_URL) errors.push("NEXT_PUBLIC_APP_URL is required in production.");
    if (!vars.NEXT_PUBLIC_SUPABASE_URL)
      errors.push("NEXT_PUBLIC_SUPABASE_URL is required in production.");
    if (!vars.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required in production.");
  }
  if (errors.length > 0) return { ok: false, errors };

  // Not blocking: the bypass only exists with NODE_ENV=development
  // (src/server/auth.ts), so in production the variable is inert. But it
  // signals a development .env in use.
  const warnings: string[] = [];
  if (nodeEnv === "production" && vars.DEV_ADMIN_EMAIL) {
    warnings.push("DEV_ADMIN_EMAIL is set in production; it's ignored, but it suggests a development .env.");
  }
  // Not an error: only accepting invitations needs it, and refusing to start
  // would take the whole panel down for that one flow.
  if (nodeEnv === "production" && !vars.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push("SUPABASE_SERVICE_ROLE_KEY is not set; invitations can't be accepted until it is.");
  }

  return {
    ok: true,
    warnings,
    env: {
      databaseUrl: vars.DATABASE_URL,
      appUrl: (vars.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
      briefingLinkTtlDays: vars.BRIEFING_LINK_TTL_DAYS,
      supabaseConfigured: Boolean(vars.NEXT_PUBLIC_SUPABASE_URL && vars.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseAdminConfigured: Boolean(vars.NEXT_PUBLIC_SUPABASE_URL && vars.SUPABASE_SERVICE_ROLE_KEY),
    },
  };
}

let cached: ServerEnv | null = null;

/** Validated environment. Throws listing every problem if something is wrong. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const result = parseServerEnv(process.env, process.env.NODE_ENV);
  if (!result.ok) {
    throw new Error(
      `Invalid environment configuration:\n- ${result.errors.join("\n- ")}\nSee .env.example.`,
    );
  }
  for (const warning of result.warnings) console.warn(`[env] ${warning}`);
  cached = result.env;
  return cached;
}
