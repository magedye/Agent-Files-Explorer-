import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleApiRequest } from "./server/api.js";

function apiServerMiddleware() {
  return (req, res, next) => {
    let u;
    try {
      u = new URL(req.url, "http://localhost");
    } catch {
      return next();
    }
    if (!u.pathname.startsWith("/api/")) return next();
    handleApiRequest(req, res);
  };
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "aghr-governance-studio-api",
      configureServer(s) {
        s.middlewares.use(apiServerMiddleware());
      },
      configurePreviewServer(s) {
        s.middlewares.use(apiServerMiddleware());
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 5180,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5180,
    strictPort: true,
  },
});

