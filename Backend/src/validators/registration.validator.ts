import {
  CaseThrough,
  Education,
  MaritalStatus,
  ReferralType,
  RegistrationStatus,
} from "../../generated/prisma/enums.ts";
import { inEnum, isBoolean, isDate, isInt, isNumber, isString, makeValidator, matches, maxLen, notFutureDate, required, trim, ValidationFieldError } from "./common.ts";

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
  departmentName: [required(), isString(), trim(), maxLen(128)],
  unitNumber: [required(), isString(), trim(), maxLen(32)],
  dateOfReporting: [isDate()],
  caseRegisteredThrough: [inEnum(CaseThrough)],
  caseRegisteredThroughOther: [isString(), trim(), maxLen(128), (v: unknown, all: Record<string, unknown>) => {
    if (all.caseRegisteredThrough === "OTHER" && (!v || String(v).trim() === "")) {
      throw new ValidationFieldError("Please specify the case registered through (Other)");
    }
    return v;
  }],
  referralType: [inEnum(ReferralType)],
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
  dateOfFirstDiagnosis: [isDate(), notFutureDate()],
  microscopicConfirmationLater: [isBoolean()],
  anthropometricHeightCm: [isNumber("must be a number"), positiveNumber(0, "Height must be greater than 0")],
  anthropometricWeightKg: [isNumber("must be a number"), positiveNumber(0, "Weight must be greater than 0")],
  maritalStatus: [inEnum(MaritalStatus)],
  maritalStatusOther: [isString(), trim(), maxLen(128), (v: unknown, all: Record<string, unknown>) => {
    if (all.maritalStatus === "OTHER" && (!v || String(v).trim() === "")) {
      throw new ValidationFieldError("Please specify the marital status (Other)");
    }
    return v;
  }],
  education: [inEnum(Education)],
  educationOther: [isString(), trim(), maxLen(128)],
  occupation: [isString(), trim(), maxLen(128)],
  status: [inEnum(RegistrationStatus)],
  formCompletedBy: [isString(), trim(), maxLen(255)],
  formCompletionDate: [isDate()],
  remarks: [isString(), trim(), maxLen(1000)],
  contactNumber: [isString(), trim(), maxLen(15)],
  designation: [isString(), trim(), maxLen(128)],
  createdByUserId: [isInt()],
});

export const updateRegistrationValidator = makeValidator({
  referenceNo: [isString(), trim(), maxLen(64)],
  departmentName: [required(), isString(), trim(), maxLen(128)],
  unitNumber: [required(), isString(), trim(), maxLen(32)],
  dateOfReporting: [isDate()],
  caseRegisteredThrough: [inEnum(CaseThrough)],
  caseRegisteredThroughOther: [isString(), trim(), maxLen(128), (v: unknown, all: Record<string, unknown>) => {
    if (all.caseRegisteredThrough === "OTHER" && (!v || String(v).trim() === "")) {
      throw new ValidationFieldError("Please specify the case registered through (Other)");
    }
    return v;
  }],
  referralType: [inEnum(ReferralType)],
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
  dateOfFirstDiagnosis: [isDate(), notFutureDate()],
  microscopicConfirmationLater: [isBoolean()],
  anthropometricHeightCm: [isNumber("must be a number"), positiveNumber(0, "Height must be greater than 0")],
  anthropometricWeightKg: [isNumber("must be a number"), positiveNumber(0, "Weight must be greater than 0")],
  maritalStatus: [inEnum(MaritalStatus)],
  maritalStatusOther: [isString(), trim(), maxLen(128), (v: unknown, all: Record<string, unknown>) => {
    if (all.maritalStatus === "OTHER" && (!v || String(v).trim() === "")) {
      throw new ValidationFieldError("Please specify the marital status (Other)");
    }
    return v;
  }],
  education: [inEnum(Education)],
  educationOther: [isString(), trim(), maxLen(128)],
  occupation: [isString(), trim(), maxLen(128)],
  status: [inEnum(RegistrationStatus)],
  formCompletedBy: [isString(), trim(), maxLen(255)],
  formCompletionDate: [isDate()],
  remarks: [isString(), trim(), maxLen(1000)],
  contactNumber: [isString(), trim(), maxLen(15)],
  designation: [isString(), trim(), maxLen(128)],
});
