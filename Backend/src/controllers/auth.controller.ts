import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { fail, ok } from "../utils/response.ts";
import { prisma } from "../db/prisma.ts";
import { hashPassword, verifyPassword } from "../utils/password.ts";
import { signToken, tokenExpiry } from "../utils/token.ts";

/**
 * Pre-computed hash of a random throwaway string. Compared against when the
 * username does not exist so a failed login takes the same bcrypt time as a
 * real one, which makes user enumeration via timing much harder.
 */
const DUMMY_HASH = await hashPassword("hbcr-dummy-password-for-timing");

function publicUser(
  user: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    initials: string;
    hospitalId: number | null;
  },
  hospital?: {
    id: number;
    name: string;
    centreId: number | null;
    centre?: { id: number; code: string } | null;
  } | null,
) {
  return {
    token: signToken({ sub: user.id, exp: tokenExpiry() }),
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      initials: user.initials,
      hospitalId: user.hospitalId,
    },
    hospital: hospital
      ? {
          id: hospital.id,
          name: hospital.name,
          centreId: hospital.centreId,
          centre: hospital.centre
            ? { id: hospital.centre.id, code: hospital.centre.code }
            : null,
        }
      : null,
  };
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body as { username: string; password: string };

    const user = await prisma.user.findUnique({
      where: { username },
      include: { hospital: { include: { centre: true } } },
    });

    // Always run a bcrypt compare (against the dummy hash when the user does
    // not exist) to keep response time roughly constant.
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const passwordOk = await verifyPassword(password, hash);

    if (!user || !passwordOk || !user.isActive) {
      return fail(res, 401, "Invalid hospital code or password");
    }

    return ok(res, publicUser(user, user.hospital), {
      message: "Login successful",
    });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return fail(res, 401, "Authentication required");
    return ok(res, publicUser(user, user.hospital));
  }),
};
