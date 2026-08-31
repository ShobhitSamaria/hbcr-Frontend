import express, { type Application, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

import { config } from "./config/index.js";
import { apiRouter } from "./routes/index.ts";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.ts";
import { csrfProtection } from "./middleware/csrf.ts";

export function createApp(): Application {
  const app = express();

  // ---------------------------------------------------------------
  // 1. HTTPS enforcement in production (Render, Vercel, etc.)
  //    Render terminates TLS at the load balancer and forwards
  //    HTTP with X-Forwarded-Proto header.
  // ---------------------------------------------------------------
  if (config.nodeEnv === "production") {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.headers["x-forwarded-proto"] === "http") {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
      next();
    });
  }

  // ---------------------------------------------------------------
  // 2. Security headers via Helmet
  //    - HSTS: force HTTPS for 1 year including subdomains
  //    - X-Frame-Options: prevent clickjacking
  //    - X-Content-Type-Options: prevent MIME sniffing
  //    - CSP: restrict resource loading
  //    - Referrer-Policy: control referrer leakage
  //    - Permissions-Policy: disable unnecessary browser features
  // ---------------------------------------------------------------
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://hbcr.onrender.com", "https://hbcr-frontend.vercel.app"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      // Allow Vercel frontend to embed if needed; otherwise 'DENY'
      frameguard: { action: "deny" },
      // Disable cross-origin resource policy since the frontend (Vercel)
      // and backend (Render) are on different origins.
      crossOriginResourcePolicy: false,
    }),
  );

  // ---------------------------------------------------------------
  // 3. CORS — configured per environment
  // ---------------------------------------------------------------
  app.use(
    cors({
      origin:
        config.corsOrigin === "*"
          ? true
          : config.corsOrigin.split(",").map((o) => o.trim()),
      credentials: true,
    }),
  );

  // ---------------------------------------------------------------
  // 4. Cookie parser — needed for httpOnly auth cookie
  // ---------------------------------------------------------------
  app.use(cookieParser());

  // ---------------------------------------------------------------
  // 5. Body parsers
  // ---------------------------------------------------------------
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ---------------------------------------------------------------
  // 6. Rate limiting — global baseline (100 req / 15 min)
  // ---------------------------------------------------------------
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { message: "Too many requests. Please try again later.", status: 429 } },
  });
  app.use("/api", globalLimiter);

  // ---------------------------------------------------------------
  // 7. Strict rate limit on login — 10 attempts / 15 min per IP
  //    Prevents brute-force attacks against credentials.
  // ---------------------------------------------------------------
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { success: false, error: { message: "Too many login attempts. Please try again in 15 minutes.", status: 429 } },
  });
  app.use("/api/auth/login", loginLimiter);

  // ---------------------------------------------------------------
  // 8. Request logger (dev only — no sensitive data logged)
  // ---------------------------------------------------------------
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (config.nodeEnv !== "production") {
      // Only log method + path — never log headers, body, or query params
      // that may contain credentials or tokens.
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
  });

  // ---------------------------------------------------------------
  // 9. Health check (unauthenticated, outside /api to avoid limiter)
  // ---------------------------------------------------------------
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  // ---------------------------------------------------------------
  // 10. Root redirect to API docs
  // ---------------------------------------------------------------
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        name: "HBCR Backend",
        version: "1.0.0",
        api: "/api",
      },
    });
  });

  // ---------------------------------------------------------------
  // 11. CSRF protection on all /api state-changing requests
  // ---------------------------------------------------------------
  app.use("/api", csrfProtection);

  // All REST endpoints under /api
  app.use("/api", apiRouter);

  // 404 + error handlers come last
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
