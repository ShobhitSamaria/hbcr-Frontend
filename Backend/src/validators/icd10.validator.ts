import { HttpError } from "../utils/httpError.ts";

export type Icdo10Kind = "range" | "code" | "example" | "rule";

const KINDS: ReadonlySet<string> = new Set(["range", "code", "example", "rule"]);

export type Icdo10SearchInput = {
  q: string;
  /** Enabled result kinds; empty means "all". */
  types: Icdo10Kind[];
  limit: number;
};

/**
 * Validates the `q` / `type` / `limit` query params of the ICD-10 search
 * endpoint. Like the ICD-O-3 validator, this runs inside the controller
 * because the shared `validate()` middleware replaces `req.query`, which is
 * getter-only in Express 5.
 */
export function parseIcdo10SearchQuery(raw: unknown): Icdo10SearchInput {
  const errors: { field: string; message: string }[] = [];
  const data = (raw ?? {}) as Record<string, unknown>;

  // q: required, 1-100 chars after trimming
  let q: string | undefined;
  if (typeof data.q !== "string") {
    errors.push({ field: "q", message: "must be a string" });
  } else {
    q = data.q.trim().toUpperCase();
    if (q.length === 0) {
      errors.push({ field: "q", message: "is required" });
    } else if (q.length > 100) {
      errors.push({ field: "q", message: "must be at most 100 characters" });
    }
  }

  // type: optional comma-separated kinds; default = all four
  let types: Icdo10Kind[] = [];
  if (data.type !== undefined && data.type !== null && data.type !== "") {
    const parts = String(data.type)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    for (const p of parts) {
      if (!KINDS.has(p)) {
        errors.push({
          field: "type",
          message: `unknown kind "${p}" (expected range, code, example or rule)`,
        });
      } else if (!seen.has(p)) {
        seen.add(p);
        types.push(p as Icdo10Kind);
      }
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
  return { q: q as string, types, limit };
}

// ---------------------------------------------------------------------------
// ICD-O-3 Topography → ICD-10 mapping lookup
// ---------------------------------------------------------------------------

/** Shape of `code` for the map-topography lookup: an ICD-O-3 topography code
 *  like "C30.0" (letter + 2 digits + optional subdivision). */
const TOPO_CODE_RE = /^C\d{2}(\.\d+)?$/;

export type Icdo10MapTopographyInput = {
  /** Normalized (uppercased) ICD-O-3 topography code, e.g. "C30.0". */
  code: string;
};

/**
 * Validates the `code` query param of GET /api/icd10/map-topography.
 * Accepts an ICD-O-3 topography code (C00.0–C80.9), case-insensitively.
 */
export function parseIcdo10MapTopographyQuery(raw: unknown): Icdo10MapTopographyInput {
  const errors: { field: string; message: string }[] = [];
  const data = (raw ?? {}) as Record<string, unknown>;

  let code: string | undefined;
  if (typeof data.code !== "string") {
    errors.push({ field: "code", message: "must be a string" });
  } else {
    code = data.code.trim().toUpperCase();
    if (code.length === 0) {
      errors.push({ field: "code", message: "is required" });
    } else if (code.length > 16) {
      errors.push({ field: "code", message: "must be at most 16 characters" });
    } else if (!TOPO_CODE_RE.test(code)) {
      errors.push({
        field: "code",
        message: "must look like an ICD-O-3 topography code (e.g. C30.0)",
      });
    }
  }

  if (errors.length > 0) {
    throw new HttpError(422, "Validation failed", errors);
  }
  return { code: code as string };
}
