import { enforceRateLimit } from "@/server/security/rateLimit";
import { fail, handle, ok } from "@/server/api";
import { loadBriefingByToken, submitBriefing } from "@/server/briefing";

/**
 * Final briefing submission.
 *
 * Validates the VISIBLE required questions, runs the rules engine and closes
 * the briefing as `ready_for_review`. If a required question is missing,
 * returns 422 with the pending keys so the frontend can highlight the fields.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  return handle(async () => {
    await enforceRateLimit(request, "publicSubmit");
    const { token } = await params;
    const { problem, briefing } = await loadBriefingByToken(token);

    if (problem === "not_found" || !briefing) {
      return fail(404, "Link inválido.", { problem: "not_found" });
    }
    if (problem === "already_submitted") {
      // Resubmission (double click, or the respondent going back in history)
      // isn't an error: the desired outcome already happened.
      return ok({ submitted: true, alreadySubmitted: true });
    }
    if (problem) {
      return fail(410, "Este link expirou e não aceita mais respostas.", {
        problem,
      });
    }

    // The check above is only the fast path; the decision that counts is made
    // inside the transaction, with the row locked (DATA-01).
    const outcome = await submitBriefing(briefing.id);

    if (outcome.ok) {
      return ok({ submitted: true, alreadySubmitted: outcome.alreadySubmitted });
    }
    if ("missing" in outcome) {
      return fail(422, "Ainda faltam perguntas obrigatórias.", {
        missingRequiredKeys: outcome.missing,
      });
    }
    if (outcome.problem === "not_found") {
      return fail(404, "Link inválido.", { problem: "not_found" });
    }
    return fail(410, "Este link expirou e não aceita mais respostas.", {
      problem: outcome.problem,
    });
  });
}
