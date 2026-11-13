import { describe, expect, it } from "vitest";
import { isTrustedRequestOrigin } from "./origin";

const allowed = ["https://app.exemplo.com"];

describe("isTrustedRequestOrigin (SEC-03)", () => {
  it("accepts its own origin", () => {
    expect(
      isTrustedRequestOrigin({ origin: "https://app.exemplo.com", secFetchSite: "same-origin", allowedOrigins: allowed }),
    ).toBe(true);
  });

  it("rejects another origin, even if Sec-Fetch-Site is omitted", () => {
    expect(
      isTrustedRequestOrigin({ origin: "https://site-malicioso.com", secFetchSite: null, allowedOrigins: allowed }),
    ).toBe(false);
  });

  it("rejects a sibling subdomain (same-site but not same-origin)", () => {
    expect(
      isTrustedRequestOrigin({ origin: "https://outro.exemplo.com", secFetchSite: "same-site", allowedOrigins: allowed }),
    ).toBe(false);
  });

  it("rejects a null Origin (sandboxed iframe, redirects)", () => {
    expect(
      isTrustedRequestOrigin({ origin: "null", secFetchSite: "cross-site", allowedOrigins: allowed }),
    ).toBe(false);
  });

  it("without Origin, decides by Sec-Fetch-Site", () => {
    expect(isTrustedRequestOrigin({ origin: null, secFetchSite: "same-origin", allowedOrigins: allowed })).toBe(true);
    expect(isTrustedRequestOrigin({ origin: null, secFetchSite: "none", allowedOrigins: allowed })).toBe(true);
    expect(isTrustedRequestOrigin({ origin: null, secFetchSite: "cross-site", allowedOrigins: allowed })).toBe(false);
    expect(isTrustedRequestOrigin({ origin: null, secFetchSite: "same-site", allowedOrigins: allowed })).toBe(false);
  });

  it("with neither header (non-browser client), accepts", () => {
    // CSRF depends on a browser sending the victim's cookies; a client without
    // these headers isn't that scenario, and a session is still required.
    expect(isTrustedRequestOrigin({ origin: null, secFetchSite: null, allowedOrigins: allowed })).toBe(true);
  });
});
