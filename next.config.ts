import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança (SEC-05, SEC-06).
 *
 * A CSP aqui cobre só as diretivas que não dependem de nonce (framing, base,
 * form, plugins). Restringir `script-src` exige nonce por requisição no proxy
 * e renderização dinâmica de todas as páginas — fica registrado como evolução
 * em docs/PHASE-0-AUDIT.md.
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
  // `@sparticuz/chromium` é externo por padrão no Next, mas o rastreamento de
  // arquivos não enxerga os binários compactados que ele carrega em runtime.
  // Sem isso, a função do PDF sobe na Vercel sem o Chromium (DEPLOY-01).
  outputFileTracingIncludes: {
    "/api/briefings/*/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
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
