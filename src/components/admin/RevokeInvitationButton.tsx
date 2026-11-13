"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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

/** Revokes a pending invitation, behind a confirmation (DS v2 destructive). */
export function RevokeInvitationButton({ invitationId, email }: { invitationId: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function revoke() {
    setPending(true);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}`, { method: "DELETE" });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(body?.error ?? "Não foi possível revogar. Tente de novo.");
        return;
      }
      toast.success("Convite revogado. O link deixou de funcionar.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Não foi possível conectar. Verifique a internet e tente de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>Revogar</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revogar o convite?</DialogTitle>
          <DialogDescription>
            O link enviado para {email} para de funcionar na hora. Se mudar de ideia, crie um novo convite.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button variant="destructive" onClick={revoke} disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Revogar convite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
