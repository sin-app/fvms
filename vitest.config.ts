import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    exclude: ["e2e/**", "node_modules/**"],
    // NOTE: jsdom is installed but hangs in this environment.
    // Using node environment as fallback. Component tests requiring DOM
    // APIs cannot run here; run them locally instead.
    environment: "node",
    // Each test file gets an isolated module registry so per-file vi.mock()
    // (e.g. @/lib/supabase/admin-client) is not contaminated by imports from
    // other files. isolate:false broke land-proposal/notification/schedule
    // service tests (mocked client returned undefined).
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
