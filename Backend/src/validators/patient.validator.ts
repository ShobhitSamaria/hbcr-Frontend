import { Gender } from "../../generated/prisma/enums.ts";
import { isDate, inEnum, isInt, isString, makeValidator, maxLen, required, trim } from "./common.ts";

export const createPatientValidator = makeValidator({
  fullName: [required(), isString(), trim(), maxLen(255)],
  age: [isInt()],
  dateOfBirth: [isDate()],
  gender: [required(), inEnum(Gender)],
});

export const updatePatientValidator = makeValidator({
  fullName: [isString(), trim(), maxLen(255)],
  age: [isInt()],
  dateOfBirth: [isDate()],
  gender: [inEnum(Gender)],
});

// Helper used by ID search (path param)
export function parseId(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new Error(`Invalid id: ${raw}`);
  }
  return n;
}
