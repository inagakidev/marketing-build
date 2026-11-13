import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { customAlphabet } from "nanoid";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Cria um cliente e um briefing de exemplo e imprime o link público.
 *
 * Só para desenvolvimento: serve para abrir o formulário no navegador sem
 * precisar do painel autenticado nem do Supabase configurado.
 *
 *   npm run dev:data
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não definida.");

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

  console.log("\nDados de exemplo criados.");
  console.log(`  Cliente:  ${client.name}`);
  console.log(`  Briefing: ${briefing.id}`);
  console.log(`\n  Link:  ${baseUrl}/briefing/${briefing.token}\n`);
}

main()
  .catch((error) => {
    console.error("Falha:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
