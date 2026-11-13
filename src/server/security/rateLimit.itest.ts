import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../db";
import { consumeRateLimit, rateLimitKey } from "./rateLimit";

/** Rate limiting contra o Postgres real: contagem atômica e virada de janela. */

const identifier = `itest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const policy = { limit: 3, windowMs: 60_000 };

afterAll(async () => {
  await prisma.rateLimitBucket.deleteMany({
    where: { key: { in: [rateLimitKey("itest", identifier), rateLimitKey("itest-par", identifier)] } },
  });
  await prisma.$disconnect();
});

describe("consumeRateLimit (SEC-04)", () => {
  it("permite até o limite e bloqueia a partir daí, com Retry-After", async () => {
    const now = new Date("2026-11-12T10:00:10.000Z");
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await consumeRateLimit("itest", identifier, policy, now));
    }
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSeconds).toBe(50);
  });

  it("zera a contagem quando a janela vira", async () => {
    const next = new Date("2026-11-12T10:01:05.000Z");
    const result = await consumeRateLimit("itest", identifier, policy, next);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("conta corretamente sob concorrência", async () => {
    const now = new Date("2026-11-12T11:00:00.000Z");
    const results = await Promise.all(
      Array.from({ length: 10 }, () => consumeRateLimit("itest-par", identifier, policy, now)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
  });
});
