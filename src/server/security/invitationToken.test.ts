import { describe, expect, it } from "vitest";
import { generateInvitationToken, hashInvitationToken } from "./invitationToken";

describe("invitation tokens (D12, NFR-03)", () => {
  it("are opaque, URL-safe and carry at least 120 bits", () => {
    const { token } = generateInvitationToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    // base64url: 6 bits per character.
    expect(token.length * 6).toBeGreaterThanOrEqual(120);
  });

  it("never repeat", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateInvitationToken().token));
    expect(tokens.size).toBe(200);
  });

  it("store only a hash, which is stable and differs from the token", () => {
    const { token, tokenHash } = generateInvitationToken();
    expect(tokenHash).not.toContain(token);
    expect(hashInvitationToken(token)).toBe(tokenHash);
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
