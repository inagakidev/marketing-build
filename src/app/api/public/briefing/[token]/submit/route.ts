import { enforceRateLimit } from "@/server/security/rateLimit";
import { fail, handle, ok } from "@/server/api";
import { loadBriefingByToken, submitBriefing } from "@/server/briefing";

/**
 * Envio final do briefing.
 *
 * Valida as obrigatórias VISÍVEIS, roda o motor de regras e fecha o briefing
 * como `ready_for_review`. Faltando alguma obrigatória, devolve 422 com as
 * chaves pendentes para o front destacar os campos.
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
      // Reenvio (duplo clique, ou o respondente voltando pelo histórico) não é
      // erro: o resultado desejado já aconteceu.
      return ok({ submitted: true, alreadySubmitted: true });
    }
    if (problem) {
      return fail(410, "Este link expirou e não aceita mais respostas.", {
        problem,
      });
    }

    // A checagem acima é só o caminho rápido; a decisão que vale é tomada
    // dentro da transação, com a linha travada (DATA-01).
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
