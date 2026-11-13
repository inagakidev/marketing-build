import { enforceRateLimit } from "@/server/security/rateLimit";
import { fail, handle, ok, parseBody } from "@/server/api";
import {
  BriefingClosedError,
  InvalidAnswersError,
  loadBriefingByToken,
  loadEvalContext,
  saveAnswers,
} from "@/server/briefing";
import { buildPublicForm } from "@/server/publicForm";
import { saveAnswersSchema } from "@/server/validation";

/**
 * Autosave das respostas.
 *
 * Devolve o formulário recalculado porque responder a pergunta de ramificação
 * muda o conjunto de perguntas visíveis — e o front precisa do novo total de
 * etapas sem uma segunda ida ao servidor.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  return handle(async () => {
    await enforceRateLimit(request, "publicAutosave");
    const { token } = await params;
    const { problem, briefing } = await loadBriefingByToken(token);

    if (problem === "not_found" || !briefing) {
      return fail(404, "Link inválido.", { problem: "not_found" });
    }
    if (problem) {
      return fail(
        410,
        problem === "expired"
          ? "Este link expirou e não aceita mais respostas."
          : "Este briefing já foi enviado.",
        { problem },
      );
    }

    const body = await parseBody(request, saveAnswersSchema);

    try {
      await saveAnswers(briefing.id, body.answers);
    } catch (error) {
      // Resposta incompatível com o catálogo é erro do cliente (payload
      // adulterado ou catálogo mudou no meio do preenchimento).
      if (error instanceof InvalidAnswersError) {
        return fail(400, "Algumas respostas não são válidas.", { issues: error.issues });
      }
      // O briefing foi enviado ou expirou entre a checagem acima e a gravação.
      if (error instanceof BriefingClosedError) {
        return fail(
          410,
          error.problem === "expired"
            ? "Este link expirou e não aceita mais respostas."
            : "Este briefing já foi enviado.",
          { problem: error.problem },
        );
      }
      throw error;
    }

    const ctx = await loadEvalContext(briefing.id);
    return ok({ saved: true, form: await buildPublicForm(ctx) });
  });
}
