import { HttpError } from "../utils/httpError.ts";

export type IcdoSearchInput = {
  q: string;
  limit: number;
};

/**
 * Validates the `q` / `limit` query params of the ICD-O-3 search endpoints.
 *
 * The shared `validate()` middleware cannot be used here: it replaces
 * `req.query` with the cleaned value, but Express 5 exposes `query` as a
 * getter-only property, so the assignment throws. This helper runs inside the
 * controller instead and throws an HttpError(422) with per-field details,
 * matching the shape the error middleware renders for body validators.
 */
export function parseIcdoSearchQuery(raw: unknown): IcdoSearchInput {
  const errors: { field: string; message: string }[] = [];
  const data = (raw ?? {}) as Record<string, unknown>;

  // q: required, 1-100 chars after trimming
  let q: string | undefined;
  if (typeof data.q !== "string") {
    errors.push({ field: "q", message: "must be a string" });
  } else {
    q = data.q.trim();
    if (q.length === 0) {
      errors.push({ field: "q", message: "is required" });
    } else if (q.length > 100) {
      errors.push({ field: "q", message: "must be at most 100 characters" });
    }
  }

  // limit: optional integer in [1, 50], defaults to 20
  let limit = 20;
  if (data.limit !== undefined && data.limit !== null && data.limit !== "") {
    const n = typeof data.limit === "number" ? data.limit : Number(data.limit);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 50) {
      errors.push({
        field: "limit",
        message: "must be an integer between 1 and 50",
      });
    } else {
      limit = n;
    }
  }

  if (errors.length > 0) {
    throw new HttpError(422, "Validation failed", errors);
  }
  return { q: q as string, limit };
}
