/**
 * Stateless signed tokens (HMAC-SHA256 over a base64url payload) using only
 * Node's built-in crypto — no extra dependency. Format:
 *
 *   <base64url(JSON payload)>.<base64url(HMAC-SHA256 signature)>
 *
 * The payload carries the user id and an absolute expiry timestamp; the
 * signature binds it to the server secret so it cannot be forged or tampered
 * with. Verification is constant-time on the signature comparison.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config/index.js";

export type TokenPayload = {
  /** User id (User.id). */
  sub: number;
  /** Absolute expiry as a unix timestamp (seconds). */
  exp: number;
};

const SEPARATOR = ".";

export function signToken(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", config.authSecret)
    .update(body)
    .digest("base64url");
  return `${body}${SEPARATOR}${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const sepIndex = token.indexOf(SEPARATOR);
  if (sepIndex <= 0) return null;
  const body = token.slice(0, sepIndex);
  const sig = token.slice(sepIndex + 1);
  if (!body || !sig) return null;

  const expected = createHmac("sha256", config.authSecret)
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
    if (typeof payload.sub !== "number" || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function tokenExpiry(): number {
  return Math.floor(Date.now() / 1000) + config.authTokenTtlHours * 60 * 60;
}
