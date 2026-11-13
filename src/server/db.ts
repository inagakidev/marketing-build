import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Instância única do Prisma Client.
 *
 * A partir do Prisma 7 o client não abre conexão sozinho: recebe um driver
 * adapter. Trocar o Postgres local pelo Supabase é trocar a DATABASE_URL —
 * nada aqui muda.
 *
 * O cache no `globalThis` evita esgotar o pool de conexões durante o
 * desenvolvimento, quando o hot reload do Next reavalia este módulo a cada
 * alteração de arquivo.
 */

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não definida. Copie .env.example para .env e preencha.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
