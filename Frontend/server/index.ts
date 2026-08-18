import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware (cors only). Deliberately NO body parsers: this express app is
  // mounted in front of the Vite dev proxy, and `express.json()` would consume
  // POST request bodies before the proxy forwards them, hanging API calls
  // (e.g. /api/auth/login) that need a JSON body. The routes below are GET-only.
  app.use(cors());

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
