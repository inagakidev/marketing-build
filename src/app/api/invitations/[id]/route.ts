import { fail, handle, ok } from "@/server/api";
import { requireUser } from "@/server/auth";
import { assertSameOrigin } from "@/server/security/origin";
import { revokeInvitation } from "@/modules/identity/application/invitations";

/** Revokes a pending invitation: its link stops working at once. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await params;

    const result = await revokeInvitation(user, id);
    if (result.ok) return ok({ revoked: true });
    if (result.problem === "not_found") return fail(404, "Convite não encontrado.");
    return fail(409, "Este convite não está mais pendente.", { problem: result.problem });
  });
}
