import "dotenv/config";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { ForbiddenError } from "@/server/security/authorization";
import {
  acceptInvitation,
  AuthAccountExistsError,
  WeakPasswordError,
  createInvitation,
  findInvitationByToken,
  revokeInvitation,
  type AuthAccounts,
  type InvitationActor,
} from "./invitations";

/**
 * Invitation use cases against a real Postgres (EP-04.4, D12). Supabase is
 * replaced by an in-memory `AuthAccounts`, so failures and races can be
 * staged; everything else is production code.
 */

const SUFFIX = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = (who: string) => `${who}-${SUFFIX}@exemplo.test`;
const now = new Date();

let admin: InvitationActor;
let otherAdmin: InvitationActor;
const createdUserIds: string[] = [];

class FakeAccounts implements AuthAccounts {
  created: string[] = [];
  removed: string[] = [];
  existing = new Set<string>();
  weakPasswords = false;
  async create({ email }: { email: string }) {
    if (this.existing.has(email)) throw new AuthAccountExistsError();
    if (this.weakPasswords) throw new WeakPasswordError();
    const authId = `fake-auth-${email}`;
    this.created.push(authId);
    return { authId };
  }
  async remove(authId: string) {
    this.removed.push(authId);
  }
}
let accounts: FakeAccounts;

async function makeAdmin(who: string): Promise<InvitationActor> {
  const organization = await prisma.organization.create({ data: { name: `Org ${who} ${SUFFIX}` } });
  const user = await prisma.user.create({
    data: {
      supabaseAuthId: `auth-${who}-${SUFFIX}`,
      name: who,
      email: email(who),
      memberships: { create: { organizationId: organization.id, role: "admin" } },
    },
  });
  createdUserIds.push(user.id);
  return { id: user.id, organizationId: organization.id, role: "admin" };
}

async function invite(who: string, role: "leader" | "member" = "member", actor = admin) {
  const result = await createInvitation(actor, { email: email(who), role }, now);
  if (!result.ok) throw new Error(`unexpected ${result.problem}`);
  return result;
}

beforeAll(async () => {
  admin = await makeAdmin("admin");
  otherAdmin = await makeAdmin("other");
});

beforeEach(() => {
  accounts = new FakeAccounts();
});

afterAll(async () => {
  const orgIds = [admin?.organizationId, otherAdmin?.organizationId].filter(Boolean);
  const invitees = await prisma.user.findMany({ where: { email: { endsWith: `${SUFFIX}@exemplo.test` } } });
  const userIds = [...new Set([...createdUserIds, ...invitees.map((u) => u.id)])];
  await prisma.auditEvent.deleteMany({ where: { organizationId: { in: orgIds } } });
  await prisma.invitation.deleteMany({ where: { organizationId: { in: orgIds } } });
  await prisma.membership.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("createInvitation", () => {
  it("lets only administrators invite (D11)", async () => {
    for (const role of ["leader", "member"] as const) {
      await expect(
        createInvitation({ ...admin, role }, { email: email("x"), role: "member" }, now),
      ).rejects.toBeInstanceOf(ForbiddenError);
    }
  });

  it("stores the token only as a hash, with a 7-day expiry, and audits without the email", async () => {
    const { invitation, token } = await invite("ana", "leader");
    const row = await prisma.invitation.findUniqueOrThrow({ where: { id: invitation.id } });

    expect(row.tokenHash).not.toBe(token);
    expect(row.email).toBe(email("ana"));
    expect(row.role).toBe("leader");
    expect(row.expiresAt.getTime() - now.getTime()).toBe(7 * 24 * 60 * 60 * 1000);

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { entityId: invitation.id, action: "invitation.created" },
    });
    expect(audit.actorId).toBe(admin.id);
    expect(JSON.stringify(audit.metadata)).not.toContain("@");
  });

  it("normalizes the email", async () => {
    const result = await createInvitation(admin, { email: `  ${email("Caps").toUpperCase()} `, role: "member" }, now);
    expect(result.ok && result.invitation.email).toBe(email("caps"));
  });

  it("refuses someone who already has an account (D13)", async () => {
    const result = await createInvitation(admin, { email: email("other"), role: "member" }, now);
    expect(result).toEqual({ ok: false, problem: "already_has_account" });
  });

  it("replaces a previous pending invitation for the same email, revoking its link", async () => {
    const first = await invite("bia");
    const second = await invite("bia");

    expect((await findInvitationByToken(first.token, now)).ok).toBe(false);
    expect((await findInvitationByToken(second.token, now)).ok).toBe(true);
  });
});

