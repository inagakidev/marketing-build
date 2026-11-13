import { created, handle, ok, parseBody } from "@/server/api";
import { requireUser } from "@/server/auth";
import { assertSameOrigin } from "@/server/security/origin";
import { prisma } from "@/server/db";
import { clientInputSchema } from "@/server/validation";

/** Lists the admin's clients, with each one's most recent briefing. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        contactEmail: true,
        projectType: true,
        createdAt: true,
        briefings: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            businessType: true,
            createdAt: true,
            submittedAt: true,
          },
        },
      },
    });

    return ok({
      clients: clients.map(({ briefings, ...client }) => ({
        ...client,
        latestBriefing: briefings[0] ?? null,
      })),
    });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = await parseBody(request, clientInputSchema);

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name: input.name,
        contactEmail: input.contactEmail,
        phone: emptyToNull(input.phone),
        projectType: emptyToNull(input.projectType),
        internalNotes: emptyToNull(input.internalNotes),
      },
    });

    return created({ client });
  });
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
