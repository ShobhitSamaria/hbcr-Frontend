import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 5050,
  nodeEnv: process.env.NODE_ENV || "development",
  // Database connection string for the Prisma driver adapter. Defaults to the
  // project's pre-existing DATABASE_URL (`postgresql://shobhitsamaria@localhost:5432/hbcr_db`).
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://shobhitsamaria@localhost:5432/hbcr_db",
  // CORS allow-list. Comma-separated env var override (CORS_ORIGIN).
  //   - Development default: "*" (any origin, local tooling only).
  //   - Production default: the deployed Vercel frontend ONLY. Reflecting every
  //     origin while sending credentials is what enables cross-site request
  //     forgery against the httpOnly cookie (SameSite=None on Vercel → Render),
  //     so production must use an explicit allow-list. Preview deployments and
  //     additional origins must be added via the CORS_ORIGIN env var.
  corsOrigin:
    process.env.CORS_ORIGIN ||
    (process.env.NODE_ENV === "production"
      ? "https://hbcr-frontend.vercel.app"
      : "*"),
  // Secret used to sign login tokens (HMAC-SHA256). MUST be overridden via
  // AUTH_SECRET in any non-local environment.
  authSecret: process.env.AUTH_SECRET || "hbcr-dev-secret-change-me",
  // Login token lifetime in hours.
  authTokenTtlHours: Number(process.env.AUTH_TOKEN_TTL_HOURS) || 12,
};

/**
 * Parsed allow-list of CORS origins (exact-match strings; "*" = allow all).
 */
export function corsOrigins() {
  if (config.corsOrigin === "*") return ["*"];
  return config.corsOrigin
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * True when the given Origin header value may call this API. Exact match
 * against the configured allow-list, or "*" when every origin is allowed.
 * Requests without an Origin header (same-origin fetches, curl, monitors)
 * are always permitted by the caller of this helper.
 */
export function isOriginAllowed(origin) {
  if (!origin) return true;
  const list = corsOrigins();
  if (list.includes("*")) return true;
  return list.includes(origin);
}
