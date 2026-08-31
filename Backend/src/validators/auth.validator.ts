import type { Request, Response, NextFunction } from "express";

/**
 * Validate login input. Credentials can come from:
 *   1. Authorization: Basic <base64(username:password)> header (preferred)
 *   2. JSON body { username, password } (backward compatibility)
 *
 * This middleware is intentionally lenient — it only ensures at least one
 * source provides non-empty credentials. The actual authentication happens
 * in the controller.
 */
export function validateLogin(req: Request, res: Response, next: NextFunction) {
  // Check if credentials are in the Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
    const colonIndex = decoded.indexOf(":");
    if (colonIndex > 0) {
      const username = decoded.slice(0, colonIndex).trim();
      const password = decoded.slice(colonIndex + 1);
      if (username && password) return next();
    }
  }

  // Fallback: check if credentials are in the request body
  const body = req.body as Record<string, unknown> | undefined;
  if (body?.username && body?.password) return next();

  // Neither source has valid credentials
  return res.status(422).json({
    success: false,
    error: {
      message: "Hospital code / username and password are required",
      status: 422,
    },
  });
}
