import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./db";
import { loadSessionUser } from "./auth";

/**
 * The session reads the membership on every request (EP-04.2): a member who
 * is deactivated or never joined loses access on the next request, not when
 * a cookie expires.
 */

const SUFFIX = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let organizationId: string;
const users: Record<string, string> = {};

beforeAll(async () => {
  organizationId = (await prisma.organization.create({ data: { name: `Org ${SUFFIX}` } })).id;

  for (const who of ["leader", "deactivated", "outsider"]) {
    users[who] = (
      await prisma.user.create({
        data: { supabaseAuthId: `auth-${who}-${SUFFIX}`, name: who, email: `${who}-${SUFFIX}@exemplo.test` },
      })
    ).id;
  }

  await prisma.membership.createMany({
    data: [
      { organizationId, userId: users.leader, role: "leader" },
      { organizationId, userId: users.deactivated, role: "admin", status: "deactivated", deactivatedAt: new Date() },
    ],
  });
});

afterAll(async () => {
  await prisma.membership.deleteMany({ where: { organizationId } });
  await prisma.organization.delete({ where: { id: organizationId } });
  await prisma.user.deleteMany({ where: { id: { in: Object.values(users) } } });
  await prisma.$disconnect();
});

describe("loadSessionUser", () => {
  it("returns the user with the organization and role of the active membership", async () => {
    expect(await loadSessionUser(users.leader)).toEqual({
      id: users.leader,
      name: "leader",
      email: `leader-${SUFFIX}@exemplo.test`,
      organizationId,
      role: "leader",
    });
  });

  it("returns null for a deactivated member", async () => {
    expect(await loadSessionUser(users.deactivated)).toBeNull();
  });

  it("returns null for a user without a membership", async () => {
    expect(await loadSessionUser(users.outsider)).toBeNull();
  });

  it("loses access on the next call after deactivation", async () => {
    await prisma.membership.update({
      where: { organizationId_userId: { organizationId, userId: users.leader } },
      data: { status: "deactivated", deactivatedAt: new Date() },
    });
    expect(await loadSessionUser(users.leader)).toBeNull();
  });

  it("returns null for an unknown user id", async () => {
    expect(await loadSessionUser(`missing-${SUFFIX}`)).toBeNull();
  });
});
