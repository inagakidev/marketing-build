import { cache } from "react";
import { prisma } from "./db";
import { createSupabaseServerClient, supabaseConfigured } from "./supabase";
import { decideProvisioning } from "./security/provisioning";
import { decideMembershipAccess, type MembershipRole } from "./security/membershipAccess";

/**
 * Session of whoever uses the panel.
 *
 * Supabase authenticates; the `users` table is the application's identity.
 * They're linked by `supabaseAuthId`. Being authenticated in Supabase is NOT
 * enough: only people with a local record get in (SEC-01, decision D3 — see
 * `security/provisioning.ts`). No user is ever created from a login.
 *
 * A local record isn't enough either: the user acts through their single
 * active membership (EP-04.2, D13), which is re-read on every request, so a
 * deactivated member loses access on their next request.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  role: MembershipRole;
}

export type AuthState =
  | { status: "anonymous" }
  /** Authenticated in Supabase, but without access to the panel (no local
   *  record, or no active membership). */
  | { status: "unprovisioned" }
  | { status: "authenticated"; user: SessionUser };

/**
 * `cache` dedupes the call within a single request: layout, page and route can
 * ask for the user without multiplying trips to Supabase and the database.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  const bypass = await devBypassUser();
  if (bypass) return { status: "authenticated", user: bypass };

  if (!supabaseConfigured()) return { status: "anonymous" };

  const supabase = await createSupabaseServerClient();

  // `getUser` revalidates the token on the server. `getSession` only reads the
  // cookie, which the client could have forged — never authorize with it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { status: "anonymous" };

  const email = user.email.toLowerCase();
  const [byAuthId, byEmail] = await Promise.all([
    prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, supabaseAuthId: true },
    }),
    prisma.user.findUnique({
      where: { email },
      select: { id: true, supabaseAuthId: true },
    }),
  ]);

  const decision = decideProvisioning({
    authUser: { id: user.id, email, emailConfirmed: Boolean(user.email_confirmed_at) },
    byAuthId,
    byEmail,
  });

  if (decision.action === "deny") return { status: "unprovisioned" };

  // Membership first: someone without access must not trigger a write.
  const sessionUser = await loadSessionUser(decision.userId);
  if (!sessionUser) return { status: "unprovisioned" };

  if (decision.action === "link") {
    await prisma.user.update({
      where: { id: decision.userId },
      data: { supabaseAuthId: user.id },
    });
  }

  return { status: "authenticated", user: sessionUser };
});

/**
 * The session for a local user id, or `null` when they have no active
 * membership. Not cached: callers go through `getAuthState`, which is.
 */
export async function loadSessionUser(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      memberships: { select: { organizationId: true, role: true, status: true } },
    },
  });
  if (!user) return null;

  const access = decideMembershipAccess(user.memberships);
  if (access.action === "deny") return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    organizationId: access.organizationId,
    role: access.role,
  };
}

/** The panel user, or `null` if anonymous or without access. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const state = await getAuthState();
  return state.status === "authenticated" ? state.user : null;
}

/** Like `getSessionUser`, but throws when there's no session. For API routes. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "UnauthorizedError";
  }
}

/**
 * Panel access WITHOUT login, development only.
 *
 * Exists so the panel can be built and tested before Supabase credentials are
 * available. Three locks, all mandatory:
 *
 *   1. `NODE_ENV` must be exactly "development" — in production Next sets
 *      "production", so the bypass disappears in the build.
 *   2. Supabase must NOT be configured. As soon as the credentials are in
 *      .env, the normal authentication path takes over.
 *   3. `DEV_ADMIN_EMAIL` must point to a user that already exists in the
 *      database with an active membership — it creates no account.
 *
 * To disable it earlier, just remove `DEV_ADMIN_EMAIL` from .env.
 */
async function devBypassUser(): Promise<SessionUser | null> {
  if (process.env.NODE_ENV !== "development") return null;
  if (supabaseConfigured()) return null;

  const email = process.env.DEV_ADMIN_EMAIL?.trim();
  if (!email) return null;

  const found = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const user = found && (await loadSessionUser(found.id));

  if (user) {
    console.warn(
      `[auth] ACCESS WITHOUT LOGIN (development) as ${user.email}. ` +
        "Configure Supabase in .env to disable it.",
    );
  }
  return user;
}
