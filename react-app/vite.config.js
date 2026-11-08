import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The app is served from https://joynulk.github.io/website/app/ (see .github/workflows/pages.yml)
export default defineConfig({
  plugins: [react()],
  base: "/website/app/",
  build: { outDir: "dist", sourcemap: false },
});
