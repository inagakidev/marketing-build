import { fail, handle, ok, parseBody } from "@/server/api";
import { requireUser } from "@/server/auth";
import { assertSameOrigin } from "@/server/security/origin";
import { memberChangeSchema } from "@/server/validation";
import { changeMember } from "@/modules/identity/application/members";

const PROBLEM_MESSAGES = {
  last_admin: "A organização precisa de pelo menos uma pessoa administradora ativa.",
  self: "Você não pode desativar o próprio acesso. Peça a outra pessoa administradora.",
  other_organization: "Esta pessoa já faz parte de outra organização.",
} as const;

/** Changes a member's role or status (deactivate / reactivate). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await params;
    const change = await parseBody(request, memberChangeSchema);

    const result = await changeMember(user, id, change);
    if (result.ok) return ok({ changed: result.changed });
    if (result.problem === "not_found") return fail(404, "Membro não encontrado.");
    return fail(409, PROBLEM_MESSAGES[result.problem], { problem: result.problem });
  });
}
