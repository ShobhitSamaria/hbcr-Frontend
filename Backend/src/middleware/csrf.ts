import type { Request, Response, NextFunction } from "express";
import { isOriginAllowed } from "../config/index.js";

/**
 * CSRF protection via custom header validation + Origin checks.
 *
 * Browser-initiated cross-origin HTML form submissions (POST, PUT, PATCH,
 * DELETE) cannot include custom headers. By requiring the X-Requested-With
 * header on all state-changing requests, we ensure that:
 *
 *   1. Only our SPA (which sets this header in fetch()) can make mutations.
 *   2. Malicious cross-origin forms cannot forge these requests.
 *
 * The custom header alone is not a secret (its value ships in the JS bundle),
 * so we ALSO verify the Origin header server-side: when a browser sends a
 * cross-site state-changing request the Origin must match the CORS allow-list.
 * This is what actually stops an attacker's site from riding the httpOnly
 * auth cookie (SameSite=None is required for the Vercel → Render deployment).
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

  // Origin check for cross-site state-changing requests. Requests with no
  // Origin header (same-origin page fetches, curl, server-to-server, health
  // monitors) are allowed. If a browser supplied an Origin, it must be the
  // same host as this API or on the explicit CORS allow-list.
  const origin = req.headers.origin;
  if (origin) {
    let sameHost = false;
    try {
      sameHost = new URL(origin).host === req.headers.host;
    } catch {
      sameHost = false;
    }
    if (!sameHost && !isOriginAllowed(origin)) {
      return res.status(403).json({
        success: false,
        error: {
          message: "Cross-origin request blocked.",
          status: 403,
        },
      });
    }
  }

  return next();
}
