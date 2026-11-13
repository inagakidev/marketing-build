import "dotenv/config";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db";
import { createBriefing, saveAnswers, submitBriefing } from "@/server/briefing";
import { Q } from "@/core";
import type { SessionUser } from "@/server/auth";

/**
 * API tests (QUAL-04): the real route handlers, against a real Postgres. Only
 * the session is simulated — the rest (validation, ownership authorization,
 * origin, rate limit, transactions) is production code.
 *
 * The priority is the NEGATIVE paths: no session, other origin, another
 * account's resource, missing/submitted link, invalid body.
 */

const session = vi.hoisted(() => ({ current: null as null | SessionUser }));

vi.mock("@/server/auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/server/auth")>();
  return {
    ...original,
    getSessionUser: async () => session.current,
    requireUser: async () => {
      if (!session.current) throw new original.UnauthorizedError();
      return session.current;
    },
  };
});

const clientsRoute = await import("@/app/api/clients/route");
const clientRoute = await import("@/app/api/clients/[id]/route");
const briefingsRoute = await import("@/app/api/briefings/route");
const briefingRoute = await import("@/app/api/briefings/[id]/route");
const reprocessRoute = await import("@/app/api/briefings/[id]/reprocess/route");
const pdfRoute = await import("@/app/api/briefings/[id]/pdf/route");
const publicRoute = await import("@/app/api/public/briefing/[token]/route");
const answersRoute = await import("@/app/api/public/briefing/[token]/answers/route");
const submitRoute = await import("@/app/api/public/briefing/[token]/submit/route");

