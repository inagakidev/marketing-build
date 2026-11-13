"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/labels";

const ROLES = ["admin", "leader", "member"] as const;

type Change = { role: (typeof ROLES)[number] } | { status: "active" | "deactivated" };

/**
 * A member's row actions: change role, deactivate (behind a confirmation, as
 * every destructive action in DS v2) and reactivate. The server enforces the
 * rules; the menu only hides what can't apply (deactivating yourself).
 */
export function MemberActions({
  membershipId,
  name,
  role,
  status,
  isSelf,
}: {
  membershipId: string;
  name: string;
  role: string;
  status: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function apply(change: Change, success: string): Promise<boolean> {
    setPending(true);
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(membershipId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(change),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(body?.error ?? "Não foi possível salvar. Tente de novo.");
        return false;
      }
      toast.success(success);
      router.refresh();
      return true;
    } catch {
      toast.error("Não foi possível conectar. Verifique a internet e tente de novo.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function deactivate() {
    if (await apply({ status: "deactivated" }, `${name} perdeu o acesso.`)) setConfirmOpen(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={`Mais ações para ${name}`} disabled={pending} />
          }
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <MoreHorizontal aria-hidden />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {status === "active" ? (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Mudar papel</DropdownMenuLabel>
                {ROLES.filter((r) => r !== role).map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => apply({ role: r }, `${name} agora é ${MEMBERSHIP_ROLE_LABELS[r]}.`)}
                  >
                    {MEMBERSHIP_ROLE_LABELS[r]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {!isSelf && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                    Desativar acesso
                  </DropdownMenuItem>
                </>
              )}
            </>
          ) : (
            <DropdownMenuItem onClick={() => apply({ status: "active" }, `${name} voltou a ter acesso.`)}>
              Reativar acesso
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desativar o acesso de {name}?</DialogTitle>
            <DialogDescription>
              A pessoa sai do painel na próxima tela que abrir. Tudo o que ela fez continua no histórico,
              com a autoria preservada, e você pode reativar o acesso depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button variant="destructive" onClick={deactivate} disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Desativar acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
