import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Forward API calls to the HBCR backend during development.
      // Override via HBCR_API_TARGET env var when needed.
      "/api": {
        target: process.env.HBCR_API_TARGET || "http://localhost:5050",
        changeOrigin: true,
        ws: false,
        // Allow cookies (httpOnly auth token) to pass through the proxy
        cookieDomainRewrite: {
          "*": "",
        },
      },
    },
    fs: {
      allow: ['.', './', './client', './shared', './src', './public']
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
