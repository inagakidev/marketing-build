import type { MetadataRoute } from "next";

/**
 * Nothing in the product should be indexed: the panel is internal and the
 * public form only makes sense with the token, which is a credential (SEC-05).
 *
 * `robots.txt` is a request, not a protection — private routes also send
 * `X-Robots-Tag: noindex` (next.config.ts) and require a session or token.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/$",
      disallow: ["/admin", "/briefing", "/print", "/login", "/api"],
    },
  };
}
