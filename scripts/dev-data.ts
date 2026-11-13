import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { customAlphabet } from "nanoid";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Creates a sample client and briefing and prints the public link.
 *
 * Development only: lets you open the form in the browser without the
 * authenticated panel or a configured Supabase.
 *
 *   npm run dev:data
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const generateToken = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  24,
);

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim() || "admin@exemplo.com";

  const user =
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.create({
      data: {
        email,
        name: process.env.ADMIN_NAME?.trim() || "Administradora",
        supabaseAuthId: `pending:${email}`,
      },
    }));

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Doce Vida Confeitaria",
      contactEmail: "contato@docevida.exemplo",
      phone: "(41) 99999-0000",
      projectType: "Reposicionamento de marca",
      internalNotes: "Indicada por uma cliente antiga. Orçamento apertado.",
    },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const briefing = await prisma.briefing.create({
    data: {
      clientId: client.id,
      token: generateToken(),
      status: "awaiting_response",
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  console.log("\nSample data created.");
  console.log(`  Client:   ${client.name}`);
  console.log(`  Briefing: ${briefing.id}`);
  console.log(`\n  Link:  ${baseUrl}/briefing/${briefing.token}\n`);
}

main()
  .catch((error) => {
    console.error("Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
