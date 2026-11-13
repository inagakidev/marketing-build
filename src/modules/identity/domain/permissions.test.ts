import { describe, expect, it } from "vitest";
import type { MembershipRole } from "./membership";
import {
  canAssignProjectMembers,
  canChangeMemberRole,
  canCloseProject,
  canConfigureOrganization,
  canCreateProject,
  canDeleteClient,
  canEditProject,
  canManageClients,
  canManageMembers,
  canViewAllClients,
  canViewAuditLog,
  canViewProject,
  type ProjectParticipation,
} from "./permissions";

/**
 * The Phase 1 permission matrix, cell by cell (docs/REQUIREMENTS.md §2.3, D8).
 * Each row reads like the document: admin, leader, member. Every "no" is a
 * negative test (docs/guidelines/QUALITY.md).
 */

const ROLES: MembershipRole[] = ["admin", "leader", "member"];

const organizationRows: [string, (role: MembershipRole) => boolean, [boolean, boolean, boolean]][] = [
  ["configure the organization", canConfigureOrganization, [true, false, false]],
  ["invite, deactivate or reactivate members", canManageMembers, [true, false, false]],
  ["change a member's role", canChangeMemberRole, [true, false, false]],
  ["view every client", canViewAllClients, [true, true, false]],
  ["create or edit a client", canManageClients, [true, true, false]],
  ["delete a client", canDeleteClient, [true, false, false]],
  ["create a project", canCreateProject, [true, true, false]],
  ["read the audit log", canViewAuditLog, [true, false, false]],
];

describe("organization-level permissions", () => {
  describe.each(organizationRows)("%s", (_action, can, expected) => {
    it.each(ROLES.map((role, i) => [role, expected[i]] as const))("%s → %s", (role, allowed) => {
      expect(can(role)).toBe(allowed);
    });
  });
});

type ProjectCan = (role: MembershipRole, participation: ProjectParticipation) => boolean;

/** [admin, leader, member as owner, member as collaborator, member outside]. */
const projectRows: [string, ProjectCan, [boolean, boolean, boolean, boolean, boolean]][] = [
  ["view a project", canViewProject, [true, true, true, true, false]],
  ["edit a project and its briefing links", canEditProject, [true, true, true, true, false]],
  ["assign the owner and collaborators", canAssignProjectMembers, [true, true, true, false, false]],
  ["close or reopen a project", canCloseProject, [true, true, true, false, false]],
];

describe("project-level permissions", () => {
  describe.each(projectRows)("%s", (_action, can, expected) => {
    it("admin and leader, whatever their participation", () => {
      for (const participation of ["owner", "collaborator", null] as const) {
        expect(can("admin", participation)).toBe(expected[0]);
        expect(can("leader", participation)).toBe(expected[1]);
      }
    });

    it("member as owner, as collaborator and outside the project", () => {
      expect(can("member", "owner")).toBe(expected[2]);
      expect(can("member", "collaborator")).toBe(expected[3]);
      expect(can("member", null)).toBe(expected[4]);
    });
  });
});
