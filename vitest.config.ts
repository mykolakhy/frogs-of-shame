import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Playwright owns browser tests in e2e/. Keep Vitest focused on the
    // source and API/integration/contract test layers.
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.git/**", "**/e2e/**"],
  },
});
