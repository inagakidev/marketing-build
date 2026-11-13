"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/labels";

interface FieldErrors {
  name?: string;
  password?: string;
  confirm?: string;
}

/**
 * The invitee sets their name and password; the server creates the login
 * account and the membership (D12). The email comes from the invitation and
 * can't be changed here: it's what the administrator invited.
 */
export function AcceptInvitationForm({
  token,
  email,
  role,
  organizationName,
}: {
  token: string;
  email: string;
  role: string;
  organizationName: string;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Informe o seu nome.";
    if (password.length < 8) next.password = "A senha precisa ter pelo menos 8 caracteres.";
    else if (password.length > 72) next.password = "A senha pode ter no máximo 72 caracteres.";
    if (confirm !== password) next.confirm = "As senhas não são iguais.";
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setFormError(null);
    const fieldErrors = validate();
    setErrors(fieldErrors);
    const firstInvalid = (["name", "password", "confirm"] as const).find((field) => fieldErrors[field]);
    if (firstInvalid) {
      document.getElementById(`invite-${firstInvalid}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/public/invitations/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      if (res.ok) {
        setDone(true);
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setFormError(body?.error ?? "Não foi possível criar a conta. Tente de novo em instantes.");
    } catch {
      setFormError("Não foi possível conectar. Verifique a internet e tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="w-full space-y-6" role="status">
        <header className="space-y-1.5">
          <CircleCheck className="size-8 text-(--success-text)" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight">Conta criada</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Você já faz parte de {organizationName}. Entre com o e-mail {email} e a senha que acabou
            de criar.
          </p>
        </header>
        <Link href="/login" className={buttonVariants({ size: "lg", className: "w-full" })}>
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-7">
      <header className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Você recebeu um convite</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Crie a sua conta para entrar em <strong className="text-foreground">{organizationName}</strong>{" "}
          com o papel <strong className="text-foreground">{MEMBERSHIP_ROLE_LABELS[role] ?? role}</strong>.
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
          <Label htmlFor="invite-email">E-mail</Label>
          <Input id="invite-email" type="email" value={email} readOnly aria-readonly className="bg-muted/50" />
        </div>

        <Field id="invite-name" label="Seu nome" error={errors.name}>
          <Input
            id="invite-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "invite-name-error" : undefined}
          />
        </Field>

        <Field id="invite-password" label="Crie uma senha" error={errors.password} hint="Pelo menos 8 caracteres.">
          <div className="relative">
            <Input
              id="invite-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "invite-password-error" : "invite-password-hint"}
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              disabled={loading}
              className="absolute inset-y-0 right-1 my-auto flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <Field id="invite-confirm" label="Repita a senha" error={errors.confirm}>
          <Input
            id="invite-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(errors.confirm)}
            aria-describedby={errors.confirm ? "invite-confirm-error" : undefined}
          />
        </Field>

        <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          Criar conta
        </Button>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
