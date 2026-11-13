import { enforceRateLimit } from "@/server/security/rateLimit";
import { fail, handle, ok } from "@/server/api";
import { loadBriefingByToken, loadEvalContext } from "@/server/briefing";
import { buildPublicForm } from "@/server/publicForm";

/**
 * Link state and the form to display.
 *
 * PUBLIC route: the only credential is the token. Returns only what's needed
 * to render the form — never the client's email, phone or internal notes, and
 * never the diagnosis.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  return handle(async () => {
    await enforceRateLimit(request, "publicRead");
    const { token } = await params;
    const { problem, briefing } = await loadBriefingByToken(token);

    if (problem === "not_found" || !briefing) {
      return fail(404, "Link inválido.", { problem: "not_found" });
    }
    if (problem) {
      // 410 Gone: the link existed and is no longer valid. Unlike 404, it lets
      // the frontend tell "never existed" from "expired/already submitted".
      return fail(410, mensagem(problem), { problem });
    }

    const ctx = await loadEvalContext(briefing.id);

    return ok({
      // No internal id: the token already identifies the briefing for the
      // respondent and the public payload carries only what's needed
      // (FORM-14, NEW-02).
      briefing: {
        status: briefing.status,
        businessType: briefing.businessType,
        expiresAt: briefing.expiresAt,
        clientName: briefing.client.name,
        senderName: briefing.client.user.name,
      },
      form: await buildPublicForm(ctx),
    });
  });
}

function mensagem(problem: "expired" | "already_submitted"): string {
  return problem === "expired"
    ? "Este link expirou."
    : "Este briefing já foi enviado.";
}
