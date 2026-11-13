import type { NextConfig } from "next";

/**
 * Security headers (SEC-05, SEC-06).
 *
 * The CSP here covers only the directives that don't need a nonce (framing,
 * base, form, plugins). Restricting `script-src` requires a per-request nonce
 * in the proxy and dynamic rendering of every page — recorded as a future
 * improvement in docs/PHASE-0-AUDIT.md.
 */
const baseSecurityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Ignored by browsers over HTTP; in production (HTTPS) it prevents downgrades.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const noIndex = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" };

/**
 * Surfaces that carry the link token in the URL: no Referer to third parties.
 * The token is the respondent's credential.
 */
const tokenSurfaceHeaders = [
  noIndex,
  { key: "Referrer-Policy", value: "no-referrer" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  poweredByHeader: false,
  // `@sparticuz/chromium` is external by default in Next, but file tracing
  // doesn't see the compressed binaries it loads at runtime. Without this, the
  // PDF function ships to Vercel without Chromium (DEPLOY-01).
  outputFileTracingIncludes: {
    "/api/briefings/*/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: baseSecurityHeaders },
      // Each private route is declared explicitly: the more specific rule, coming
      // later, overrides the one above (Next docs: Header Overriding).
      { source: "/admin/:path*", headers: [noIndex] },
      { source: "/login", headers: [noIndex] },
      { source: "/print/:path*", headers: [noIndex] },
      { source: "/api/:path*", headers: [noIndex] },
      { source: "/briefing/:path*", headers: tokenSurfaceHeaders },
      { source: "/api/public/:path*", headers: tokenSurfaceHeaders },
    ];
  },
};

export default nextConfig;
