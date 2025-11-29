import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,   // fixe le port
    open: true    // ouvre automatiquement le navigateur
   },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  css: {
    preprocessorOptions: {
      // Si tu utilises SCSS ou autre, tu peux ajouter ici
    },
  },
});