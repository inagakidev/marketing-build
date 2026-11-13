import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { ForbiddenError } from "@/server/security/authorization";
import { changeMember, listOrganizationMembers } from "./members";
import type { InvitationActor } from "./invitations";

/** Member management against a real Postgres (EP-04.5, D11, AUTH-11/12). */

const SUFFIX = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const orgIds: string[] = [];
const userIds: string[] = [];

async function makeOrg(name: string) {
  const org = await prisma.organization.create({ data: { name: `${name} ${SUFFIX}` } });
  orgIds.push(org.id);
  return org.id;
}

async function join(organizationId: string, who: string, role: "admin" | "leader" | "member") {
  const user = await prisma.user.create({
    data: { supabaseAuthId: `auth-${who}-${SUFFIX}`, name: who, email: `${who}-${SUFFIX}@exemplo.test` },
  });
  userIds.push(user.id);
  const membership = await prisma.membership.create({ data: { organizationId, userId: user.id, role } });
  const actor: InvitationActor = { id: user.id, organizationId, role };
  return { actor, membershipId: membership.id };
}

let orgA: string;
let orgB: string;
let ana: Awaited<ReturnType<typeof join>>;
let lia: Awaited<ReturnType<typeof join>>;
let bob: Awaited<ReturnType<typeof join>>;

beforeAll(async () => {
  orgA = await makeOrg("Org A");
  orgB = await makeOrg("Org B");
  ana = await join(orgA, "ana", "admin");
  lia = await join(orgA, "lia", "leader");
  bob = await join(orgB, "bob", "admin");
});

afterAll(async () => {
  await prisma.auditEvent.deleteMany({ where: { organizationId: { in: orgIds } } });
  await prisma.invitation.deleteMany({ where: { organizationId: { in: orgIds } } });
  await prisma.membership.deleteMany({ where: { organizationId: { in: orgIds } } });
  await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("listOrganizationMembers", () => {
  it("lists only the actor's organization, with pending invitations", async () => {
    await prisma.invitation.create({
      data: {
        organizationId: orgA,
        email: `pending-${SUFFIX}@exemplo.test`,
        role: "member",
        tokenHash: `hash-${SUFFIX}`,
        expiresAt: new Date(Date.now() + 86_400_000),
        invitedById: ana.actor.id,
      },
    });

    const { members, invitations } = await listOrganizationMembers(ana.actor);
    expect(members.map((m) => m.name).sort()).toEqual(["ana", "lia"]);
    expect(members.find((m) => m.name === "ana")?.isSelf).toBe(true);
    expect(invitations).toMatchObject([{ email: `pending-${SUFFIX}@exemplo.test`, role: "member", invitedByName: "ana" }]);
  });

  it("is for administrators only (D11)", async () => {
    await expect(listOrganizationMembers(lia.actor)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("changeMember", () => {
  it("changes a role and audits the previous one, without the email", async () => {
    expect(await changeMember(ana.actor, lia.membershipId, { role: "member" })).toEqual({ ok: true, changed: true });
    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { entityId: lia.membershipId, action: "membership.role_changed" },
    });
    expect(audit).toMatchObject({ actorId: ana.actor.id, metadata: { previousRole: "leader", role: "member" } });
    expect(JSON.stringify(audit.metadata)).not.toContain("@");
  });

  it("deactivates and reactivates, keeping the row (AUTH-11, AUTH-12)", async () => {
    expect(await changeMember(ana.actor, lia.membershipId, { status: "deactivated" })).toEqual({
      ok: true,
      changed: true,
    });
    const off = await prisma.membership.findUniqueOrThrow({ where: { id: lia.membershipId } });
    expect(off.status).toBe("deactivated");
    expect(off.deactivatedAt).not.toBeNull();

    expect(await changeMember(ana.actor, lia.membershipId, { status: "active" })).toEqual({ ok: true, changed: true });
    const on = await prisma.membership.findUniqueOrThrow({ where: { id: lia.membershipId } });
    expect(on).toMatchObject({ status: "active", deactivatedAt: null });

    const actions = await prisma.auditEvent.findMany({
      where: { entityId: lia.membershipId, action: { in: ["membership.deactivated", "membership.reactivated"] } },
      orderBy: { createdAt: "asc" },
      select: { action: true },
    });
    expect(actions.map((a) => a.action)).toEqual(["membership.deactivated", "membership.reactivated"]);
  });

  it("refuses to demote or deactivate the last active admin", async () => {
    const solo = await join(await makeOrg("Solo"), "solo", "admin");
    const helper = await join(solo.actor.organizationId, "helper", "admin");
    await changeMember(helper.actor, helper.membershipId, { role: "member" });

    expect(await changeMember(helper.actor, solo.membershipId, { role: "leader" })).toEqual({
      ok: false,
      problem: "last_admin",
    });
  });

  it("refuses to deactivate yourself", async () => {
    expect(await changeMember(ana.actor, ana.membershipId, { status: "deactivated" })).toEqual({
      ok: false,
      problem: "self",
    });
  });

  it("doesn't see another organization's member", async () => {
    expect(await changeMember(ana.actor, bob.membershipId, { role: "member" })).toEqual({
      ok: false,
      problem: "not_found",
    });
  });

  it("is for administrators only", async () => {
    await expect(changeMember(lia.actor, ana.membershipId, { role: "member" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("when two admins demote each other at once, one admin always remains", async () => {
    const org = await makeOrg("Race");
    const x = await join(org, "x", "admin");
    const y = await join(org, "y", "admin");

    const results = await Promise.all([
      changeMember(x.actor, y.membershipId, { role: "member" }),
      changeMember(y.actor, x.membershipId, { role: "member" }),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await prisma.membership.count({ where: { organizationId: org, role: "admin", status: "active" } })).toBe(1);
  });
});
