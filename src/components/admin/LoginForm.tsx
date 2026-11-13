"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/safeRedirect";

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Formulário de acesso da administradora.
 *
 * Mantém a autenticação existente (Supabase Auth) e apenas envolve o fluxo com
 * validação de campo, estados de carregamento e mensagens de erro.
 */
export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const trimmed = email.trim();

    if (!trimmed) next.email = "Informe o seu e-mail.";
    else if (!EMAIL_PATTERN.test(trimmed)) next.email = "Informe um e-mail válido.";

    if (!password) next.password = "Informe a sua senha.";

    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setFormError(null);
    const fieldErrors = validate();
    setErrors(fieldErrors);

    if (fieldErrors.email || fieldErrors.password) {
      document
        .getElementById(fieldErrors.email ? "email" : "password")
        ?.focus();
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Mensagem genérica de propósito: dizer "e-mail não existe" confirmaria
        // contas válidas para quem estivesse tentando adivinhar.
        setFormError("E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }

      // Revalida aqui também: o componente não deve confiar em quem o renderiza.
      router.push(safeRedirectPath(redirectTo));
      router.refresh();
    } catch {
      setFormError(
        "Não foi possível entrar agora. Verifique a conexão e tente de novo.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-7">
      <header className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Acesse o painel</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Entre com a conta da administradora para gerenciar clientes e
          briefings.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="voce@empresa.com.br"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            disabled={loading}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={loading}
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              disabled={loading}
              className="absolute inset-y-0 right-1 my-auto flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Acesso restrito à administradora. Não há cadastro de contas novas.
      </p>
    </div>
  );
}