const ORIGIN = "http://localhost:3000";
const SUFFIX = `api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

let alice: SessionUser;
let bob: SessionUser;
let bobClientId: string;
let bobBriefingId: string;

/** A different IP per request: tests must not hit the rate limit. */
function ip() {
  return `203.0.113.${Math.floor(Math.random() * 250)}-${Math.random()}`;
}

function req(method: string, path: string, init: { body?: unknown; rawBody?: string; origin?: string | null } = {}) {
  const headers = new Headers({ "x-forwarded-for": ip() });
  if (init.origin !== null) headers.set("origin", init.origin ?? ORIGIN);
  let body: string | undefined;
  if (init.rawBody !== undefined) body = init.rawBody;
  else if (init.body !== undefined) body = JSON.stringify(init.body);
  if (body) headers.set("content-type", "application/json");
  return new Request(`${ORIGIN}${path}`, { method, headers, body });
}

const params = <T extends Record<string, string>>(value: T) => ({ params: Promise.resolve(value) });

beforeAll(async () => {
  // Each one administers their own organization, as the session would load it.
  const make = async (who: string): Promise<SessionUser> => {
    const organization = await prisma.organization.create({ data: { name: `Org ${who} ${SUFFIX}` } });
    const user = await prisma.user.create({
      data: {
        supabaseAuthId: `auth-${who}-${SUFFIX}`,
        name: who,
        email: `${who}-${SUFFIX}@exemplo.test`,
        memberships: { create: { organizationId: organization.id, role: "admin" } },
      },
      select: { id: true, name: true, email: true },
    });
    return { ...user, organizationId: organization.id, role: "admin" };
  };
  alice = await make("alice");
  bob = await make("bob");

  const bobClient = await prisma.client.create({
    data: { userId: bob.id, name: "Cliente do Bob", contactEmail: `c-${SUFFIX}@exemplo.test` },
  });
  bobClientId = bobClient.id;
  bobBriefingId = (await createBriefing(bobClientId)).id;
});

beforeEach(() => {
  session.current = null;
});

afterAll(async () => {
  const userIds = [alice?.id, bob?.id].filter(Boolean);
  const organizationIds = [alice?.organizationId, bob?.organizationId].filter(Boolean);
  await prisma.membership.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.organization.deleteMany({ where: { id: { in: organizationIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("authenticated routes without a session → 401", () => {
  it.each([
    ["GET /api/clients", () => clientsRoute.GET()],
    ["POST /api/clients", () => clientsRoute.POST(req("POST", "/api/clients", { body: {} }))],
    ["GET /api/clients/[id]", () => clientRoute.GET(req("GET", "/x"), params({ id: "x" }))],
    ["POST /api/briefings", () => briefingsRoute.POST(req("POST", "/api/briefings", { body: {} }))],
    ["GET /api/briefings/[id]", () => briefingRoute.GET(req("GET", "/x"), params({ id: "x" }))],
    ["POST reprocess", () => reprocessRoute.POST(req("POST", "/x"), params({ id: "x" }))],
    ["GET pdf", () => pdfRoute.GET(req("GET", "/x", { origin: null }), params({ id: "x" }))],
  ])("%s", async (_label, call) => {
    expect((await call()).status).toBe(401);
  });
});

describe("other origin → 403 (SEC-03)", () => {
  it("rejects creating a client from another site, even with a session", async () => {
    session.current = alice;
    const res = await clientsRoute.POST(
      req("POST", "/api/clients", {
        origin: "https://site-malicioso.com",
        body: { name: "X", contactEmail: "x@exemplo.test" },
      }),
    );
    expect(res.status).toBe(403);
    expect(await prisma.client.count({ where: { userId: alice.id } })).toBe(0);
  });
});

describe("isolation between accounts → 404, no side effects", () => {
  beforeEach(() => {
    session.current = alice;
  });

  it("doesn't read another account's client", async () => {
    const res = await clientRoute.GET(req("GET", "/x"), params({ id: bobClientId }));
    expect(res.status).toBe(404);
  });

  it("doesn't edit or delete another account's client", async () => {
    const patch = await clientRoute.PATCH(req("PATCH", "/x", { body: { name: "Invadido" } }), params({ id: bobClientId }));
    const del = await clientRoute.DELETE(req("DELETE", "/x"), params({ id: bobClientId }));
    expect([patch.status, del.status]).toEqual([404, 404]);
    const still = await prisma.client.findUniqueOrThrow({ where: { id: bobClientId } });
    expect(still.name).toBe("Cliente do Bob");
  });

  it("doesn't create a briefing for another account's client", async () => {
    const res = await briefingsRoute.POST(req("POST", "/api/briefings", { body: { clientId: bobClientId } }));
    expect(res.status).toBe(404);
  });

  it("doesn't read, reprocess or export another account's briefing", async () => {
    const get = await briefingRoute.GET(req("GET", "/x"), params({ id: bobBriefingId }));
    const reprocess = await reprocessRoute.POST(req("POST", "/x"), params({ id: bobBriefingId }));
    const pdf = await pdfRoute.GET(req("GET", "/x", { origin: null }), params({ id: bobBriefingId }));
    expect([get.status, reprocess.status, pdf.status]).toEqual([404, 404, 404]);
  });
});

describe("input validation", () => {
  it("malformed JSON → 400 (NEW-01)", async () => {
    session.current = alice;
    const res = await clientsRoute.POST(req("POST", "/api/clients", { rawBody: "{quebrado" }));
    expect(res.status).toBe(400);
  });

  it("invalid data → 400 with issues", async () => {
    session.current = alice;
    const res = await clientsRoute.POST(req("POST", "/api/clients", { body: { name: "", contactEmail: "nao-e-email" } }));
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).issues)).toEqual(expect.arrayContaining(["name", "contactEmail"]));
  });

  it("happy path: creates a client and a briefing with an absolute link", async () => {
    session.current = alice;
    const created = await clientsRoute.POST(
      req("POST", "/api/clients", { body: { name: "Cliente da Alice", contactEmail: "alice-cliente@exemplo.test" } }),
    );
    expect(created.status).toBe(201);
    const { client } = await created.json();

    const res = await briefingsRoute.POST(req("POST", "/api/briefings", { body: { clientId: client.id } }));
    expect(res.status).toBe(201);
    const { url } = await res.json();
    expect(url).toMatch(/^https?:\/\/[^/]+\/briefing\/[A-Za-z0-9]{24}$/);
  });
});

describe("public routes", () => {
  it("unknown token → 404", async () => {
    const res = await publicRoute.GET(req("GET", "/x"), params({ token: "nao-existe" }));
    expect(res.status).toBe(404);
  });

  it("public payload doesn't expose internal data (FORM-14)", async () => {
    const { token } = await createBriefing(bobClientId);
    const res = await publicRoute.GET(req("GET", "/x"), params({ token }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain(bobClientId);
    expect(text).not.toContain("@exemplo.test");
    expect(JSON.parse(text).briefing).not.toHaveProperty("id");
  });

  it("invalid answer → 400 pointing at the question", async () => {
    const { token } = await createBriefing(bobClientId);
    const res = await answersRoute.PUT(
      req("PUT", "/x", { body: { answers: [{ questionKey: Q.BUSINESS_TYPE, value: "inventado" }] } }),
      params({ token }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).issues).toHaveProperty(Q.BUSINESS_TYPE);
  });

  it("after submission: autosave → 410 and resubmission is idempotent", async () => {
    const briefing = await createBriefing(bobClientId);
    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_NAME, value: "Doce Vida" },
      { questionKey: Q.BUSINESS_DESCRIPTION, value: "Faço bolos" },
      { questionKey: Q.BUSINESS_TYPE, value: "local_business" },
      { questionKey: Q.BUSINESS_AGE, value: "1_a_3_anos" },
      { questionKey: Q.PRODUCTS_SERVICES, value: "Bolos e doces" },
      { questionKey: Q.DIFFERENTIATOR, value: "Qualidade" },
      { questionKey: Q.MARKETING_REASON, value: "As vendas caíram" },
      { questionKey: Q.SUCCESS_6_MONTHS, value: "Quero crescer" },
      { questionKey: Q.CLOSEST_GOAL, value: "vendas" },
      { questionKey: Q.MAIN_PAIN, value: "Ninguém me acha" },
      { questionKey: Q.IDEAL_CLIENT, value: "Todo mundo" },
      { questionKey: Q.AUDIENCE_PAIN, value: "Querem doce bom" },
      { questionKey: Q.CURRENT_PERCEPTION, value: "Simples" },
      { questionKey: Q.DESIRED_PERCEPTION, value: "Sofisticada" },
      { questionKey: Q.MAIN_OFFER, value: "Bolo de festa" },
    ]);
    expect((await submitBriefing(briefing.id)).ok).toBe(true);

    const save = await answersRoute.PUT(
      req("PUT", "/x", { body: { answers: [{ questionKey: Q.IDEAL_CLIENT, value: "Outro" }] } }),
      params({ token: briefing.token }),
    );
    expect(save.status).toBe(410);

    const again = await submitRoute.POST(req("POST", "/x"), params({ token: briefing.token }));
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ submitted: true, alreadySubmitted: true });
  });
});
