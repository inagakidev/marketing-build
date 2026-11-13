import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Backfill of the organizations migration (EP-04.1, D8–D13).
 *
 * Runs the real SQL files in a throwaway Postgres schema: every migration
 * before the target, then seed rows, then the target. Testing through Prisma
 * would only see the already-migrated database, where the backfill has
 * nothing left to do.
 */

const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");
const TARGET_SUFFIX = "_organizations_and_members";

function migrationDirs(): { before: string[]; target: string } {
  const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const target = dirs.find((name) => name.endsWith(TARGET_SUFFIX));
  if (!target) throw new Error(`No migration ending in ${TARGET_SUFFIX}.`);
  return { before: dirs.filter((name) => name < target), target };
}

function migrationSql(dir: string): string {
  return readFileSync(join(MIGRATIONS_DIR, dir, "migration.sql"), "utf8");
}

const schema = `itest_org_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
let db: Client;

beforeEach(async () => {
  db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(`CREATE SCHEMA "${schema}"`);
  await db.query(`SET search_path TO "${schema}"`);
  for (const dir of migrationDirs().before) await db.query(migrationSql(dir));
});

afterEach(async () => {
  await db.query(`DROP SCHEMA "${schema}" CASCADE`);
  await db.end();
});

async function insertUser(id: string, email: string) {
  await db.query(
    `INSERT INTO users (id, "supabaseAuthId", name, email) VALUES ($1, $2, $3, $4)`,
    [id, `pending:${email}`, id, email],
  );
}

describe("organizations migration backfill", () => {
  it("puts every existing user in one initial organization as an active admin", async () => {
    await insertUser("u1", "one@example.com");
    await insertUser("u2", "two@example.com");
    await db.query(
      `INSERT INTO clients (id, "userId", name, "contactEmail", "updatedAt")
       VALUES ('c1', 'u1', 'Client', 'client@example.com', now())`,
    );

    await db.query(migrationSql(migrationDirs().target));

    const orgs = await db.query(`SELECT id, name FROM organizations`);
    expect(orgs.rows).toHaveLength(1);
    expect(orgs.rows[0].name).toBe("Minha organização");

    const memberships = await db.query(
      `SELECT "organizationId", "userId", role, status FROM memberships ORDER BY "userId"`,
    );
    expect(memberships.rows).toEqual([
      { organizationId: orgs.rows[0].id, userId: "u1", role: "admin", status: "active" },
      { organizationId: orgs.rows[0].id, userId: "u2", role: "admin", status: "active" },
    ]);

    const audit = await db.query(
      `SELECT "actorId", "entityType", action, metadata FROM audit_events`,
    );
    expect(audit.rows).toHaveLength(2);
    expect(audit.rows[0]).toEqual({
      actorId: null,
      entityType: "membership",
      action: "membership.created",
      metadata: { role: "admin", source: "migration" },
    });

    // EP-04 leaves client ownership alone; that moves in EP-05.
    const clients = await db.query(`SELECT "userId" FROM clients`);
    expect(clients.rows).toEqual([{ userId: "u1" }]);
  });

  it("creates no organization when there are no users", async () => {
    await db.query(migrationSql(migrationDirs().target));

    const orgs = await db.query(`SELECT count(*)::int AS n FROM organizations`);
    expect(orgs.rows[0].n).toBe(0);
  });

  it("rejects a second membership for the same user in the same organization", async () => {
    await insertUser("u1", "one@example.com");
    await db.query(migrationSql(migrationDirs().target));

    await expect(
      db.query(
        `INSERT INTO memberships (id, "organizationId", "userId", role, "updatedAt")
         SELECT 'm-dup', "organizationId", "userId", 'member', now() FROM memberships`,
      ),
    ).rejects.toThrow(/unique/i);
  });
});
