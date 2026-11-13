import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Testes de integração: batem no Postgres de verdade (o do docker-compose).
 *
 * Ficam fora do `npm test` de propósito. A suíte unitária precisa rodar em
 * menos de um segundo e sem infraestrutura; misturar as duas faria o portão
 * principal depender de um container no ar.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.itest.ts"],
    // As transações compartilham o mesmo banco: rodar em paralelo produziria
    // interferência entre arquivos.
    fileParallelism: false,
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
