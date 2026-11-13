import type { MembershipRole, MembershipStatus } from "@/modules/identity/domain/membership";

/**
 * Which membership a signed-in user acts through (EP-04.2, D9, D13).
 *
 * Pure: it receives the user's memberships and decides. No Prisma import, so
 * the rule is unit-tested.
 */

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
