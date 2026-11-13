import type { MembershipRole } from "./membership";

/**
 * The Phase 1 permission matrix (docs/REQUIREMENTS.md §2.3, D8–D11).
 *
 * The only place that maps roles to actions: routes and screens ask these
 * functions instead of comparing roles (ARCHITECTURE §6.4). Later phases add
 * functions here when their row of the matrix is decided.
 */

/** How a member takes part in a project. `null` = not a participant. */
export type ProjectParticipation = "owner" | "collaborator" | null;

const isAdmin = (role: MembershipRole) => role === "admin";
/** Leaders coordinate the whole organization (D11). */
const coordinates = (role: MembershipRole) => role === "admin" || role === "leader";

// Organization level ---------------------------------------------------------

export const canConfigureOrganization = isAdmin;
/** Invite, deactivate and reactivate members (D11). */
export const canManageMembers = isAdmin;
export const canChangeMemberRole = isAdmin;
export const canViewAuditLog = isAdmin;

/** Members only see clients of projects they take part in. */
export const canViewAllClients = coordinates;
/** Create or edit a client. */
export const canManageClients = coordinates;
/** Deletion policy itself still depends on PD-12 (D4). */
export const canDeleteClient = isAdmin;
export const canCreateProject = coordinates;

// Project level --------------------------------------------------------------

export function canViewProject(role: MembershipRole, participation: ProjectParticipation): boolean {
  return coordinates(role) || participation !== null;
}

/** Edit a project and create, revoke or regenerate its briefing links. */
export function canEditProject(role: MembershipRole, participation: ProjectParticipation): boolean {
  return coordinates(role) || participation !== null;
}

export function canAssignProjectMembers(
  role: MembershipRole,
  participation: ProjectParticipation,
): boolean {
  return coordinates(role) || participation === "owner";
}

/** Close or reopen, always with a justification. */
export function canCloseProject(role: MembershipRole, participation: ProjectParticipation): boolean {
  return coordinates(role) || participation === "owner";
}
