import { cache } from "react";
import { prisma } from "./db";
import { createSupabaseServerClient, supabaseConfigured } from "./supabase";
import { decideProvisioning } from "./security/provisioning";

/**
 * Sessão de quem usa o painel.
 *
 * O Supabase autentica; a tabela `users` é a identidade da aplicação. As duas
 * são ligadas por `supabaseAuthId`. Estar autenticado no Supabase NÃO basta:
 * só entra quem já tem registro local (SEC-01, decisão D3 — ver
 * `security/provisioning.ts`). Nenhum usuário é criado a partir de um login.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export type AuthState =
  | { status: "anonymous" }
  /** Autenticado no Supabase, mas sem acesso ao painel. */
  | { status: "unprovisioned" }
  | { status: "authenticated"; user: SessionUser };

const SESSION_USER_SELECT = { id: true, name: true, email: true } as const;

/**
 * `cache` deduplica a chamada dentro de uma mesma requisição: layout, página e
 * rota podem pedir o usuário sem multiplicar idas ao Supabase e ao banco.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  const bypass = await devBypassUser();
  if (bypass) return { status: "authenticated", user: bypass };

  if (!supabaseConfigured()) return { status: "anonymous" };

  const supabase = await createSupabaseServerClient();

  // `getUser` revalida o token no servidor. `getSession` apenas lê o cookie,
  // que o cliente poderia ter forjado — nunca use getSession para autorizar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { status: "anonymous" };

  const email = user.email.toLowerCase();
  const [byAuthId, byEmail] = await Promise.all([
    prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, supabaseAuthId: true },
    }),
    prisma.user.findUnique({
      where: { email },
      select: { id: true, supabaseAuthId: true },
    }),
  ]);

  const decision = decideProvisioning({
    authUser: { id: user.id, email, emailConfirmed: Boolean(user.email_confirmed_at) },
    byAuthId,
    byEmail,
  });

  if (decision.action === "deny") return { status: "unprovisioned" };

  const sessionUser =
    decision.action === "link"
      ? await prisma.user.update({
          where: { id: decision.userId },
          data: { supabaseAuthId: user.id },
          select: SESSION_USER_SELECT,
        })
      : await prisma.user.findUniqueOrThrow({
          where: { id: decision.userId },
          select: SESSION_USER_SELECT,
        });

  return { status: "authenticated", user: sessionUser };
});

/** Usuário do painel, ou `null` se anônimo ou sem acesso. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const state = await getAuthState();
  return state.status === "authenticated" ? state.user : null;
}

/** Como `getSessionUser`, mas lança quando não há sessão. Para rotas de API. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Não autenticado");
    this.name = "UnauthorizedError";
  }
}

/**
 * Acesso ao painel SEM login, apenas em desenvolvimento.
 *
 * Existe para poder construir e testar o painel antes de as credenciais do
 * Supabase estarem disponíveis. Três travas, todas obrigatórias:
 *
 *   1. `NODE_ENV` precisa ser exatamente "development" — em produção o Next
 *      define "production", então o bypass some no build.
 *   2. O Supabase precisa estar NÃO configurado. Assim que as credenciais
 *      entram no .env, o caminho normal de autenticação assume.
 *   3. `DEV_ADMIN_EMAIL` precisa apontar para um usuário que já existe no
 *      banco — não cria conta nenhuma.
 *
 * Para desativar antes disso, basta remover `DEV_ADMIN_EMAIL` do .env.
 */
async function devBypassUser(): Promise<SessionUser | null> {
  if (process.env.NODE_ENV !== "development") return null;
  if (supabaseConfigured()) return null;

  const email = process.env.DEV_ADMIN_EMAIL?.trim();
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: SESSION_USER_SELECT,
  });

  if (user) {
    console.warn(
      `[auth] ACESSO SEM LOGIN (desenvolvimento) como ${user.email}. ` +
        "Configure o Supabase no .env para desativar.",
    );
  }
  return user;
}
