import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

const base = { DATABASE_URL: "postgresql://u:p@localhost:5432/db" };
const prod = {
  ...base,
  NEXT_PUBLIC_APP_URL: "https://app.exemplo.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
};

describe("parseServerEnv (NEW-03)", () => {
  it("in development, only DATABASE_URL is required and there are defaults", () => {
    const result = parseServerEnv(base, "development");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.env.appUrl).toBe("http://localhost:3000");
      expect(result.env.briefingLinkTtlDays).toBe(30);
    }
  });

  it("without DATABASE_URL, fails with a message naming the variable", () => {
    const result = parseServerEnv({}, "development");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/DATABASE_URL/);
  });

  it("in production, requires the public URL and Supabase", () => {
    const result = parseServerEnv(base, "production");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const all = result.errors.join(" ");
      expect(all).toMatch(/NEXT_PUBLIC_APP_URL/);
      expect(all).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
      expect(all).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    }
    expect(parseServerEnv(prod, "production").ok).toBe(true);
  });

  it("in production, DEV_ADMIN_EMAIL produces a warning (the bypass is already inert outside development)", () => {
    const result = parseServerEnv({ ...prod, DEV_ADMIN_EMAIL: "a@b.com" }, "production");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnings.join(" ")).toMatch(/DEV_ADMIN_EMAIL/);
  });

  it("in production, a missing service role key is a warning, not an error (EP-04.4)", () => {
    // Only accepting invitations needs it; refusing to start would take the
    // whole panel down for one flow.
    const without = parseServerEnv(prod, "production");
    expect(without.ok).toBe(true);
    if (without.ok) {
      expect(without.env.supabaseAdminConfigured).toBe(false);
      expect(without.warnings.join(" ")).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    }

    const withKey = parseServerEnv({ ...prod, SUPABASE_SERVICE_ROLE_KEY: "service" }, "production");
    expect(withKey.ok && withKey.env.supabaseAdminConfigured).toBe(true);
    expect(withKey.ok && withKey.warnings).toEqual([]);
  });

  it("rejects an invalid public URL and an out-of-range TTL", () => {
    const result = parseServerEnv(
      { ...base, NEXT_PUBLIC_APP_URL: "localhost:3000", BRIEFING_LINK_TTL_DAYS: "0" },
      "development",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/NEXT_PUBLIC_APP_URL/);
      expect(result.errors.join(" ")).toMatch(/BRIEFING_LINK_TTL_DAYS/);
    }
  });

  it("normalizes the public URL without a trailing slash", () => {
    const result = parseServerEnv({ ...base, NEXT_PUBLIC_APP_URL: "https://app.exemplo.com/" }, "development");
    expect(result.ok && result.env.appUrl).toBe("https://app.exemplo.com");
  });

  it("the error message never echoes the variable's value", () => {
    const result = parseServerEnv({ DATABASE_URL: "nao-e-url-segredo123" }, "development");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).not.toContain("segredo123");
  });
});
