import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { ok, fail } from "../utils/response.ts";
import { prisma } from "../db/prisma.ts";
import { config } from "../config/index.js";

export const healthController = {
  ping: (_req: Request, res: Response) => {
    return ok(res, {
      name: "HBCR Backend",
      env: config.nodeEnv,
      time: new Date().toISOString(),
    });
  },

  liveness: (_req: Request, res: Response) => {
    return ok(res, { status: "alive", time: new Date().toISOString() });
  },

  readiness: asyncHandler(async (_req: Request, res: Response) => {
    try {
      // Cheap round-trip to confirm Prisma + Postgres are ready
      await prisma.$queryRaw`SELECT 1`;
      return ok(res, { status: "ready", db: "up" });
    } catch (e) {
      return fail(
        res,
        503,
        e instanceof Error ? e.message : "DB not ready",
      );
    }
  }),
};
