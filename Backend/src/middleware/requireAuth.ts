import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { fail } from "../utils/response.ts";
import { verifyToken } from "../utils/token.ts";

/**
 * Protects routes behind a valid login token.
 *
 * Reads `Authorization: Bearer <token>`, verifies the HMAC signature and
 * expiry, then loads the user (with its hospital) from the DB so deactivated
 * or deleted accounts lose access immediately. Attaches the resolved user to
 * `req.user` and the hospital id to `req.hospitalId` for downstream handlers.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return fail(res, 401, "Authentication required");

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { hospital: { include: { centre: true } } },
  });
  if (!user || !user.isActive) return fail(res, 401, "Authentication required");

  req.user = user;
  req.hospitalId = user.hospitalId;

  // Guard: every authenticated user must be linked to a hospital.
  // Without this, downstream Prisma queries that require hospitalId
  // would crash with "Argument hospitalId must not be null".
  if (!user.hospitalId) {
    return fail(
      res,
      403,
      "Your account is not linked to any hospital. Please contact an administrator.",
    );
  }

  return next();
}
