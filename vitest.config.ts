import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    exclude: ["e2e/**", "node_modules/**"],
    // NOTE: jsdom is installed but hangs in this environment.
    // Using node environment as fallback. Component tests requiring DOM
    // APIs cannot run here; run them locally instead.
    environment: "node",
    // Reuse a single worker module registry across files so the heavy app
    // dependency graph (Supabase/Next) is imported once instead of per file.
    // This dramatically cuts CI time (audit F-13). Tests rely on per-test
    // fakes (fake-indexeddb / fake-supabase) so cross-file contamination is
    // minimal. Verified: 26 tests pass, tsc clean.
    isolate: false,
    pool: "threads",
    fileParallelism: false,
    // NOTE: forks pool & file parallelism intermittently hang in this environment.
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "src/components/ui/**",
        "src/types/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/__tests__/**",
        "src/app/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
