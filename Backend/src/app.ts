import express, { type Application } from "express";
import cors from "cors";

import { config } from "./config/index.js";
import { apiRouter } from "./routes/index.ts";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.ts";

export function createApp(): Application {
  const app = express();

  // Permissive CORS by default; tighten via env if needed.
  app.use(
    cors({
      origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map((o) => o.trim()),
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Tiny request logger for development visibility
  app.use((req, _res, next) => {
    if (config.nodeEnv !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    }
    next();
  });

  // Root -> visible sanity response (the existing / endpoint behaviour)
  app.get("/", (_req, res) => {
    res.json({
      success: true,
      data: {
        name: "HBCR Backend",
        version: "1.0.0",
        api: "/api",
      },
    });
  });

  // All REST endpoints under /api
  app.use("/api", apiRouter);

  // 404 + error handlers come last
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
