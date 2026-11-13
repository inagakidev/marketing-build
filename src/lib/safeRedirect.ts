/**
 * Safe destination for the post-login redirect (SEC-02).
 *
 * The value comes from the query string (`/login?redirect=...`), so whoever
 * builds the link controls it. Accepting anything would turn the login screen
 * into an open redirect: a legitimate link on our domain leading to a fake
 * site.
 *
 * Used on the server and in the browser — that's why it lives in `src/lib`
 * and is pure.
 */

export const DEFAULT_REDIRECT = "/admin";

/** Dummy base: only lets `URL` resolve the path and reveal the origin. */
const PROBE_ORIGIN = "http://interno.invalid";

export function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_REDIRECT;

  // Only internal absolute paths. Browsers read `//x` and `/\x` as
  // "another host", and a control character can be dropped mid-path, turning
  // `/\t/x` into `//x`.
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_REDIRECT;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return DEFAULT_REDIRECT;

  let url: URL;
  try {
    url = new URL(value, PROBE_ORIGIN);
  } catch {
    return DEFAULT_REDIRECT;
  }
  if (url.origin !== PROBE_ORIGIN) return DEFAULT_REDIRECT;

  // Going back to the login itself would create an endless loop.
  if (url.pathname === "/login") return DEFAULT_REDIRECT;

  return `${url.pathname}${url.search}${url.hash}`;
}
