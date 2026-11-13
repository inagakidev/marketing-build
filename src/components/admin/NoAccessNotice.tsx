"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Account authenticated in Supabase but without panel access (SEC-01, D3).
 *
 * Explains what happened and offers to sign out, so the person can sign in
 * with another account — without it they'd be stuck between login and panel.
 */
export function NoAccessNotice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setLoading(true);
    setError(null);
    try {
      await createSupabaseBrowserClient().auth.signOut();
      router.refresh();
    } catch {
      setError("Não foi possível sair agora. Verifique a conexão e tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          Esta conta não tem acesso ao painel
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          O login funcionou, mas este e-mail ainda não foi liberado para usar o
          Briefing Inteligente. Peça a uma pessoa administradora para liberar o
          seu acesso, ou saia e entre com outra conta.
        </p>
      </header>

      {error && (
        <Alert variant="destructive">
          <ShieldAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={signOut} disabled={loading} className="w-full">
        {loading && <Loader2 className="animate-spin" aria-hidden />}
        Sair e entrar com outra conta
      </Button>
    </div>
  );
}
