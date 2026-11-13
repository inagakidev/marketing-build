import { fail, handle, ok, parseBody } from "@/server/api";
import { requireUser } from "@/server/auth";
import { assertSameOrigin } from "@/server/security/origin";
import { authorize } from "@/server/security/authorization";
import { canDeleteClient, canManageClients } from "@/modules/identity/domain/permissions";
import { prisma } from "@/server/db";
import { clientUpdateSchema } from "@/server/validation";

/**
 * Every route filters by `userId` besides the resource id. Without it, knowing
 * the id of another account's client would be enough to read it — and the
 * model is already multi-user, so the habit must hold from now on.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, userId: user.id },
      include: {
        briefings: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            token: true,
            businessType: true,
            createdAt: true,
            expiresAt: true,
            submittedAt: true,
          },
        },
      },
    });

    if (!client) return fail(404, "Cliente não encontrado.");
    return ok({ client });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    authorize(canManageClients(user.role));
    const { id } = await params;
    const input = await parseBody(request, clientUpdateSchema);

    const { count } = await prisma.client.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.contactEmail !== undefined && {
          contactEmail: input.contactEmail,
        }),
        ...(input.phone !== undefined && { phone: emptyToNull(input.phone) }),
        ...(input.projectType !== undefined && {
          projectType: emptyToNull(input.projectType),
        }),
        ...(input.internalNotes !== undefined && {
          internalNotes: emptyToNull(input.internalNotes),
        }),
      },
    });

    if (count === 0) return fail(404, "Cliente não encontrado.");

    const client = await prisma.client.findUnique({ where: { id } });
    return ok({ client });
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    authorize(canDeleteClient(user.role));
    const { id } = await params;

    // Deleting a client takes its briefings, answers, signals and diagnoses
    // with it (onDelete: Cascade in the schema). It's destructive and
    // irreversible — the confirmation lives in the UI (decision D4).
    const { count } = await prisma.client.deleteMany({
      where: { id, userId: user.id },
    });

    if (count === 0) return fail(404, "Cliente não encontrado.");
    return ok({ deleted: true });
  });
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
