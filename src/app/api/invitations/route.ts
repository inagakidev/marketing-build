import { created, fail, handle, parseBody } from "@/server/api";
import { requireUser } from "@/server/auth";
import { assertSameOrigin } from "@/server/security/origin";
import { serverEnv } from "@/server/env";
import { invitationInputSchema } from "@/server/validation";
import { createInvitation } from "@/modules/identity/application/invitations";

/**
 * Creates an invitation and returns the link for the administrator to send
 * (D12). The clear-text token exists only in this response.
 */
export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = await parseBody(request, invitationInputSchema);

    const result = await createInvitation(user, input);
    if (!result.ok) {
      return fail(409, "Este e-mail já tem acesso ao Briefing Inteligente.", { problem: result.problem });
    }

    return created({
      invitation: result.invitation,
      url: `${serverEnv().appUrl}/convite/${result.token}`,
    });
  });
}
