import { z } from "zod";

/**
 * Variáveis de ambiente do servidor, validadas (NEW-03).
 *
 * Configuração errada precisa falhar na subida do servidor, com mensagem que
 * diga o que corrigir — não virar um link de briefing quebrado ou um 500 no
 * meio do uso. A validação roda em `src/instrumentation.ts`.
 *
 * As mensagens nunca repetem o VALOR da variável: ele pode ser um segredo.
 */

export interface ServerEnv {
  databaseUrl: string;
  /** URL pública sem barra final (links de briefing, PDF). */
  appUrl: string;
  briefingLinkTtlDays: number;
  supabaseConfigured: boolean;
}

const url = (name: string) =>
  z.url({
    protocol: /^https?$/,
    message: `${name} precisa ser uma URL completa (ex.: https://app.exemplo.com).`,
  });

const schema = z.object({
  DATABASE_URL: z
    .string({ message: "DATABASE_URL não definida." })
    .min(1, "DATABASE_URL não definida.")
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL precisa ser uma connection string postgresql://."),
  NEXT_PUBLIC_APP_URL: url("NEXT_PUBLIC_APP_URL").optional(),
  NEXT_PUBLIC_SUPABASE_URL: url("NEXT_PUBLIC_SUPABASE_URL").optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  BRIEFING_LINK_TTL_DAYS: z.coerce
    .number({ message: "BRIEFING_LINK_TTL_DAYS precisa ser um número de dias." })
    .int("BRIEFING_LINK_TTL_DAYS precisa ser um número inteiro de dias.")
    .min(1, "BRIEFING_LINK_TTL_DAYS precisa estar entre 1 e 365.")
    .max(365, "BRIEFING_LINK_TTL_DAYS precisa estar entre 1 e 365.")
    .default(30),
  DEV_ADMIN_EMAIL: z.string().optional(),
});

export type EnvResult =
  | { ok: true; env: ServerEnv; warnings: string[] }
  | { ok: false; errors: string[] };

/** Variáveis vazias contam como não definidas (o .env.example usa ""). */
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
    if (!vars.NEXT_PUBLIC_APP_URL) errors.push("NEXT_PUBLIC_APP_URL é obrigatória em produção.");
    if (!vars.NEXT_PUBLIC_SUPABASE_URL)
      errors.push("NEXT_PUBLIC_SUPABASE_URL é obrigatória em produção.");
    if (!vars.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória em produção.");
  }
  if (errors.length > 0) return { ok: false, errors };

  // Não bloqueia: o bypass só existe com NODE_ENV=development (src/server/auth.ts),
  // então em produção a variável é inerte. Mas indica um .env de dev em uso.
  const warnings =
    nodeEnv === "production" && vars.DEV_ADMIN_EMAIL
      ? ["DEV_ADMIN_EMAIL está definida em produção; ela é ignorada, mas indica um .env de desenvolvimento."]
      : [];

  return {
    ok: true,
    warnings,
    env: {
      databaseUrl: vars.DATABASE_URL,
      appUrl: (vars.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
      briefingLinkTtlDays: vars.BRIEFING_LINK_TTL_DAYS,
      supabaseConfigured: Boolean(vars.NEXT_PUBLIC_SUPABASE_URL && vars.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
  };
}

let cached: ServerEnv | null = null;

/** Ambiente validado. Lança com todas as pendências se algo estiver errado. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const result = parseServerEnv(process.env, process.env.NODE_ENV);
  if (!result.ok) {
    throw new Error(
      `Configuração de ambiente inválida:\n- ${result.errors.join("\n- ")}\nVeja .env.example.`,
    );
  }
  for (const warning of result.warnings) console.warn(`[env] ${warning}`);
  cached = result.env;
  return cached;
}
