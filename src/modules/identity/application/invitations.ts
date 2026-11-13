import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import type { SessionUser } from "@/server/auth";
import { authorize } from "@/server/security/authorization";
import { generateInvitationToken, hashInvitationToken } from "@/server/security/invitationToken";
import { canManageMembers } from "../domain/permissions";
import type { MembershipRole } from "../domain/membership";
import { invitationExpiry, invitationState, normalizeEmail } from "../domain/invitation";

/**
 * Invitation use cases (EP-04.4, D11–D13).
 *
 * Each write that changes access runs in one transaction with its audit event
 * (AUD-01). Audit metadata never carries the email (no PII in the trail).
 */

export type InvitationActor = Pick<SessionUser, "id" | "organizationId" | "role">;

/**
 * The login provider, injected so tests can stage failures and races. In
 * production it's Supabase Auth (`supabaseAuthAccounts.ts`).
 */
export interface AuthAccounts {
  create(input: { email: string; password: string; name: string }): Promise<{ authId: string }>;
  remove(authId: string): Promise<void>;
}

/** The provider can't create accounts right now (e.g. no service role key). */
export class AuthUnavailableError extends Error {
  constructor() {
    super("Auth provider can't create accounts");
    this.name = "AuthUnavailableError";
  }
}

/** The provider rejected the password as too weak. */
export class WeakPasswordError extends Error {
  constructor() {
    super("Password rejected as weak");
    this.name = "WeakPasswordError";
  }
}

/** The provider already has a login account for this email. */
export class AuthAccountExistsError extends Error {
  constructor() {
    super("Auth account already exists");
    this.name = "AuthAccountExistsError";
  }
}

type LinkProblem = "not_found" | "expired" | "revoked" | "accepted";

// Create -----------------------------------------------------------------------

export type CreateInvitationResult =
  | {
      ok: true;
      invitation: { id: string; email: string; role: MembershipRole; expiresAt: Date };
      /** Clear-text token: returned once, to build the link, and never stored. */
      token: string;
    }
  | { ok: false; problem: "already_has_account" };

export async function createInvitation(
  actor: InvitationActor,
  input: { email: string; role: MembershipRole },
  now: Date = new Date(),
): Promise<CreateInvitationResult> {
  authorize(canManageMembers(actor.role));
  const email = normalizeEmail(input.email);

  // One organization per person in V1 (D13); a deactivated member is
  // reactivated from the members screen, not re-invited.
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false, problem: "already_has_account" };
  }

  const { token, tokenHash } = generateInvitationToken();

  const invitation = await prisma.$transaction(async (tx) => {
    // A new link replaces any pending one for the same person, so only the
    // latest link the administrator sent works.
    const previous = await tx.invitation.findMany({
      where: { organizationId: actor.organizationId, email, acceptedAt: null, revokedAt: null },
      select: { id: true },
    });
    if (previous.length > 0) {
      await tx.invitation.updateMany({
        where: { id: { in: previous.map((p) => p.id) } },
        data: { revokedAt: now },
      });
      await tx.auditEvent.createMany({
        data: previous.map((p) => ({
          organizationId: actor.organizationId,
          actorId: actor.id,
          entityType: "invitation",
          entityId: p.id,
          action: "invitation.revoked",
          metadata: { reason: "replaced" },
        })),
      });
    }

    const created = await tx.invitation.create({
      data: {
        organizationId: actor.organizationId,
        email,
        role: input.role,
        tokenHash,
        expiresAt: invitationExpiry(now),
        invitedById: actor.id,
        createdAt: now,
      },
      select: { id: true, email: true, role: true, expiresAt: true },
    });
    await tx.auditEvent.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        entityType: "invitation",
        entityId: created.id,
        action: "invitation.created",
        metadata: { role: input.role },
      },
    });
    return created;
  });

  return { ok: true, invitation, token };
}

// Revoke -----------------------------------------------------------------------

