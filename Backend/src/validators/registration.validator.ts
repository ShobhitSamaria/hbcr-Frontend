import {
  CaseThrough,
  Education,
  MaritalStatus,
  ReferralType,
  RegistrationStatus,
} from "../../generated/prisma/enums.ts";
import { inEnum, isBoolean, isDate, isInt, isPositiveInt, isString, makeValidator, matches, maxLen, notFutureDate, required, trim, ValidationFieldError } from "./common.ts";

const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;
const MOBILE_RE = /^[6-9][0-9]{9}$/;

/**
 * Positive number greater than 0. Allows decimals.
 */
const positiveNumber = (min: number, msg: string) => (v: unknown) => {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= min) throw new ValidationFieldError(msg);
  return n;
};

// Registration Number: last 2 digits of year + 5-digit sequence (e.g. 2600001)
const REG_NO_RE = /^\d{7}$/;
const PIN_RE = /^[1-9][0-9]{5}$/;

export const HBCR_REGISTRATION_NO_REGEX = REG_NO_RE;

/**
 * Validator for the full HBCR registration record (Step 1 fields 1-8 +
 * form-completion fields 31-32 + marital/education/anthropometric).
 *
 * `patientId` is taken from the URL (`/patients/:patientId/registrations`).
 * `hospitalId` MUST come from the body.
 */
export const createRegistrationValidator = makeValidator({
  hbcrRegistrationNo: [isString(), trim(), maxLen(20)], // Now optional - auto-generated if not provided
  hospitalId: [required(), isInt("hospitalId is required and must be a positive integer")],
  referenceNo: [isString(), trim(), maxLen(64)], // Now optional - auto-generated if not provided
  departmentName: [required(), isString(), trim(), maxLen(255)],
  unitNumber: [required(), isString(), trim(), maxLen(32)],
  dateOfReporting: [required(), isDate(), notFutureDate()],
  caseRegisteredThrough: [required(), inEnum(CaseThrough)],
  caseRegisteredThroughOther: [isString(), trim(), maxLen(128), (v: unknown, all: Record<string, unknown>) => {
    if (all.caseRegisteredThrough === "OTHER" && (!v || String(v).trim() === "")) {
      throw new ValidationFieldError("Please specify the case registered through (Other)");
    }
    return v;
  }],
  referralType: [required(), inEnum(ReferralType)],
  referralFacilityName: [isString(), trim(), maxLen(255)],
  referralFacilityCity: [isString(), trim(), maxLen(64)],
  referralFacilityDistrict: [isString(), trim(), maxLen(64)],
  referralFacilityPincode: [isString(), trim(), maxLen(6), (v: unknown) => {
    if (v === undefined || v === null || v === "") return v;
    if (!PIN_RE.test(String(v))) throw new ValidationFieldError("must be a 6-digit Indian PIN code");
    return v;
  }],
  referralFacilityHospitalLabNh: [isString(), trim(), maxLen(255)],
  referralFacilityRegDate: [isDate(), notFutureDate()],
  dateOfFirstDiagnosis: [required(), isDate(), notFutureDate()],
  microscopicConfirmationLater: [required(), isBoolean()],
  anthropometricHeightCm: [required(), isPositiveInt("Height must be a positive integer"), (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    if (n < 1 || n > 300) throw new ValidationFieldError("Height must be between 1 and 300 cm");
    return n;
  }],
  anthropometricWeightKg: [required(), isPositiveInt("Weight must be a positive integer"), (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    if (n < 1 || n > 700) throw new ValidationFieldError("Weight must be between 1 and 700 kg");
    return n;
  }],
  maritalStatus: [required(), inEnum(MaritalStatus)],
  maritalStatusOther: [isString(), trim(), maxLen(128), (v: unknown, all: Record<string, unknown>) => {
    if (all.maritalStatus === "OTHER" && (!v || String(v).trim() === "")) {
      throw new ValidationFieldError("Please specify the marital status (Other)");
    }
    return v;
  }],
  education: [required(), inEnum(Education)],
  educationOther: [isString(), trim(), maxLen(128), (v: unknown, all: Record<string, unknown>) => {
    if (all.education === "OTHERS" && (!v || String(v).trim() === "")) {
      throw new ValidationFieldError("Please specify the education (Other)");
    }
    return v;
  }],
  occupation: [isString(), trim(), maxLen(128)],
  status: [inEnum(RegistrationStatus)],
  formCompletedBy: [required(), isString(), trim(), maxLen(255), matches(NAME_RE, "Name must contain only letters, spaces, hyphens, or apostrophes")],
  formCompletionDate: [required(), isDate(), notFutureDate()],
  remarks: [isString(), trim(), maxLen(1000)],
  contactNumber: [required(), isString(), trim(), maxLen(15), matches(MOBILE_RE, "Enter a valid 10-digit Indian mobile number")],
  designation: [required(), isString(), trim(), maxLen(128)],
  createdByUserId: [isInt()],
});

