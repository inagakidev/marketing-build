/**
 * Invitation rules (D12): a copied link, single-use, valid for 7 days.
 * Pure, so the lifecycle is unit-tested without a database.
 */

export const INVITATION_TTL_DAYS = 7;

export type InvitationState = "pending" | "accepted" | "revoked" | "expired";

export interface InvitationLifecycle {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}

/** Accepted wins: once someone joined, the link's later fate doesn't matter. */
export function invitationState(invitation: InvitationLifecycle, now: Date): InvitationState {
  if (invitation.acceptedAt) return "accepted";
  if (invitation.revokedAt) return "revoked";
  if (invitation.expiresAt.getTime() <= now.getTime()) return "expired";
  return "pending";
}

export function invitationExpiry(createdAt: Date): Date {
  return new Date(createdAt.getTime() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Same normalization as login (src/server/auth.ts), so lookups match. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
