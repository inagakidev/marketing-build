import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { canManageClients } from "@/modules/identity/domain/permissions";
import { ClientForm } from "@/components/admin/ClientForm";
import { PermissionDenied } from "@/components/admin/PermissionDenied";

export default async function EditarClientePage({
  params,
}: PageProps<"/admin/clientes/[id]/editar">) {
  const user = await getSessionUser();
  if (!user) return null;
  if (!canManageClients(user.role)) return <PermissionDenied />;

  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id, userId: user.id },
  });
  if (!client) notFound();

  return (
    <ClientForm
      clientId={client.id}
      initial={{
        name: client.name,
        contactEmail: client.contactEmail,
        phone: client.phone ?? "",
        projectType: client.projectType ?? "",
        internalNotes: client.internalNotes ?? "",
      }}
    />
  );
}
