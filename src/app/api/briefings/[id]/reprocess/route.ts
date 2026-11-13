import { fail, handle, ok } from "@/server/api";
import { requireUser } from "@/server/auth";
import { assertSameOrigin } from "@/server/security/origin";
import { authorize } from "@/server/security/authorization";
import { canEditProject } from "@/modules/identity/domain/permissions";
import { processAndPersist } from "@/server/briefing";
import { prisma } from "@/server/db";

/**
 * Recomputes signals and diagnosis for an already submitted briefing.
 *
 * Needed because the diagnosis is stored on submission: when the rules change
 * (a new keyword, an adjusted threshold), old briefings keep showing the old
 * result until the admin asks for a recompute.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    // Briefings move under projects in EP-05; until then nobody participates
    // in a project, so only roles that coordinate the organization pass.
    authorize(canEditProject(user.role, null));
    const { id } = await params;

    const briefing = await prisma.briefing.findFirst({
      where: { id, client: { userId: user.id } },
      select: { id: true },
    });
    if (!briefing) return fail(404, "Briefing não encontrado.");

    const result = await processAndPersist(briefing.id);

    return ok({
      reprocessed: true,
      signalCount: result.signals.length,
      diagnoses: result.diagnoses,
    });
  });
}
