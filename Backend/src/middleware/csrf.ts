import type { Request, Response, NextFunction } from "express";

/**
 * CSRF protection via custom header validation.
 *
 * Browser-initiated cross-origin HTML form submissions (POST, PUT, PATCH,
 * DELETE) cannot include custom headers. By requiring the X-Requested-With
 * header on all state-changing requests, we ensure that:
 *
 *   1. Only our SPA (which sets this header in fetch()) can make mutations.
 *   2. Malicious cross-origin forms cannot forge these requests.
 *
 * This is a lightweight alternative to full CSRF token schemes and works
 * perfectly for SPAs that use fetch() with custom headers.
 *
 * Safe methods (GET, HEAD, OPTIONS) are always allowed without the header.
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Allow safe methods without the header
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const header = req.headers["x-requested-with"];
  if (header !== "HBCR-SPA") {
    return res.status(403).json({
      success: false,
      error: {
        message: "CSRF validation failed. Missing or invalid X-Requested-With header.",
        status: 403,
      },
    });
  }

  return next();
}
