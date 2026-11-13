import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PENDING_AUTH_PREFIX } from "../../src/server/security/provisioning";

/**
 * Creates the administrator and makes them an active admin of the
 * organization.
 *
 * There's no public admin sign-up on purpose (AUTH-02, decision D3): the
 * first account is born here, by running `npm run db:seed:admin`. Everyone
 * else joins through invitations (D12).
 *
 * V1 has one organization (D13): the script reuses it when it exists and
 * creates it otherwise. Running it again never duplicates anything.
 *
 * Works in two modes:
 *
 * - **With Supabase configured:** creates the user in Supabase Auth and the
 *   linked local record. This is the production path.
 * - **Without Supabase:** creates only the local record, with a
 *   `supabaseAuthId` marked as pending. Useful for developing the panel and
 *   data before credentials exist; password login only works after running
 *   this script again with Supabase configured.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const NAME = process.env.ADMIN_NAME?.trim() || "Administradora";
// Lowercase: login compares normalized emails (src/server/auth.ts).
const EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const PASSWORD = process.env.ADMIN_PASSWORD;

/** Same placeholder as the migration backfill; renamed later in the panel. */
const ORGANIZATION_NAME = "Minha organização";

/** Marks a local record that has no Supabase Auth counterpart yet. */
const PENDING_PREFIX = PENDING_AUTH_PREFIX;

async function main(): Promise<void> {
  if (!EMAIL) {
    throw new Error("ADMIN_EMAIL is not set in .env.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasSupabase = Boolean(supabaseUrl && serviceKey);

  let supabaseAuthId = `${PENDING_PREFIX}${EMAIL}`;

  if (hasSupabase) {
    if (!PASSWORD || PASSWORD.length < 8) {
      throw new Error(
        "ADMIN_PASSWORD is not set or is shorter than 8 characters.",
      );
    }

    const supabase = createClient(supabaseUrl as string, serviceKey as string, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const existing = await findAuthUserByEmail(supabase.auth.admin, EMAIL);

    if (existing) {
      // Already exists: reset the password to the .env value, so the script
      // remains the way to recover access.
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: PASSWORD,
      });
      if (error) throw error;

      supabaseAuthId = existing.id;
      console.log(`  User already existed in Supabase Auth; password updated.`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: NAME },
      });
      if (error) throw error;

      supabaseAuthId = data.user.id;
      console.log("  User created in Supabase Auth.");
    }
  } else {
    console.warn(
      "  ! Supabase not configured. Creating only the local record.\n" +
        "    Login will only work after filling in NEXT_PUBLIC_SUPABASE_URL\n" +
        "    and SUPABASE_SERVICE_ROLE_KEY in .env and running this script again.",
    );
  }

  // The email is the stable identity across both modes: running the script
  // after configuring Supabase promotes the pending record instead of
  // creating a duplicate user.
  const existingLocal = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true },
  });

  const user = existingLocal
    ? await prisma.user.update({
        where: { id: existingLocal.id },
        data: { name: NAME, supabaseAuthId },
      })
    : await prisma.user.create({
        data: { name: NAME, email: EMAIL, supabaseAuthId },
      });

  await ensureAdminMembership(user.id);

  console.log(`Administrator ready: ${user.name} <${user.email}>`);
  if (supabaseAuthId.startsWith(PENDING_PREFIX)) {
    console.log("  (link to Supabase Auth still pending)");
  }
}

/**
 * Gives the user an active admin membership in the organization, creating the
 * organization on an empty database. Reactivates and promotes an existing
 * membership: the script is also the way to recover administrator access.
 */
async function ensureAdminMembership(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const organization =
      (await tx.organization.findFirst({ orderBy: { createdAt: "asc" } })) ??
      (await tx.organization.create({ data: { name: ORGANIZATION_NAME } }));

    const where = {
      organizationId_userId: { organizationId: organization.id, userId },
    };
    const existing = await tx.membership.findUnique({ where });

    if (existing?.role === "admin" && existing.status === "active") return;

    const membership = existing
      ? await tx.membership.update({
          where,
          data: { role: "admin", status: "active", deactivatedAt: null },
        })
      : await tx.membership.create({
          data: { organizationId: organization.id, userId, role: "admin" },
        });

    await tx.auditEvent.create({
      data: {
        organizationId: organization.id,
        actorId: null,
        entityType: "membership",
        entityId: membership.id,
        action: existing ? "membership.restored" : "membership.created",
        metadata: {
          role: "admin",
          source: "seed",
          ...(existing && { previousRole: existing.role, previousStatus: existing.status }),
        },
      },
    });
  });
}

/**
 * Supabase doesn't expose search by email in the Admin API; we paginate until
 * we find it.
 *
 * Takes only `auth.admin` instead of the whole client: `SupabaseClient`'s
 * generics depend on the database schema and can't be annotated by hand
 * without generated types we don't have here.
 */
async function findAuthUserByEmail(
  admin: ReturnType<typeof createClient>["auth"]["admin"],
  email: string,
) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;

    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

main()
  .catch((error) => {
    console.error("Failed to create the administrator:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
