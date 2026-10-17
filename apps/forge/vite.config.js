import { defineConfig } from "vite";

// base "./" so the build works from any folder: GitHub Pages (/Forge-plus-anvil/), a desktop wrapper, or a local file server.
export default defineConfig({
  base: "./",
  build: { outDir: "dist", target: "es2020", chunkSizeWarningLimit: 1500 },
});
