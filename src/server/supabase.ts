import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side Supabase clients.
 *
 * Supabase is used only for authentication — application data lives in
 * Postgres, accessed through Prisma. That keeps the rules engine and the data
 * model independent of the auth provider.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env and fill in the Supabase credentials.`,
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
 * Client for Server Components and Route Handlers, bound to the request's
 * cookies.
 *
 * The `try/catch` in `setAll` is needed: Server Components can't write
 * cookies. When the token refresh happens during a render, the write fails and
 * is ignored here — the actual refresh is done by `proxy.ts`, which runs first
 * and can write.
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
            // Server Component: the proxy takes care of the refresh.
          }
        },
      },
    },
  );
}

/**
 * Admin client, with the service role key. Bypasses RLS and can create users —
 * use ONLY in server scripts, never in code that reaches the browser.
 */
export function createSupabaseAdminClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
