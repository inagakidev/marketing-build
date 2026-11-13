/**
 * Who can enter the panel (SEC-01, decision D3).
 *
 * Interim policy until Phase 1 invitations: only people who already have a
 * record in the `users` table, created by `npm run db:seed:admin` or an
 * equivalent admin action. An account that exists only in Supabase — e.g.
 * created through its public sign-up — is rejected. The system never creates
 * a user from a login.
 */

/** `supabaseAuthId` marker of a local record that has no login account yet. */
export const PENDING_AUTH_PREFIX = "pending:";

export interface AuthIdentity {
  id: string;
  email: string;
  emailConfirmed: boolean;
}

export interface LocalUserRef {
  id: string;
  supabaseAuthId: string;
}

export type ProvisioningDecision =
  | { action: "use"; userId: string }
  | { action: "link"; userId: string }
  | { action: "deny" };

export function decideProvisioning({
  authUser,
  byAuthId,
  byEmail,
}: {
  authUser: AuthIdentity;
  byAuthId: LocalUserRef | null;
  byEmail: LocalUserRef | null;
}): ProvisioningDecision {
  if (byAuthId) return { action: "use", userId: byAuthId.id };

  // Pre-registered record created without Supabase: linked on first login, as
  // long as the email is confirmed (proof of ownership) and the record doesn't
  // already belong to another auth account.
  if (
    byEmail &&
    authUser.emailConfirmed &&
    byEmail.supabaseAuthId.startsWith(PENDING_AUTH_PREFIX)
  ) {
    return { action: "link", userId: byEmail.id };
  }

  return { action: "deny" };
}