export const updateRegistrationValidator = makeValidator({
  referenceNo: [isString(), trim(), maxLen(64)],
  departmentName: [required(), isString(), trim(), maxLen(255)],
  unitNumber: [required(), isString(), trim(), maxLen(32)],
  dateOfReporting: [required(), isDate(), notFutureDate()],
  caseRegisteredThrough: [required(), inEnum(CaseThrough)],
  caseRegisteredThroughOther: [isString(), trim(), maxLen(128), (v: unknown, all: Record<string, unknown>) => {
    if (all.caseRegisteredThrough === "OTHER" && (!v || String(v).trim() === "")) {
      throw new ValidationFieldError("Please specify the case registered through (Other)");
    }
    return v;
  }],
  referralType: [required(), inEnum(ReferralType)],
  referralFacilityName: [isString(), trim(), maxLen(255)],
  referralFacilityCity: [isString(), trim(), maxLen(64)],
  referralFacilityDistrict: [isString(), trim(), maxLen(64)],
  referralFacilityPincode: [isString(), trim(), maxLen(6), (v: unknown) => {
    if (v === undefined || v === null || v === "") return v;
    if (!PIN_RE.test(String(v))) throw new ValidationFieldError("must be a 6-digit Indian PIN code");
    return v;
  }],
  referralFacilityHospitalLabNh: [isString(), trim(), maxLen(255)],
  referralFacilityRegDate: [isDate(), notFutureDate()],
  dateOfFirstDiagnosis: [required(), isDate(), notFutureDate()],
  microscopicConfirmationLater: [required(), isBoolean()],
  anthropometricHeightCm: [required(), isPositiveInt("Height must be a positive integer"), (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    if (n < 1 || n > 300) throw new ValidationFieldError("Height must be between 1 and 300 cm");
    return n;
  }],
  anthropometricWeightKg: [required(), isPositiveInt("Weight must be a positive integer"), (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    if (n < 1 || n > 700) throw new ValidationFieldError("Weight must be between 1 and 700 kg");
    return n;
  }],
  maritalStatus: [required(), inEnum(MaritalStatus)],
  maritalStatusOther: [isString(), trim(), maxLen(128), (v: unknown, all: Record<string, unknown>) => {
    if (all.maritalStatus === "OTHER" && (!v || String(v).trim() === "")) {
      throw new ValidationFieldError("Please specify the marital status (Other)");
    }
    return v;
  }],
  education: [required(), inEnum(Education)],
  educationOther: [isString(), trim(), maxLen(128), (v: unknown, all: Record<string, unknown>) => {
    if (all.education === "OTHERS" && (!v || String(v).trim() === "")) {
      throw new ValidationFieldError("Please specify the education (Other)");
    }
    return v;
  }],
  occupation: [isString(), trim(), maxLen(128)],
  status: [inEnum(RegistrationStatus)],
  formCompletedBy: [required(), isString(), trim(), maxLen(255), matches(NAME_RE, "Name must contain only letters, spaces, hyphens, or apostrophes")],
  formCompletionDate: [required(), isDate(), notFutureDate()],
  remarks: [isString(), trim(), maxLen(1000)],
  contactNumber: [required(), isString(), trim(), maxLen(15), matches(MOBILE_RE, "Enter a valid 10-digit Indian mobile number")],
  designation: [required(), isString(), trim(), maxLen(128)],
});
