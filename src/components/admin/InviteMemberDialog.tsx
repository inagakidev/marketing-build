"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Info, Loader2, TriangleAlert, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/labels";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_HINTS: Record<string, string> = {
  member: "Trabalha nos projetos em que participa.",
  leader: "Vê todos os clientes e projetos, cria e edita, distribui o trabalho.",
  admin: "Tudo do líder, mais membros, papéis e configurações da organização.",
};

/**
 * Invite flow (D12): the administrator picks email and role, gets the link and
 * sends it themselves. The link exists only in this response — the database
 * keeps its hash — so the dialog says so and offers to copy it.
 */
export function InviteMemberDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setEmail("");
    setRole("member");
    setEmailError(null);
    setFormError(null);
    setLink(null);
    setCopied(false);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // The list must show the new pending invitation once the dialog closes.
      if (link) router.refresh();
      reset();
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setFormError(null);

    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError("Informe um e-mail válido, como nome@empresa.com.");
      document.getElementById("invite-email-input")?.focus();
      return;
    }
    setEmailError(null);

    setLoading(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !body?.url) {
        setFormError(body?.error ?? "Não foi possível criar o convite. Tente de novo.");
        return;
      }
      setLink(body.url);
    } catch {
      setFormError("Não foi possível conectar. Verifique a internet e tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Without clipboard access the field stays selectable for a manual copy.
      document.getElementById("invite-link")?.focus();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <UserPlus aria-hidden />
        Convidar membro
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {link ? (
          <>
            <DialogHeader>
              <DialogTitle>Convite criado</DialogTitle>
              <DialogDescription>
                Envie este link para {email.trim()} pelo canal que preferir. Ele vale por 7 dias e só pode
                ser usado uma vez.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="invite-link">Link do convite</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-link"
                  readOnly
                  value={link}
                  onFocus={(e) => e.currentTarget.select()}
                  className="font-mono text-sm"
                />
                <Button variant="outline" onClick={copy} aria-live="polite">
                  {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
            <Alert variant="info">
              <Info aria-hidden />
              <AlertDescription>
                Este link aparece só agora. Se perder, gere um novo convite: o anterior deixa de valer.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <DialogClose render={<Button />}>Concluir</DialogClose>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-5">
            <DialogHeader>
              <DialogTitle>Convidar membro</DialogTitle>
              <DialogDescription>
                Você recebe um link para enviar à pessoa. A conta é criada quando ela aceitar.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <Alert variant="destructive">
                <TriangleAlert aria-hidden />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="invite-email-input">E-mail</Label>
              <Input
                id="invite-email-input"
                type="email"
                autoComplete="off"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? "invite-email-error" : undefined}
              />
              {emailError && (
                <p id="invite-email-error" className="text-[0.8125rem] text-destructive">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Papel</Label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                aria-describedby="invite-role-hint"
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-(--focus-gap)"
              >
                {(["member", "leader", "admin"] as const).map((r) => (
                  <option key={r} value={r}>
                    {MEMBERSHIP_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <p id="invite-role-hint" className="text-[0.8125rem] text-muted-foreground">
                {ROLE_HINTS[role]}
              </p>
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="animate-spin" aria-hidden />}
                Criar convite
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
