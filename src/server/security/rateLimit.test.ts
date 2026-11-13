import { describe, expect, it } from "vitest";
import { clientIp, rateLimitKey, retryAfterSeconds, windowStartFor } from "./rateLimitRules";

describe("rate limiting — regras puras (SEC-04)", () => {
  it("alinha a janela ao múltiplo do tamanho", () => {
    const now = new Date("2026-11-12T10:00:42.500Z");
    expect(windowStartFor(now, 60_000).toISOString()).toBe("2026-11-12T10:00:00.000Z");
  });

  it("calcula o Retry-After até o fim da janela, nunca menos de 1s", () => {
    const start = new Date("2026-11-12T10:00:00.000Z");
    expect(retryAfterSeconds(new Date("2026-11-12T10:00:42.500Z"), start, 60_000)).toBe(18);
    expect(retryAfterSeconds(new Date("2026-11-12T10:00:59.999Z"), start, 60_000)).toBe(1);
  });

  it("usa o primeiro IP do X-Forwarded-For", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("cai para X-Real-IP e depois para 'unknown'", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("não guarda o identificador em claro e separa por escopo", () => {
    const a = rateLimitKey("publicSubmit", "203.0.113.7");
    const b = rateLimitKey("publicRead", "203.0.113.7");
    expect(a).not.toContain("203.0.113.7");
    expect(a.startsWith("publicSubmit:")).toBe(true);
    expect(a).not.toBe(b);
    expect(rateLimitKey("publicSubmit", "203.0.113.7")).toBe(a);
  });
});
