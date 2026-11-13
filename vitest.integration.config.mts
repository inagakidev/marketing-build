import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Integration tests: they hit a real Postgres (the docker-compose one).
 *
 * They're kept out of `npm test` on purpose. The unit suite must run in under
 * a second with no infrastructure; mixing the two would make the main gate
 * depend on a running container.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.itest.ts"],
    // Transactions share the same database: running in parallel would cause
    // interference between files.
    fileParallelism: false,
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
