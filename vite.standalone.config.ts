import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

function standaloneFlagPlugin(): Plugin {
  return {
    name: "safestep-standalone-flag",
    transformIndexHtml(html) {
      return html.replace(
        "<head>",
        '<head>\n    <script>window.__SAFESTEP_STANDALONE__ = true;</script>'
      );
    },
  };
}

function pwaStandaloneStubPlugin(): Plugin {
  const virtualId = "virtual:pwa-register";
  const resolvedId = "\0" + virtualId;
  return {
    name: "safestep-pwa-standalone-stub",
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) {
        return "export function registerSW() { return async () => {}; }";
      }
    },
  };
}

export default defineConfig({
  plugins: [
    standaloneFlagPlugin(),
    pwaStandaloneStubPlugin(),
    react(),
    tailwindcss(),
    viteSingleFile({
      removeViteModuleLoader: true,
    }),
  ],
  publicDir: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    outDir: "dist-standalone",
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
});
