import { serverEnv } from "@/server/env";
import { createSupabaseAdminClient } from "@/server/supabase";
import { PENDING_AUTH_PREFIX } from "@/server/security/provisioning";
import {
  AuthAccountExistsError,
  AuthUnavailableError,
  WeakPasswordError,
  type AuthAccounts,
} from "../application/invitations";

/**
 * Login accounts in Supabase Auth, created server-side with the service role
 * key when an invitation is accepted (D12). Public sign-up stays off
 * (AUTH-02): this is the only way in besides `db:seed:admin`.
 *
 * Without Supabase (development only), it behaves like the seed: a local
 * record marked as pending, linked on the first real login.
 */
export function supabaseAuthAccounts(): AuthAccounts {
  const env = serverEnv();

  if (!env.supabaseConfigured && process.env.NODE_ENV !== "production") {
    return {
      async create({ email }) {
        return { authId: `${PENDING_AUTH_PREFIX}${email}` };
      },
      async remove() {},
    };
  }

  return {
    async create({ email, password, name }) {
      if (!env.supabaseAdminConfigured) throw new AuthUnavailableError();

      const { data, error } = await createSupabaseAdminClient().auth.admin.createUser({
        email,
        password,
        // Holding the link the administrator sent is the proof of the email
        // (D12); there's no second confirmation email to wait for.
        email_confirm: true,
        user_metadata: { name },
      });
      if (error) {
        if (error.code === "email_exists" || error.code === "user_already_exists") {
          throw new AuthAccountExistsError();
        }
        if (error.code === "weak_password") throw new WeakPasswordError();
        throw error;
      }
      return { authId: data.user.id };
    },

    async remove(authId) {
      if (authId.startsWith(PENDING_AUTH_PREFIX)) return;
      const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(authId);
      if (error) throw error;
    },
  };
}
