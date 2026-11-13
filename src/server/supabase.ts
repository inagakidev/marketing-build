import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Clientes Supabase do lado do servidor.
 *
 * Usamos o Supabase apenas para autenticação — os dados da aplicação estão no
 * Postgres, acessados via Prisma. Isso mantém o motor de regras e o modelo de
 * dados independentes do provedor de auth.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} não definida. Copie .env.example para .env e preencha as credenciais do Supabase.`,
    );
  }
  return value;
}

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Cliente para Server Components e Route Handlers, ligado aos cookies da
 * requisição.
 *
 * O `try/catch` no `setAll` é necessário: Server Components não podem escrever
 * cookies. Quando a renovação do token acontece durante uma renderização, a
 * escrita falha e é ignorada aqui — quem renova de fato é o `proxy.ts`, que
 * roda antes e pode escrever.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component: a renovação fica a cargo do proxy.
          }
        },
      },
    },
  );
}

/**
 * Cliente administrativo, com a service role key. Ignora RLS e pode criar
 * usuários — use SOMENTE em scripts de servidor, nunca em código que chegue ao
 * browser.
 */
export function createSupabaseAdminClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
