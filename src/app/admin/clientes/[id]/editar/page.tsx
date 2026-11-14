import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { canManageClients } from "@/modules/identity/domain/permissions";
import { ClientForm } from "@/components/admin/ClientForm";
import { PermissionDenied } from "@/components/admin/PermissionDenied";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";
import { BackLink } from "@/components/admin/BackLink";

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
    <>
      <PageHeader
        context={<BackLink href={`/admin/clientes/${client.id}`}>{client.name}</BackLink>}
        title="Editar cliente"
      />
      <PageBody>
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
      </PageBody>
    </>
  );
}
