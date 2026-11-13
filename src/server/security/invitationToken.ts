import { createHash, randomBytes } from "node:crypto";

/**
 * Invitation link tokens (D12).
 *
 * 32 random bytes (256 bits, above NFR-03's 120), base64url so the token fits
 * a URL as is. Only the SHA-256 goes to the database: holding the link is the
 * authorization, so a leaked table must not hand out usable links. A plain
 * hash is enough — the token is random, so there's nothing to brute-force.
 */
export function generateInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
