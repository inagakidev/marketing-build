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
  it("em desenvolvimento, só DATABASE_URL é obrigatória e há padrões", () => {
    const result = parseServerEnv(base, "development");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.env.appUrl).toBe("http://localhost:3000");
      expect(result.env.briefingLinkTtlDays).toBe(30);
    }
  });

  it("sem DATABASE_URL, falha com mensagem que nomeia a variável", () => {
    const result = parseServerEnv({}, "development");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/DATABASE_URL/);
  });

  it("em produção, exige URL pública e Supabase", () => {
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

  it("em produção, DEV_ADMIN_EMAIL gera aviso (o bypass já é inerte fora de development)", () => {
    const result = parseServerEnv({ ...prod, DEV_ADMIN_EMAIL: "a@b.com" }, "production");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnings.join(" ")).toMatch(/DEV_ADMIN_EMAIL/);
  });

  it("recusa URL pública inválida e prazo fora do intervalo", () => {
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

  it("normaliza a URL pública sem barra final", () => {
    const result = parseServerEnv({ ...base, NEXT_PUBLIC_APP_URL: "https://app.exemplo.com/" }, "development");
    expect(result.ok && result.env.appUrl).toBe("https://app.exemplo.com");
  });

  it("a mensagem de erro nunca repete o valor da variável", () => {
    const result = parseServerEnv({ DATABASE_URL: "nao-e-url-segredo123" }, "development");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).not.toContain("segredo123");
  });
});