describe("revokeInvitation", () => {
  it("revokes a pending invitation and its link stops working", async () => {
    const { invitation, token } = await invite("caio");
    expect(await revokeInvitation(admin, invitation.id, now)).toEqual({ ok: true });
    expect(await findInvitationByToken(token, now)).toEqual({ ok: false, problem: "revoked" });
    expect(
      await prisma.auditEvent.count({ where: { entityId: invitation.id, action: "invitation.revoked" } }),
    ).toBe(1);
  });

  it("doesn't see another organization's invitation", async () => {
    const { invitation } = await invite("dani", "member", otherAdmin);
    expect(await revokeInvitation(admin, invitation.id, now)).toEqual({ ok: false, problem: "not_found" });
  });

  it("refuses non-administrators", async () => {
    const { invitation } = await invite("edu");
    await expect(revokeInvitation({ ...admin, role: "leader" }, invitation.id, now)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe("findInvitationByToken", () => {
  it("returns only what the invitee needs to see", async () => {
    const { token } = await invite("fabi", "leader");
    expect(await findInvitationByToken(token, now)).toEqual({
      ok: true,
      invitation: { email: email("fabi"), role: "leader", organizationName: `Org admin ${SUFFIX}` },
    });
  });

  it("doesn't find a made-up token", async () => {
    expect(await findInvitationByToken("not-a-real-token", now)).toEqual({ ok: false, problem: "not_found" });
  });

  it("reports an expired link", async () => {
    const { token } = await invite("gabi");
    const afterExpiry = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
    expect(await findInvitationByToken(token, afterExpiry)).toEqual({ ok: false, problem: "expired" });
  });
});

describe("acceptInvitation", () => {
  const form = { name: "Pessoa Convidada", password: "senha-forte-123" };

  it("creates the account, the user and an active membership with the invited role", async () => {
    const { invitation, token } = await invite("hugo", "leader");

    expect(await acceptInvitation(token, form, accounts, now)).toEqual({ ok: true });

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: email("hugo") },
      include: { memberships: true },
    });
    expect(user.supabaseAuthId).toBe(`fake-auth-${email("hugo")}`);
    expect(user.name).toBe(form.name);
    expect(user.memberships).toMatchObject([
      { organizationId: admin.organizationId, role: "leader", status: "active" },
    ]);

    const row = await prisma.invitation.findUniqueOrThrow({ where: { id: invitation.id } });
    expect(row.acceptedById).toBe(user.id);
    expect(
      await prisma.auditEvent.findMany({
        where: { organizationId: admin.organizationId, actorId: user.id },
        select: { action: true },
        orderBy: { action: "asc" },
      }),
    ).toEqual([{ action: "invitation.accepted" }, { action: "membership.created" }]);
  });

  it("is single-use", async () => {
    const { token } = await invite("ivo");
    await acceptInvitation(token, form, accounts, now);
    expect(await acceptInvitation(token, form, new FakeAccounts(), now)).toEqual({
      ok: false,
      problem: "accepted",
    });
  });

  it("refuses revoked and expired links without creating an account", async () => {
    const revoked = await invite("juca");
    await revokeInvitation(admin, revoked.invitation.id, now);
    expect(await acceptInvitation(revoked.token, form, accounts, now)).toEqual({ ok: false, problem: "revoked" });

    const expired = await invite("kaka");
    const afterExpiry = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
    expect(await acceptInvitation(expired.token, form, accounts, afterExpiry)).toEqual({
      ok: false,
      problem: "expired",
    });
    expect(accounts.created).toEqual([]);
  });

  it("refuses when a login account with that email already exists", async () => {
    const { token } = await invite("lia");
    accounts.existing.add(email("lia"));
    expect(await acceptInvitation(token, form, accounts, now)).toEqual({
      ok: false,
      problem: "auth_account_exists",
    });
    expect(await prisma.user.count({ where: { email: email("lia") } })).toBe(0);
  });

  it("reports a password the provider rejects, keeping the link usable", async () => {
    const { token } = await invite("nina");
    accounts.weakPasswords = true;
    expect(await acceptInvitation(token, form, accounts, now)).toEqual({ ok: false, problem: "weak_password" });
    expect((await findInvitationByToken(token, now)).ok).toBe(true);
  });

  it("lets only one of two simultaneous acceptances win, and undoes the loser's account", async () => {
    const { token } = await invite("mel");
    const results = await Promise.all([
      acceptInvitation(token, form, accounts, now),
      acceptInvitation(token, form, accounts, now),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await prisma.membership.count({ where: { user: { email: email("mel") } } })).toBe(1);
    // The loser had already created a login account; it must not be left behind.
    expect(accounts.removed).toHaveLength(accounts.created.length - 1);
  });
});
