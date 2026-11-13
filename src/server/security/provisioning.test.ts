import { describe, expect, it } from "vitest";
import { decideProvisioning, PENDING_AUTH_PREFIX } from "./provisioning";

const authUser = { id: "auth-1", email: "ana@exemplo.com", emailConfirmed: true };

describe("decideProvisioning (SEC-01 / D3)", () => {
  it("uses the user already linked to the auth account", () => {
    const linked = { id: "u1", supabaseAuthId: "auth-1" };
    expect(decideProvisioning({ authUser, byAuthId: linked, byEmail: null })).toEqual({
      action: "use",
      userId: "u1",
    });
  });

  it("rejects an authenticated account without a prior record — never creates a user", () => {
    expect(decideProvisioning({ authUser, byAuthId: null, byEmail: null })).toEqual({
      action: "deny",
    });
  });

  it("links a pending prior record with the same confirmed email", () => {
    const pending = { id: "u2", supabaseAuthId: `${PENDING_AUTH_PREFIX}ana@exemplo.com` };
    expect(decideProvisioning({ authUser, byAuthId: null, byEmail: pending })).toEqual({
      action: "link",
      userId: "u2",
    });
  });

  it("doesn't link if the email isn't confirmed", () => {
    const pending = { id: "u2", supabaseAuthId: `${PENDING_AUTH_PREFIX}ana@exemplo.com` };
    expect(
      decideProvisioning({ authUser: { ...authUser, emailConfirmed: false }, byAuthId: null, byEmail: pending }),
    ).toEqual({ action: "deny" });
  });

  it("doesn't hijack a user already linked to another auth account", () => {
    const other = { id: "u3", supabaseAuthId: "auth-outra" };
    expect(decideProvisioning({ authUser, byAuthId: null, byEmail: other })).toEqual({
      action: "deny",
    });
  });
});