export async function revokeInvitation(
  actor: InvitationActor,
  invitationId: string,
  now: Date = new Date(),
): Promise<{ ok: true } | { ok: false; problem: "not_found" | "not_pending" }> {
  authorize(canManageMembers(actor.role));

  return prisma.$transaction(async (tx) => {
    // Scoped by organization: another organization's id reads as missing.
    const invitation = await tx.invitation.findFirst({
      where: { id: invitationId, organizationId: actor.organizationId },
    });
    if (!invitation) return { ok: false, problem: "not_found" } as const;

    const { count } = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    });
    if (count === 0) return { ok: false, problem: "not_pending" } as const;

    await tx.auditEvent.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        entityType: "invitation",
        entityId: invitation.id,
        action: "invitation.revoked",
        metadata: { reason: "manual" },
      },
    });
    return { ok: true } as const;
  });
}

// Read by token (public) ---------------------------------------------------------

export type FindInvitationResult =
  | { ok: true; invitation: { email: string; role: MembershipRole; organizationName: string } }
  | { ok: false; problem: LinkProblem };

/** What the invite page shows. No internal ids: the token is the reference. */
export async function findInvitationByToken(
  token: string,
  now: Date = new Date(),
): Promise<FindInvitationResult> {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    select: {
      email: true,
      role: true,
      acceptedAt: true,
      revokedAt: true,
      expiresAt: true,
      organization: { select: { name: true } },
    },
  });
  if (!invitation) return { ok: false, problem: "not_found" };

  const state = invitationState(invitation, now);
  if (state !== "pending") return { ok: false, problem: state };

  return {
    ok: true,
    invitation: {
      email: invitation.email,
      role: invitation.role,
      organizationName: invitation.organization.name,
    },
  };
}

// Accept (public) ------------------------------------------------------------

export type AcceptInvitationResult =
  | { ok: true }
  | {
      ok: false;
      problem: LinkProblem | "already_has_account" | "auth_account_exists" | "weak_password";
    };

/** Thrown inside the transaction to roll it back when another request won. */
class InvitationClaimedError extends Error {}

/**
 * Creates the login account, then — in one transaction — claims the
 * invitation, creates the user and the membership, and audits.
 *
 * The login account lives outside the database, so it can't join the
 * transaction. It's created first and removed again if the transaction fails;
 * the conditional claim (`updateMany` on a still-pending row) makes sure only
 * one of two simultaneous acceptances wins.
 */
export async function acceptInvitation(
  token: string,
  input: { name: string; password: string },
  accounts: AuthAccounts,
  now: Date = new Date(),
): Promise<AcceptInvitationResult> {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
  });
  if (!invitation) return { ok: false, problem: "not_found" };

  const state = invitationState(invitation, now);
  if (state !== "pending") return { ok: false, problem: state };

  if (await prisma.user.findUnique({ where: { email: invitation.email }, select: { id: true } })) {
    return { ok: false, problem: "already_has_account" };
  }

  let authId: string;
  try {
    ({ authId } = await accounts.create({
      email: invitation.email,
      password: input.password,
      name: input.name,
    }));
  } catch (error) {
    if (error instanceof AuthAccountExistsError) return { ok: false, problem: "auth_account_exists" };
    if (error instanceof WeakPasswordError) return { ok: false, problem: "weak_password" };
    throw error;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { acceptedAt: now },
      });
      if (claimed.count === 0) throw new InvitationClaimedError();

      const user = await tx.user.create({
        data: { supabaseAuthId: authId, name: input.name, email: invitation.email },
      });
      const membership = await tx.membership.create({
        data: { organizationId: invitation.organizationId, userId: user.id, role: invitation.role },
      });
      await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedById: user.id } });
      await tx.auditEvent.createMany({
        data: [
          {
            organizationId: invitation.organizationId,
            actorId: user.id,
            entityType: "invitation",
            entityId: invitation.id,
            action: "invitation.accepted",
            metadata: { role: invitation.role },
          },
          {
            organizationId: invitation.organizationId,
            actorId: user.id,
            entityType: "membership",
            entityId: membership.id,
            action: "membership.created",
            metadata: { role: invitation.role, source: "invitation" },
          },
        ],
      });
    });
  } catch (error) {
    await accounts.remove(authId);
    if (error instanceof InvitationClaimedError) return { ok: false, problem: "accepted" };
    // The same email joined through another path between the check and now.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, problem: "already_has_account" };
    }
    throw error;
  }

  return { ok: true };
}
