/**
 * Quem pode entrar no painel (SEC-01, decisão D3).
 *
 * Política provisória até os convites da Fase 1: só entra quem já tem
 * registro na tabela `users`, criado por `npm run db:seed:admin` ou ação
 * administrativa equivalente. Uma conta que exista apenas no Supabase — por
 * exemplo, criada pelo signup público dele — é recusada. O sistema nunca cria
 * usuário a partir de um login.
 */

/** Marca do `supabaseAuthId` de um cadastro local ainda sem conta de login. */
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

  // Cadastro prévio criado sem Supabase: vincula no primeiro login, desde que
  // o e-mail esteja confirmado (prova de posse) e o registro ainda não
  // pertença a outra conta de autenticação.
  if (
    byEmail &&
    authUser.emailConfirmed &&
    byEmail.supabaseAuthId.startsWith(PENDING_AUTH_PREFIX)
  ) {
    return { action: "link", userId: byEmail.id };
  }

  return { action: "deny" };
}
