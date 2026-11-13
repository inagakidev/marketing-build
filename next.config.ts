import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança (SEC-05, SEC-06).
 *
 * A CSP aqui cobre só as diretivas que não dependem de nonce (framing, base,
 * form, plugins). Restringir `script-src` exige nonce por requisição no proxy
 * e renderização dinâmica de todas as páginas — fica registrado como evolução
 * em docs/05-auditoria-fase-0.md.
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
  // Ignorado pelos navegadores em HTTP; em produção (HTTPS) evita downgrade.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const noIndex = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" };

/**
 * Superfícies que carregam o token do link na URL: nada de Referer para
 * terceiros. O token é a credencial do respondente.
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
  async headers() {
    return [
      { source: "/:path*", headers: baseSecurityHeaders },
      // Cada rota privada é declarada explicitamente: a regra mais específica,
      // por vir depois, sobrescreve a de cima (docs do Next: Header Overriding).
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
