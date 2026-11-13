import { fail, handle, parseBody } from "@/server/api";
import { assertSameOrigin } from "@/server/security/origin";
import { enforceRateLimit } from "@/server/security/rateLimit";
import { acceptInvitationSchema } from "@/server/validation";
import {
  acceptInvitation,
  AuthUnavailableError,
  type AcceptInvitationResult,
} from "@/modules/identity/application/invitations";
import { supabaseAuthAccounts } from "@/modules/identity/infrastructure/supabaseAuthAccounts";
import { INVITATION_PROBLEM_MESSAGES } from "@/lib/invitationProblems";

/**
 * Accepts an invitation and creates the invitee's account (D12).
 *
 * PUBLIC route: the token is the only credential, so it's rate-limited and
 * origin-checked like an authenticated mutation — the form that calls it is
 * this site's own page.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  return handle(async () => {
    assertSameOrigin(request);
    await enforceRateLimit(request, "invitationAccept");
    const { token } = await params;
    const input = await parseBody(request, acceptInvitationSchema);

    let result: AcceptInvitationResult;
    try {
      result = await acceptInvitation(token, input, supabaseAuthAccounts());
    } catch (error) {
      if (error instanceof AuthUnavailableError) {
        return fail(503, "Não é possível aceitar convites agora. Avise a pessoa administradora.");
      }
      throw error;
    }

    if (result.ok) return Response.json({ accepted: true }, { status: 201 });

    const status =
      result.problem === "not_found"
        ? 404
        : result.problem === "weak_password"
          ? 400
          : result.problem === "already_has_account" || result.problem === "auth_account_exists"
            ? 409
            : 410;
    return fail(status, INVITATION_PROBLEM_MESSAGES[result.problem].text, { problem: result.problem });
  });
}
