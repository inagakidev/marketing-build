import type { MembershipRole, MembershipStatus } from "./membership";

/**
 * Whether a role or status change to a membership may happen (EP-04.5).
 * Who may make it at all is `canChangeMemberRole` / `canManageMembers`; this
 * is about the organization's invariants. Pure, so each rule has a unit test.
 */

export type MemberChange = { role: MembershipRole } | { status: MembershipStatus };

export type MemberChangeDecision =
  | { ok: true; changed: boolean }
  | { ok: false; problem: "last_admin" | "self" };

export function decideMemberChange({
  actorId,
  target,
  change,
  activeAdminCount,
}: {
  actorId: string;
  target: { userId: string; role: MembershipRole; status: MembershipStatus };
  change: MemberChange;
  /** Active admins in the organization, the target included. */
  activeAdminCount: number;
}): MemberChangeDecision {
  const next = {
    role: "role" in change ? change.role : target.role,
    status: "status" in change ? change.status : target.status,
  };
  if (next.role === target.role && next.status === target.status) return { ok: true, changed: false };

  // Locking yourself out is never what was meant; another admin can do it.
  if (target.userId === actorId && next.status === "deactivated") return { ok: false, problem: "self" };

  const isActiveAdmin = (m: { role: MembershipRole; status: MembershipStatus }) =>
    m.role === "admin" && m.status === "active";
  if (isActiveAdmin(target) && !isActiveAdmin(next) && activeAdminCount <= 1) {
    return { ok: false, problem: "last_admin" };
  }

  return { ok: true, changed: true };
}
