/**
 * Which membership a signed-in user acts through (EP-04.2, D9, D13).
 *
 * Pure: it receives the user's memberships and decides. No Prisma import, so
 * the rule is unit-tested and the policies built on it (EP-04.3) stay pure
 * too. The unions mirror the Prisma enums; `membershipAccess.test.ts` locks
 * them together.
 */

export const MEMBERSHIP_ROLES = ["admin", "leader", "member"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_STATUSES = ["active", "deactivated"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export interface MembershipRef {
  organizationId: string;
  role: MembershipRole;
  status: MembershipStatus;
}

export type MembershipAccessDecision =
  | { action: "allow"; organizationId: string; role: MembershipRole }
  | { action: "deny"; reason: "no_membership" | "deactivated" | "ambiguous" };

export function decideMembershipAccess(
  memberships: readonly MembershipRef[],
): MembershipAccessDecision {
  if (memberships.length === 0) return { action: "deny", reason: "no_membership" };

  const active = memberships.filter((m) => m.status === "active");
  if (active.length === 0) return { action: "deny", reason: "deactivated" };

  // V1 keeps one organization per person (D13). Two active memberships mean
  // that rule was broken somewhere; picking one would be a guess about which
  // organization's data to show, so refuse instead.
  if (active.length > 1) return { action: "deny", reason: "ambiguous" };

  const [membership] = active;
  return { action: "allow", organizationId: membership.organizationId, role: membership.role };
}
