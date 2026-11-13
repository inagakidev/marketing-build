import { describe, expect, it } from "vitest";
import { decideMemberChange } from "./memberChange";

const admin = { userId: "u-admin", role: "admin", status: "active" } as const;
const leader = { userId: "u-leader", role: "leader", status: "active" } as const;

describe("decideMemberChange (EP-04.5)", () => {
  it("lets an admin change another member's role", () => {
    expect(
      decideMemberChange({ actorId: "u-admin", target: leader, change: { role: "member" }, activeAdminCount: 1 }),
    ).toEqual({ ok: true, changed: true });
  });

  it("never leaves the organization without an active admin", () => {
    const other = { ...admin, userId: "u-other" };
    expect(
      decideMemberChange({ actorId: "u-admin", target: other, change: { role: "leader" }, activeAdminCount: 1 }),
    ).toEqual({ ok: false, problem: "last_admin" });
    expect(
      decideMemberChange({ actorId: "u-admin", target: other, change: { status: "deactivated" }, activeAdminCount: 1 }),
    ).toEqual({ ok: false, problem: "last_admin" });
  });

  it("allows demoting an admin while another active admin remains", () => {
    const other = { ...admin, userId: "u-other" };
    expect(
      decideMemberChange({ actorId: "u-admin", target: other, change: { role: "leader" }, activeAdminCount: 2 }),
    ).toEqual({ ok: true, changed: true });
  });

  it("doesn't let anyone deactivate their own access", () => {
    expect(
      decideMemberChange({ actorId: "u-admin", target: admin, change: { status: "deactivated" }, activeAdminCount: 3 }),
    ).toEqual({ ok: false, problem: "self" });
  });

  it("reactivates a deactivated member, whatever the admin count", () => {
    const gone = { ...leader, status: "deactivated" } as const;
    expect(
      decideMemberChange({ actorId: "u-admin", target: gone, change: { status: "active" }, activeAdminCount: 1 }),
    ).toEqual({ ok: true, changed: true });
  });

  it("doesn't count a deactivated admin as the last admin", () => {
    const goneAdmin = { ...admin, userId: "u-other", status: "deactivated" } as const;
    expect(
      decideMemberChange({ actorId: "u-admin", target: goneAdmin, change: { role: "member" }, activeAdminCount: 1 }),
    ).toEqual({ ok: true, changed: true });
  });

  it("treats a change to the current value as a no-op", () => {
    expect(
      decideMemberChange({ actorId: "u-admin", target: leader, change: { role: "leader" }, activeAdminCount: 1 }),
    ).toEqual({ ok: true, changed: false });
  });
});
