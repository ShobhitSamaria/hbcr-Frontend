import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";
import { config } from "../config/index.js";

// Single PrismaClient instance reused across the app. In dev, storing it on
// globalThis prevents Prisma's "too many clients" warning when `tsx watch`
// re-imports the module.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: config.databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ??
  (config.nodeEnv === "production"
    ? createPrismaClient()
    : (globalForPrisma.prisma = createPrismaClient()));

export async function connectDb() {
  await prisma.$connect();
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
