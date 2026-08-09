/**
 * Tiny synchronous validation library used by the HBCR registration form.
 *
 * Why not Zod? The form already has hand-rolled validators on the backend
 * and a custom field-capture context. We keep the client library symmetric
 * and dependency-free so the bundle stays small and the rules stay easy to
 * read alongside the labels they target.
 *
 * Usage:
 *   const validator = defineRules<Values>({
 *     "9. Full name":        [required(), minLen(2)],
 *     "12. Gender":          [required(), notEquals("Select gender")],
 *     "10. Age":             [isInt(), range(0, 130)],
 *     "PIN Code":            [pattern(/^[1-9][0-9]{5}$/)],
 *   });
 *   const errors = validateRecord(validator, values);
 */

export type Validator = (value: unknown, all: Record<string, unknown>) => string | null;
export type RuleSet<T extends Record<string, unknown>> = Partial<Record<keyof T, Validator[]>>;

export const required =
  (message = "Required"): Validator =>
  (v) => {
    if (v === undefined || v === null) return message;
    if (typeof v === "string" && v.trim() === "") return message;
    if (Array.isArray(v) && v.length === 0) return message;
    return null;
  };

export const minLen =
  (n: number, message?: string): Validator =>
  (v) => {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v !== "string" || v.trim().length < n)
      return message ?? `Must be at least ${n} characters`;
    return null;
  };

export const maxLen =
  (n: number, message?: string): Validator =>
  (v) => {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v !== "string" || v.length > n)
      return message ?? `Must be at most ${n} characters`;
    return null;
  };

export const isInt =
  (message = "Must be a whole number"): Validator =>
  (v) => {
    if (v === undefined || v === null || v === "") return null;
    const s = String(v);
    if (!/^-?\d+$/.test(s.trim())) return message;
    return null;
  };

export const range =
  (min: number, max: number, message?: string): Validator =>
  (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return message ?? `Must be between ${min} and ${max}`;
    if (n < min || n > max) return message ?? `Must be between ${min} and ${max}`;
    return null;
  };

/**
 * Match against a regex. Empty values pass; combine with `required()` to
 * reject blanks.
 */
export const pattern =
  (re: RegExp, message: string): Validator =>
  (v) => {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v !== "string" || !re.test(v.trim())) return message;
    return null;
  };

/**
 * Reject an exact string match (used to block placeholder values like
 * "Select gender").
 */
export const notEquals =
  (bad: string | string[], message = "Please select a value"): Validator =>
  (v) => {
    if (v === undefined || v === null || v === "") return null;
    const banned = Array.isArray(bad) ? bad : [bad];
    if (banned.includes(String(v))) return message;
    return null;
  };

export const isOneOf =
  (allowed: string[], message = "Please select a valid option"): Validator =>
  (v) => {
    if (v === undefined || v === null || v === "") return null;
    if (!allowed.includes(String(v))) return message;
    return null;
  };

export const isDate =
  (message = "Enter a valid date"): Validator =>
  (v) => {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v !== "string") return message;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return message;
    const d = new Date(v + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) return message;
    return null;
  };

/**
 * Reject dates that are in the future (used for "Date of Birth",
 * "Date of first diagnosis", etc.).
 */
export const notFutureDate =
  (message = "Date cannot be in the future"): Validator =>
  (v) => {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return null;
    const d = new Date(v + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);
    if (d.getTime() > today.getTime()) return message;
    return null;
  };

/**
 * Date that must come strictly after another named field, if that field
 * is set. Used to ensure `dateOfFirstDiagnosis <= dateOfReporting`, etc.
 */
export const after =
  (
    otherField: string,
    message = "Date must be on or after the related date",
  ): Validator =>
  (v, all) => {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return null;
    const other = all[otherField];
    if (typeof other !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(other.trim())) return null;
    const a = new Date(v + "T00:00:00Z").getTime();
    const b = new Date(other.trim() + "T00:00:00Z").getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    if (a < b) return message;
    return null;
  };

/**
 * Compose multiple validators. Each rule runs in order; the first failure
 * short-circuits and is returned.
 */
const compose =
  (...rules: Validator[]): Validator =>
  (v, all) => {
    for (const r of rules) {
      const msg = r(v, all);
      if (msg) return msg;
    }
    return null;
  };

/**
 * Run a RuleSet against a flat record of values (e.g. the form-state
 * snapshot). Returns a `label -> first error message` map; missing keys
 * are valid.
 */
export function validateRecord<T extends Record<string, unknown>>(
  rules: RuleSet<T>,
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of Object.keys(rules) as (keyof T)[]) {
    const fieldRules = rules[key];
    if (!fieldRules) continue;
    const value = values[key as string];
    for (const r of fieldRules) {
      const msg = r(value, values);
      if (msg) {
        errors[key as string] = msg;
        break;
      }
    }
  }
  return errors;
}

/**
 * Type-safe helper to build a RuleSet without TypeScript grumbling about
 * index access on a generic record.
 */
export function defineRules<T extends Record<string, unknown>>(
  rules: RuleSet<T>,
): RuleSet<T> {
  return rules;
}
