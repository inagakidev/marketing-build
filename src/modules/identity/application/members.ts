import { prisma } from "@/server/db";
import { authorize } from "@/server/security/authorization";
import { canChangeMemberRole, canManageMembers } from "../domain/permissions";
import { decideMemberChange, type MemberChange } from "../domain/memberChange";
import type { MembershipRole, MembershipStatus } from "../domain/membership";
import type { InvitationActor } from "./invitations";

/**
 * Member management (EP-04.5, D11). Every change runs in one transaction with
 * its audit event (AUD-01); audit metadata carries roles and statuses, never
 * the email.
 */

export interface MemberRow {
  /** Membership id: what the screen acts on. */
  id: string;
  name: string;
  email: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: Date;
  isSelf: boolean;
}

export interface PendingInvitationRow {
  id: string;
  email: string;
  role: MembershipRole;
  expiresAt: Date;
  invitedByName: string;
}

export async function listOrganizationMembers(
  actor: InvitationActor,
  now: Date = new Date(),
): Promise<{ members: MemberRow[]; invitations: PendingInvitationRow[] }> {
  authorize(canManageMembers(actor.role));

  const [memberships, invitations] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: actor.organizationId },
      select: {
        id: true,
        role: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.invitation.findMany({
      where: {
        organizationId: actor.organizationId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, expiresAt: true, invitedBy: { select: { name: true } } },
    }),
  ]);

  // Active people first, then alphabetical: the list is for finding someone.
  const members = memberships
    .map((m) => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      status: m.status,
      joinedAt: m.createdAt,
      isSelf: m.user.id === actor.id,
    }))
    .sort(
      (a, b) =>
        Number(a.status === "deactivated") - Number(b.status === "deactivated") ||
        a.name.localeCompare(b.name, "pt-BR"),
    );

  return {
    members,
    invitations: invitations.map(({ invitedBy, ...i }) => ({ ...i, invitedByName: invitedBy.name })),
  };
}

export type ChangeMemberResult =
  | { ok: true; changed: boolean }
  | { ok: false; problem: "not_found" | "last_admin" | "self" | "other_organization" };

export async function changeMember(
  actor: InvitationActor,
  membershipId: string,
  change: MemberChange,
  now: Date = new Date(),
): Promise<ChangeMemberResult> {
  authorize("role" in change ? canChangeMemberRole(actor.role) : canManageMembers(actor.role));

  return prisma.$transaction(async (tx) => {
    // Lock the organization's active admins before counting them: two admins
    // demoting each other at the same time would otherwise both see "2" and
    // leave nobody in charge. The second transaction waits here and then
    // counts what the first one left.
    const admins = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM memberships
      WHERE "organizationId" = ${actor.organizationId} AND role = 'admin' AND status = 'active'
      FOR UPDATE`;

    // Scoped by organization: another organization's id reads as missing.
    const target = await tx.membership.findFirst({
      where: { id: membershipId, organizationId: actor.organizationId },
      select: { id: true, userId: true, role: true, status: true },
    });
    if (!target) return { ok: false, problem: "not_found" } as const;

    const decision = decideMemberChange({ actorId: actor.id, target, change, activeAdminCount: admins.length });
    if (!decision.ok) return decision;
    if (!decision.changed) return { ok: true, changed: false } as const;

    if ("status" in change && change.status === "active") {
      // One organization per person (D13): reactivating someone who joined
      // elsewhere would make their session ambiguous and lock them out.
      const elsewhere = await tx.membership.count({
        where: { userId: target.userId, status: "active", organizationId: { not: actor.organizationId } },
      });
      if (elsewhere > 0) return { ok: false, problem: "other_organization" } as const;
    }

    await tx.membership.update({
      where: { id: target.id },
      data:
        "role" in change
          ? { role: change.role }
          : { status: change.status, deactivatedAt: change.status === "deactivated" ? now : null },
    });

    await tx.auditEvent.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        entityType: "membership",
        entityId: target.id,
        ...("role" in change
          ? { action: "membership.role_changed", metadata: { previousRole: target.role, role: change.role } }
          : {
              action: change.status === "deactivated" ? "membership.deactivated" : "membership.reactivated",
              metadata: { role: target.role },
            }),
      },
    });

    return { ok: true, changed: true } as const;
  });
}
