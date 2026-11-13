import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Configuração do Prisma 7.
 *
 * A partir da v7 a connection string não pode mais viver no schema.prisma —
 * ela é declarada aqui e o PrismaClient em runtime recebe um driver adapter
 * (ver src/server/db.ts).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
});
