import { getSessionUser } from "@/server/auth";
import { canManageClients } from "@/modules/identity/domain/permissions";
import { ClientForm } from "@/components/admin/ClientForm";
import { PermissionDenied } from "@/components/admin/PermissionDenied";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";
import { BackLink } from "@/components/admin/BackLink";

export default async function NovoClientePage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!canManageClients(user.role)) return <PermissionDenied />;

  return (
    <>
      <PageHeader context={<BackLink href="/admin">Clientes</BackLink>} title="Novo cliente" />
      <PageBody>
        <ClientForm />
      </PageBody>
    </>
  );
}
