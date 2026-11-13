import { redirect } from "next/navigation";
import { getAuthState } from "@/server/auth";
import { safeRedirectPath } from "@/lib/safeRedirect";
import { supabaseConfigured } from "@/server/supabase";
import { LoginForm } from "@/components/admin/LoginForm";
import { LoginShell } from "@/components/admin/LoginShell";
import { NoAccessNotice } from "@/components/admin/NoAccessNotice";

const CODE_CLASSES =
  "rounded bg-muted px-1 py-0.5 font-mono text-[0.8em] text-foreground";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const auth = await getAuthState();
  const { redirect: redirectTo } = await searchParams;

  // The destination comes from the query string: internal paths only (SEC-02).
  const target = safeRedirectPath(redirectTo);

  if (auth.status === "authenticated") redirect(target);

  if (auth.status === "unprovisioned") {
    return (
      <LoginShell>
        <NoAccessNotice />
      </LoginShell>
    );
  }

  if (!supabaseConfigured()) {
    return (
      <LoginShell>
        <AuthSetupNotice />
      </LoginShell>
    );
  }

  return (
    <LoginShell>
      <LoginForm redirectTo={target} />
    </LoginShell>
  );
}

/**
 * Development state: Supabase Auth hasn't been configured yet.
 *
 * Happens before `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
 * exist in `.env`; the password form only works after that.
 */
function AuthSetupNotice() {
  return (
    <div className="w-full space-y-5">
      <header className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          Login ainda não configurado
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          O Supabase Auth não está configurado neste ambiente, então o acesso por
          senha está indisponível.
        </p>
      </header>

      <ol className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <li className="flex gap-3">
          <span className="font-mono text-xs text-foreground/70">1.</span>
          <span>
            Preencha <code className={CODE_CLASSES}>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className={CODE_CLASSES}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e{" "}
            <code className={CODE_CLASSES}>SUPABASE_SERVICE_ROLE_KEY</code> no{" "}
            <code className={CODE_CLASSES}>.env</code>.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-xs text-foreground/70">2.</span>
          <span>
            Rode <code className={CODE_CLASSES}>npm run db:seed:admin</code> para
            criar a conta da administradora.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-xs text-foreground/70">3.</span>
          <span>
            Em desenvolvimento, defina{" "}
            <code className={CODE_CLASSES}>DEV_ADMIN_EMAIL</code> para acessar o
            painel sem login.
          </span>
        </li>
      </ol>
    </div>
  );
}
