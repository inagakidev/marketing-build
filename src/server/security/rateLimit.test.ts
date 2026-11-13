import { describe, expect, it } from "vitest";
import { clientIp, rateLimitKey, retryAfterSeconds, windowStartFor } from "./rateLimitRules";

describe("rate limiting — pure rules (SEC-04)", () => {
  it("aligns the window to a multiple of its size", () => {
    const now = new Date("2026-11-12T10:00:42.500Z");
    expect(windowStartFor(now, 60_000).toISOString()).toBe("2026-11-12T10:00:00.000Z");
  });

  it("computes Retry-After until the end of the window, never under 1s", () => {
    const start = new Date("2026-11-12T10:00:00.000Z");
    expect(retryAfterSeconds(new Date("2026-11-12T10:00:42.500Z"), start, 60_000)).toBe(18);
    expect(retryAfterSeconds(new Date("2026-11-12T10:00:59.999Z"), start, 60_000)).toBe(1);
  });

  it("uses the first IP in X-Forwarded-For", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to X-Real-IP and then to 'unknown'", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("doesn't store the identifier in clear and separates by scope", () => {
    const a = rateLimitKey("publicSubmit", "203.0.113.7");
    const b = rateLimitKey("publicRead", "203.0.113.7");
    expect(a).not.toContain("203.0.113.7");
    expect(a.startsWith("publicSubmit:")).toBe(true);
    expect(a).not.toBe(b);
    expect(rateLimitKey("publicSubmit", "203.0.113.7")).toBe(a);
  });
});
