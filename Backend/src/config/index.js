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
  // CORS allow-list. Comma-separated env var override; default accepts all
  // origins so the existing Frontend (any port) can connect during dev.
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
