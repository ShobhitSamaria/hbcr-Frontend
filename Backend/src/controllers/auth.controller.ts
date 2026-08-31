import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { fail, ok } from "../utils/response.ts";
import { prisma } from "../db/prisma.ts";
import { hashPassword, verifyPassword } from "../utils/password.ts";
import { signToken, tokenExpiry } from "../utils/token.ts";
import { config } from "../config/index.js";

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

/**
 * Cookie options for the auth token.
 * - httpOnly: JavaScript cannot read the cookie (XSS protection)
 * - secure: only sent over HTTPS
 * - sameSite: 'strict' prevents CSRF from cross-origin requests
 * - path: limited to /api to avoid leaking token on static asset requests
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  // "none" is required for cross-origin cookie delivery (Vercel→Render).
  // CSRF is protected by the X-Requested-With custom header check.
  sameSite: config.nodeEnv === "production" ? ("none" as const) : ("lax" as const),
  path: "/api",
  maxAge: config.authTokenTtlHours * 60 * 60 * 1000, // ms
};

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    // Extract credentials from Authorization header (HTTP Basic Auth format)
    // instead of JSON body. This keeps the password out of the request payload
    // visible in browser DevTools Network tab.
    let username = "";
    let password = "";

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Basic ")) {
      // Decode base64 "username:password"
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
      const colonIndex = decoded.indexOf(":");
      if (colonIndex > 0) {
        username = decoded.slice(0, colonIndex);
        password = decoded.slice(colonIndex + 1);
      }
    }

    // Fallback: also accept credentials from body for backward compatibility
    if (!username || !password) {
      const body = req.body as { username?: string; password?: string };
      username = username || body.username || "";
      password = password || body.password || "";
    }

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

    // Generate token
    const token = signToken({ sub: user.id, exp: tokenExpiry() });

    // Set token as httpOnly secure cookie — invisible to JavaScript
    res.cookie("hbcr_token", token, COOKIE_OPTIONS);

    // Also return token in response body for backward compatibility
    // (e.g. environments where cookies don't work). The frontend can
    // choose to ignore this and rely on the cookie.
    return ok(res, { token, ...publicUser(user, user.hospital) }, {
      message: "Login successful",
    });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return fail(res, 401, "Authentication required");
    return ok(res, publicUser(user, user.hospital));
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    // Clear the auth cookie
    res.clearCookie("hbcr_token", {
      path: "/api",
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: config.nodeEnv === "production" ? "none" : "lax",
    });
    return ok(res, null, { message: "Logged out successfully" });
  }),
};
