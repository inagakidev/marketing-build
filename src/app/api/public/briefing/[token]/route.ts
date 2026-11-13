import { enforceRateLimit } from "@/server/security/rateLimit";
import { fail, handle, ok } from "@/server/api";
import { loadBriefingByToken, loadEvalContext } from "@/server/briefing";
import { buildPublicForm } from "@/server/publicForm";

/**
 * Estado do link e formulário a exibir.
 *
 * Rota PÚBLICA: a única credencial é o token. Devolve apenas o necessário para
 * renderizar o formulário — nunca e-mail, telefone ou notas internas do
 * cliente, e nunca o diagnóstico.
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
      // 410 Gone: o link existiu e não vale mais. Diferente de 404, permite ao
      // front distinguir "nunca existiu" de "expirou/já enviado".
      return fail(410, mensagem(problem), { problem });
    }

    const ctx = await loadEvalContext(briefing.id);

    return ok({
      briefing: {
        id: briefing.id,
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
