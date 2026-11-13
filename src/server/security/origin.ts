import { serverEnv } from "../env";

/**
 * CSRF protection for authenticated mutations (SEC-03).
 *
 * Supabase cookies are already `SameSite=Lax`, which blocks cross-site POST.
 * The origin check closes what's left: sibling subdomains (same-site but not
 * same-origin) and the dependence on a cookie configuration detail.
 */

export interface OriginCheckInput {
  origin: string | null;
  secFetchSite: string | null;
  allowedOrigins: string[];
}

export function isTrustedRequestOrigin({
  origin,
  secFetchSite,
  allowedOrigins,
}: OriginCheckInput): boolean {
  if (origin) {
    // "null" is sent by sandboxed iframes and some redirects: not a trusted
    // origin.
    return allowedOrigins.includes(origin);
  }

  if (secFetchSite) {
    // "none" = a direct user action (address bar, bookmark).
    return secFetchSite === "same-origin" || secFetchSite === "none";
  }

  // Neither header: not a modern browser sending a victim's cookies. The
  // route still requires a session.
  return true;
}

/** Accepted origins: the request's own and the configured public URL. */
export function allowedOriginsFor(request: Request): string[] {
  const origins = new Set<string>([new URL(request.url).origin]);
  // Already validated as an http(s) URL in `serverEnv` (NEW-03).
  origins.add(new URL(serverEnv().appUrl).origin);
  return [...origins];
}

export class ForbiddenOriginError extends Error {
  constructor() {
    super("Request origin not allowed");
    this.name = "ForbiddenOriginError";
  }
}

/** Throws `ForbiddenOriginError` when the request comes from another origin. */
export function assertSameOrigin(request: Request): void {
  const trusted = isTrustedRequestOrigin({
    origin: request.headers.get("origin"),
    secFetchSite: request.headers.get("sec-fetch-site"),
    allowedOrigins: allowedOriginsFor(request),
  });
  if (!trusted) throw new ForbiddenOriginError();
}
