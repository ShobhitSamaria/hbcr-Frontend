import {
  Relationship,
} from "../../generated/prisma/enums.ts";
import {
  inEnum,
  isString,
  makeValidator,
  matches,
  maxLen,
  required,
  trim,
  ValidationFieldError,
} from "./common.ts";

const MOBILE_RE = /^[6-9][0-9]{9}$/;
const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;

export const createRelativeValidator = makeValidator({
  relationship: [required(), inEnum(Relationship)],
  name: [
    isString(),
    trim(),
    maxLen(255),
    (v: unknown) => {
      if (v === undefined || v === null || String(v).trim() === "") return v;
      if (!NAME_RE.test(String(v))) throw new ValidationFieldError("must contain only letters, spaces, hyphens, or apostrophes");
      return v;
    },
  ],
  mobileNumber: [
    isString(),
    trim(),
    (v: unknown, all: Record<string, unknown>) => {
      // If name is provided, mobile number is required
      if (all.name && String(all.name).trim() !== "") {
        if (!v || String(v).trim() === "") {
          throw new ValidationFieldError("Mobile number is required when name is provided");
        }
      }
      if (v && String(v).trim() !== "") {
        if (!MOBILE_RE.test(String(v).trim())) {
          throw new ValidationFieldError("must be a 10-digit Indian mobile number");
        }
      }
      return v;
    },
  ],
});

export const updateRelativeValidator = makeValidator({
  name: [
    isString(),
    trim(),
    maxLen(255),
    (v: unknown) => {
      if (v === undefined || v === null || String(v).trim() === "") return v;
      if (!NAME_RE.test(String(v))) throw new ValidationFieldError("must contain only letters, spaces, hyphens, or apostrophes");
      return v;
    },
  ],
  mobileNumber: [
    isString(),
    trim(),
    (v: unknown, all: Record<string, unknown>) => {
      // If name is provided, mobile number is required
      if (all.name && String(all.name).trim() !== "") {
        if (!v || String(v).trim() === "") {
          throw new ValidationFieldError("Mobile number is required when name is provided");
        }
      }
      if (v && String(v).trim() !== "") {
        if (!MOBILE_RE.test(String(v).trim())) {
          throw new ValidationFieldError("must be a 10-digit Indian mobile number");
        }
      }
      return v;
    },
  ],
});

// Validator for cross-field check: at least one relative must be provided
// This is applied at the registration level, not per-relative.
export function validateAtLeastOneRelative(
  relatives: Array<{ relationship: string; name?: string; mobileNumber?: string }>
): void {
  if (!relatives || relatives.length === 0) {
    throw new ValidationFieldError("At least one relative detail must be provided");
  }
  // Check that at least one relative has a name
  const hasAny = relatives.some(r => r.name && String(r.name).trim() !== "");
  if (!hasAny) {
    throw new ValidationFieldError("At least one relative detail must be provided");
  }
}
