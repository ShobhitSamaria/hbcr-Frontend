#!/usr/bin/env node
/**
 * Apply prisma/raw_constraints.sql to the configured database. Used instead of
 * psql (not always installed). Safe to re-run — uses IF NOT EXISTS / etc.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, "../prisma/raw_constraints.sql");
const sqlText = readFileSync(sqlPath, "utf-8");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const { PrismaClient } = await import("../generated/prisma/client.ts");
const prisma = new PrismaClient({ adapter });

try {
  await prisma.$executeRawUnsafe(sqlText);
  console.log("[apply-raw-constraints] OK");
} catch (e) {
  console.error("[apply-raw-constraints] failed:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
