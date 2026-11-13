import { getSessionUser } from "@/server/auth";
import { canManageClients } from "@/modules/identity/domain/permissions";
import { ClientForm } from "@/components/admin/ClientForm";
import { PermissionDenied } from "@/components/admin/PermissionDenied";

export default async function NovoClientePage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!canManageClients(user.role)) return <PermissionDenied />;

  return <ClientForm />;
}
