import { describe, expect, it } from "vitest";
import { invitationExpiry, invitationState, normalizeEmail, INVITATION_TTL_DAYS } from "./invitation";

const now = new Date("2026-11-13T12:00:00.000Z");
const later = new Date("2026-11-20T12:00:00.000Z");
const base = { acceptedAt: null, revokedAt: null, expiresAt: later };

describe("invitationState (D12)", () => {
  it("is pending until accepted, revoked or expired", () => {
    expect(invitationState(base, now)).toBe("pending");
  });

  it("is accepted once used, even after it would have expired", () => {
    expect(invitationState({ ...base, acceptedAt: now }, later)).toBe("accepted");
  });

  it("is revoked when an administrator revoked it", () => {
    expect(invitationState({ ...base, revokedAt: now }, now)).toBe("revoked");
  });

  it("is expired from the expiry instant on", () => {
    expect(invitationState(base, later)).toBe("expired");
  });
});

describe("invitationExpiry", () => {
  it(`is ${INVITATION_TTL_DAYS} days after creation`, () => {
    expect(INVITATION_TTL_DAYS).toBe(7);
    expect(invitationExpiry(now)).toEqual(later);
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases, matching how login compares emails", () => {
    expect(normalizeEmail("  Ana.Silva@Exemplo.COM ")).toBe("ana.silva@exemplo.com");
  });
});
