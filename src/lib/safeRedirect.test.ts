import { describe, expect, it } from "vitest";
import { DEFAULT_REDIRECT, safeRedirectPath } from "./safeRedirect";

describe("safeRedirectPath (SEC-02)", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/clientes/abc", "/admin/clientes/abc"],
    ["/admin/briefings/1?aba=diagnostico#topo", "/admin/briefings/1?aba=diagnostico#topo"],
  ])("aceita caminho interno %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    ["URL absoluta", "https://site-malicioso.com"],
    ["protocolo relativo", "//site-malicioso.com"],
    ["barra invertida", "/\\site-malicioso.com"],
    ["barra invertida no início", "\\\\site-malicioso.com"],
    ["javascript:", "javascript:alert(1)"],
    ["sem barra inicial", "admin"],
    ["vazio", ""],
    ["caractere de controle", "/\t/site-malicioso.com"],
    ["espaço inicial", " //site-malicioso.com"],
  ])("recusa %s", (_label, input) => {
    expect(safeRedirectPath(input)).toBe(DEFAULT_REDIRECT);
  });

  it("recusa valores que não são string", () => {
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath(["/admin", "//x.com"])).toBe(DEFAULT_REDIRECT);
  });

  it("não deixa voltar para a própria tela de login", () => {
    expect(safeRedirectPath("/login?redirect=/admin")).toBe(DEFAULT_REDIRECT);
  });
});
