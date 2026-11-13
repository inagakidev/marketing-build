import { describe, expect, it } from "vitest";
import * as PrismaEnums from "../../generated/prisma/enums";
import { decideMembershipAccess, MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES } from "./membershipAccess";

describe("membership unions vs Prisma schema", () => {
  it("MembershipRole matches", () => {
    expect([...MEMBERSHIP_ROLES].sort()).toEqual(Object.values(PrismaEnums.MembershipRole).sort());
  });

  it("MembershipStatus matches", () => {
    expect([...MEMBERSHIP_STATUSES].sort()).toEqual(
      Object.values(PrismaEnums.MembershipStatus).sort(),
    );
  });
});

const active = { organizationId: "org-1", role: "leader", status: "active" } as const;
const deactivated = { organizationId: "org-1", role: "admin", status: "deactivated" } as const;

describe("decideMembershipAccess (EP-04.2, D13)", () => {
  it("allows the single active membership, with its organization and role", () => {
    expect(decideMembershipAccess([active])).toEqual({
      action: "allow",
      organizationId: "org-1",
      role: "leader",
    });
  });

  it("denies a user without any membership", () => {
    expect(decideMembershipAccess([])).toEqual({ action: "deny", reason: "no_membership" });
  });

  it("denies a deactivated member, whatever the role was", () => {
    expect(decideMembershipAccess([deactivated])).toEqual({
      action: "deny",
      reason: "deactivated",
    });
  });

  it("ignores deactivated memberships next to the active one", () => {
    const old = { ...deactivated, organizationId: "org-0" };
    expect(decideMembershipAccess([old, active])).toEqual({
      action: "allow",
      organizationId: "org-1",
      role: "leader",
    });
  });

  it("fails closed when more than one membership is active (D13 broken)", () => {
    const other = { ...active, organizationId: "org-2", role: "admin" } as const;
    expect(decideMembershipAccess([active, other])).toEqual({
      action: "deny",
      reason: "ambiguous",
    });
  });
});
