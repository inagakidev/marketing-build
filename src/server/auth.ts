import { cache } from "react";
import { prisma } from "./db";
import { createSupabaseServerClient, supabaseConfigured } from "./supabase";

/**
 * Sessão da administradora.
 *
 * O Supabase autentica; a tabela `users` é a identidade da aplicação. As duas
 * são ligadas por `supabaseAuthId`. O registro local é criado sob demanda no
 * primeiro acesso — assim trocar a senha ou recriar o usuário no painel do
 * Supabase não deixa o sistema num estado quebrado.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

/**
 * `cache` deduplica a chamada dentro de uma mesma requisição: layout, página e
 * rota podem pedir o usuário sem multiplicar idas ao Supabase e ao banco.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const bypass = await devBypassUser();
  if (bypass) return bypass;

  if (!supabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();

  // `getUser` revalida o token no servidor. `getSession` apenas lê o cookie,
  // que o cliente poderia ter forjado — nunca use getSession para autorizar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const existing = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    select: { id: true, name: true, email: true },
  });
  if (existing) return existing;

  const name =
    (user.user_metadata?.name as string | undefined) ?? user.email.split("@")[0];

  return prisma.user.create({
    data: { supabaseAuthId: user.id, email: user.email, name },
    select: { id: true, name: true, email: true },
  });
});

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
    select: { id: true, name: true, email: true },
  });

  if (user) {
    console.warn(
      `[auth] ACESSO SEM LOGIN (desenvolvimento) como ${user.email}. ` +
        "Configure o Supabase no .env para desativar.",
    );
  }
  return user;
}
