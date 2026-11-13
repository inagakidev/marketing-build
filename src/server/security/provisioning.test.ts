import { describe, expect, it } from "vitest";
import { decideProvisioning, PENDING_AUTH_PREFIX } from "./provisioning";

const authUser = { id: "auth-1", email: "ana@exemplo.com", emailConfirmed: true };

describe("decideProvisioning (SEC-01 / D3)", () => {
  it("usa o usuário já vinculado à conta de autenticação", () => {
    const linked = { id: "u1", supabaseAuthId: "auth-1" };
    expect(decideProvisioning({ authUser, byAuthId: linked, byEmail: null })).toEqual({
      action: "use",
      userId: "u1",
    });
  });

  it("recusa conta autenticada sem cadastro prévio — nunca cria usuário", () => {
    expect(decideProvisioning({ authUser, byAuthId: null, byEmail: null })).toEqual({
      action: "deny",
    });
  });

  it("vincula cadastro prévio pendente com o mesmo e-mail confirmado", () => {
    const pending = { id: "u2", supabaseAuthId: `${PENDING_AUTH_PREFIX}ana@exemplo.com` };
    expect(decideProvisioning({ authUser, byAuthId: null, byEmail: pending })).toEqual({
      action: "link",
      userId: "u2",
    });
  });

  it("não vincula se o e-mail não foi confirmado", () => {
    const pending = { id: "u2", supabaseAuthId: `${PENDING_AUTH_PREFIX}ana@exemplo.com` };
    expect(
      decideProvisioning({ authUser: { ...authUser, emailConfirmed: false }, byAuthId: null, byEmail: pending }),
    ).toEqual({ action: "deny" });
  });

  it("não sequestra usuário já vinculado a outra conta de autenticação", () => {
    const other = { id: "u3", supabaseAuthId: "auth-outra" };
    expect(decideProvisioning({ authUser, byAuthId: null, byEmail: other })).toEqual({
      action: "deny",
    });
  });
});
