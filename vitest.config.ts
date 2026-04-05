import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["test/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: [["text", { skipFull: true }], "text-summary", "html", "lcov"],
      reportsDirectory: "coverage",
      include: [
        "src/App.tsx",
        "src/pages/**/*.{ts,tsx}",
        "src/components/**/*.{ts,tsx}",
        "src/lib/utils.ts",
      ],
      exclude: [
        "src/test/**",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/components/ui/**",
        "src/hooks/**",
        "src/lib/api.ts",
        "src/lib/storage.ts",
        "src/lib/types.ts",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
