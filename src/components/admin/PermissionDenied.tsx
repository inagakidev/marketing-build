import Link from "next/link";
import { ShieldX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

/**
 * Insufficient-permission state (CODE-AND-UI.md). The server already refuses
 * the action; this tells the person why and where to go instead of showing a
 * form that would fail on submit.
 */
export function PermissionDenied({
  description = "O seu papel na organização não permite esta ação. Se precisar dela, fale com uma pessoa administradora.",
}: {
  description?: string;
}) {
  return (
    <EmptyState
      icon={ShieldX}
      title="Você não tem permissão para fazer isso."
      description={description}
      action={
        <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
          Voltar para clientes
        </Link>
      }
    />
  );
}
