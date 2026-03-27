import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@milkdown/plugin-inline-diff/style.css",
        replacement: fileURLToPath(new URL("../../src/style.css", import.meta.url)),
      },
      {
        find: "@milkdown/plugin-inline-diff",
        replacement: fileURLToPath(new URL("../../src/index.ts", import.meta.url)),
      },
    ],
    dedupe: [
      "@milkdown/core",
      "@milkdown/ctx",
      "@milkdown/crepe",
      "@milkdown/kit",
      "@milkdown/plugin-listener",
      "@milkdown/plugin-tooltip",
      "@milkdown/prose",
      "@milkdown/utils",
      "react",
      "react-dom",
      "vue",
    ],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    open: true,
  },
});
