/**
 * Tiny validation helpers used by every validator file. We keep everything
 * in-process (no joi/zod) so the dependency footprint stays small.
 */

import { HttpError } from "../utils/httpError.ts";

const FIELD_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export class ValidationError extends HttpError {
  details: { field: string; message: string }[];
  constructor(details: { field: string; message: string }[]) {
    super(422, "Validation failed", details);
    this.details = details;
  }
}

export type ValidatorRule<T> = (value: unknown, all: T) => unknown;
export type Schema<T> = Partial<Record<keyof T, ValidatorRule<T>[]>>;

export function makeValidator<T extends Record<string, unknown>>(schema: Schema<T>) {
  return (raw: unknown): T => {
    const data = (raw ?? {}) as T;
    const errors: { field: string; message: string }[] = [];

    const cleaned = {} as T;

    for (const key of Object.keys(schema) as (keyof T)[]) {
      const rules = schema[key];
      if (!rules) continue;
      let value: unknown = (data as Record<string, unknown>)[key as string];

      for (const rule of rules) {
        try {
          value = rule(value, cleaned);
        } catch (e) {
          if (e instanceof ValidationFieldError) {
            errors.push({ field: String(key), message: e.message });
            break;
          }
          throw e;
        }
      }

      // do not store undefined values to keep payloads tidy
      (cleaned as Record<string, unknown>)[key as string] = value as unknown;
    }

    if (errors.length > 0) throw new ValidationError(errors);

    return cleaned;
  };
}

export class ValidationFieldError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationFieldError";
  }
}

export const isString = (msg = "must be a string"): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") throw new ValidationFieldError(msg);
  return v;
};

export const isInt = (msg = "must be an integer"): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n))
    throw new ValidationFieldError(msg);
  return n;
};

export const isPositiveInt = (
  msg = "must be a positive integer",
): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0)
    throw new ValidationFieldError(msg);
  return n;
};

export const isSmallInt = (msg = "must be an integer between 0 and 32767"): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 32767)
    throw new ValidationFieldError(msg);
  return n;
};

export const isNumber = (msg = "must be a number"): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new ValidationFieldError(msg);
  return n;
};

export const isBoolean = (msg = "must be true or false"): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  throw new ValidationFieldError(msg);
};

export const required = (msg = "is required"): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null || v === "")
    throw new ValidationFieldError(msg);
  return v;
};

export const minLen = (n: number, msg?: string): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string" || v.length < n)
    throw new ValidationFieldError(msg ?? `must be at least ${n} characters`);
  return v;
};

export const maxLen = (n: number, msg?: string): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string" || v.length > n)
    throw new ValidationFieldError(msg ?? `must be at most ${n} characters`);
  return v;
};

export const matches = (
  re: RegExp,
  msg: string,
): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string" || !re.test(v)) throw new ValidationFieldError(msg);
  return v;
};

export const isDate = (msg = "must be a valid ISO date (YYYY-MM-DD)"): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string") throw new ValidationFieldError(msg);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new ValidationFieldError(msg);
  const d = new Date(v + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) throw new ValidationFieldError(msg);
  return new Date(v + "T00:00:00Z");
};

export const isDateTime = (msg = "must be a valid ISO datetime"): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string") throw new ValidationFieldError(msg);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new ValidationFieldError(msg);
  return d;
};

export const inEnum = <T extends Record<string, string>>(
  enumObj: T,
  msg = "is not a valid value",
): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  const allowed = Object.values(enumObj);
  if (!allowed.includes(v as string)) throw new ValidationFieldError(msg);
  return v;
};

export const isObject = (msg = "must be an object"): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "object" || Array.isArray(v))
    throw new ValidationFieldError(msg);
  return v;
};

export const trim = (): ValidatorRule<unknown> => (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return v;
  return v.trim();
};

export function parseIdParam(value: unknown, name = "id"): number {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new HttpError(400, `Invalid ${name}: ${value}`);
  }
  return n;
}

// Sanity check that the helpers compile cleanly under `tsx` (excluded via
// tree-shake on import). Keeping the import warm forces single-source truth.
void FIELD_RE;
