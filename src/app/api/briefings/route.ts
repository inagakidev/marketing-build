import { created, fail, handle, parseBody } from "@/server/api";
import { requireUser } from "@/server/auth";
import { assertSameOrigin } from "@/server/security/origin";
import { createBriefing } from "@/server/briefing";
import { prisma } from "@/server/db";
import { serverEnv } from "@/server/env";
import { createBriefingSchema } from "@/server/validation";

/** Creates a briefing for a client and returns the ready public link. */
export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = await parseBody(request, createBriefingSchema);

    // Makes sure the client really belongs to the admin before creating.
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
