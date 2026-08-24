import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://127.0.0.1:5432/vitest",
      AUTH_SECRET: "vitest-auth-secret-vitest-auth-secret",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  css: { postcss: { plugins: [] } },
});
