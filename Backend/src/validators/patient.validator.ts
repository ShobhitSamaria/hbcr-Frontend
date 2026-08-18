import { Gender } from "../../generated/prisma/enums.ts";
import { isBoolean, isDate, inEnum, isInt, isString, makeValidator, maxLen, required, trim, ValidationFieldError } from "./common.ts";

const NAME_PART = [isString(), trim(), maxLen(100)];

/**
 * Derive `fullName` from the First / Middle / Last parts when any part is
 * present, so the NOT-NULL `full_name` column stays in sync with the split
 * input. Falls back to an explicitly-provided `fullName` (legacy clients).
 */
function deriveFullName(v: unknown, all: Record<string, unknown>): string | undefined {
  const parts = [all.firstName, all.middleName, all.lastName]
    .filter((x) => x !== undefined && x !== null && String(x).trim() !== "")
    .map((x) => String(x).trim());
  if (parts.length > 0) return parts.join(" ");
  if (v === undefined || v === null || v === "") return undefined;
  return v as string;
}

export const createPatientValidator = makeValidator({
  firstName: NAME_PART,
  middleName: NAME_PART,
  lastName: NAME_PART,
  fullName: [
    (v, all) => {
      const derived = deriveFullName(v, all);
      if (derived === undefined) {
        throw new ValidationFieldError("Patient name is required");
      }
      return derived;
    },
    isString(),
    trim(),
    maxLen(255),
  ],
  age: [isInt()],
  dateOfBirth: [isDate()],
  gender: [required(), inEnum(Gender)],
  healthSchemeBeneficiary: [isBoolean()],
  healthSchemeDetails: [isString(), trim(), maxLen(255)],
});

export const updatePatientValidator = makeValidator({
  firstName: NAME_PART,
  middleName: NAME_PART,
  lastName: NAME_PART,
  fullName: [
    (v, all) => deriveFullName(v, all),
    isString(),
    trim(),
    maxLen(255),
  ],
  age: [isInt()],
  dateOfBirth: [isDate()],
  gender: [inEnum(Gender)],
  healthSchemeBeneficiary: [isBoolean()],
  healthSchemeDetails: [isString(), trim(), maxLen(255)],
});

// Helper used by ID search (path param)
export function parseId(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new Error(`Invalid id: ${raw}`);
  }
  return n;
}
