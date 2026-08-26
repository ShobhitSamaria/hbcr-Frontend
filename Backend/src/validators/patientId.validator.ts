import {
  IdType,
} from "../../generated/prisma/enums.ts";
import {
  inEnum,
  isString,
  makeValidator,
  maxLen,
  required,
  trim,
  matches,
} from "./common.ts";

// Format patterns for each ID type
const AADHAAR_RE = /^[0-9]{12}$/;
const ABHA_RE = /^[0-9]{14}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const VOTER_RE = /^[A-Za-z0-9]{10}$/;
const PASSPORT_RE = /^[A-Z][0-9]{7}$/;
const ABPMJAY_RE = /^[A-Za-z0-9\-]+$/;

export const createPatientIdentificationValidator = makeValidator({
  idType: [required(), inEnum(IdType)],
  number: [
    required(),
    isString(),
    trim(),
    maxLen(64),
    // Format validation is applied dynamically based on idType below
  ],
});

export const updatePatientIdentificationValidator = makeValidator({
  idType: [inEnum(IdType)],
  number: [isString(), trim(), maxLen(64)],
});

/**
 * Validate ID number format based on the ID type.
 * Called after the base validator to check format-specific rules.
 */
export function validateIdNumberFormat(idType: string, number: string): string | null {
  switch (idType) {
    case 'AADHAAR':
      return AADHAAR_RE.test(number) ? null : 'Aadhaar must be exactly 12 digits';
    case 'ABHA':
      return ABHA_RE.test(number) ? null : 'ABHA must be exactly 14 digits';
    case 'PAN_CARD':
      return PAN_RE.test(number) ? null : 'PAN must be 5 uppercase letters + 4 digits + 1 uppercase letter';
    case 'VOTER_ID':
      return VOTER_RE.test(number) ? null : 'Voter ID must be exactly 10 alphanumeric characters';
    case 'PASSPORT':
      return PASSPORT_RE.test(number) ? null : 'Passport must be 1 uppercase letter + 7 digits';
    case 'AB_PMJAY':
      return ABPMJAY_RE.test(number) ? null : 'AB-PMJAY ID contains invalid characters';
    default:
      return null; // No format validation for OTHER type
  }
}
