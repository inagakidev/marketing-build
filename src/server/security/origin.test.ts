import { describe, expect, it } from "vitest";
import { isTrustedRequestOrigin } from "./origin";

const allowed = ["https://app.exemplo.com"];

describe("isTrustedRequestOrigin (SEC-03)", () => {
  it("aceita a própria origem", () => {
    expect(
      isTrustedRequestOrigin({ origin: "https://app.exemplo.com", secFetchSite: "same-origin", allowedOrigins: allowed }),
    ).toBe(true);
  });

  it("recusa outra origem, mesmo que o Sec-Fetch-Site seja omitido", () => {
    expect(
      isTrustedRequestOrigin({ origin: "https://site-malicioso.com", secFetchSite: null, allowedOrigins: allowed }),
    ).toBe(false);
  });

  it("recusa subdomínio irmão (same-site, mas não same-origin)", () => {
    expect(
      isTrustedRequestOrigin({ origin: "https://outro.exemplo.com", secFetchSite: "same-site", allowedOrigins: allowed }),
    ).toBe(false);
  });

  it("recusa Origin nulo (iframe sandbox, redirecionamentos)", () => {
    expect(
      isTrustedRequestOrigin({ origin: "null", secFetchSite: "cross-site", allowedOrigins: allowed }),
    ).toBe(false);
  });

  it("sem Origin, decide pelo Sec-Fetch-Site", () => {
    expect(isTrustedRequestOrigin({ origin: null, secFetchSite: "same-origin", allowedOrigins: allowed })).toBe(true);
    expect(isTrustedRequestOrigin({ origin: null, secFetchSite: "none", allowedOrigins: allowed })).toBe(true);
    expect(isTrustedRequestOrigin({ origin: null, secFetchSite: "cross-site", allowedOrigins: allowed })).toBe(false);
    expect(isTrustedRequestOrigin({ origin: null, secFetchSite: "same-site", allowedOrigins: allowed })).toBe(false);
  });

  it("sem nenhum dos dois cabeçalhos (cliente fora do navegador), aceita", () => {
    // CSRF depende de um navegador enviando os cookies da vítima; um cliente
    // sem esses cabeçalhos não é esse cenário, e a sessão continua obrigatória.
    expect(isTrustedRequestOrigin({ origin: null, secFetchSite: null, allowedOrigins: allowed })).toBe(true);
  });
});
