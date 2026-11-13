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
 * Answer autosave.
 *
 * Returns the recomputed form because answering the branching question
 * changes the set of visible questions — and the frontend needs the new number
 * of steps without a second round trip.
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
      // An answer incompatible with the catalog is a client error (tampered
      // payload or the catalog changed mid-way).
      if (error instanceof InvalidAnswersError) {
        return fail(400, "Algumas respostas não são válidas.", { issues: error.issues });
      }
      // The briefing was submitted or expired between the check above and the write.
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
