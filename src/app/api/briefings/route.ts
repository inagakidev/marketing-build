import { created, fail, handle, parseBody } from "@/server/api";
import { requireUser } from "@/server/auth";
import { assertSameOrigin } from "@/server/security/origin";
import { createBriefing } from "@/server/briefing";
import { prisma } from "@/server/db";
import { serverEnv } from "@/server/env";
import { createBriefingSchema } from "@/server/validation";

/** Cria um briefing para um cliente e devolve o link público pronto. */
export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = await parseBody(request, createBriefingSchema);

    // Garante que o cliente é mesmo da administradora antes de criar.
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, userId: user.id },
      select: { id: true },
    });
    if (!client) return fail(404, "Cliente não encontrado.");

    const briefing = await createBriefing(client.id, input.ttlDays);
    return created({
      briefing,
      url: `${serverEnv().appUrl}/briefing/${briefing.token}`,
    });
  });
}
