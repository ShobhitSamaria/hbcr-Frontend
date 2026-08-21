import {
  CaseThrough,
  Education,
  MaritalStatus,
  ReferralType,
  RegistrationStatus,
} from "../../generated/prisma/enums.ts";
import { inEnum, isBoolean, isDate, isInt, isNumber, isString, makeValidator, matches, maxLen, required, trim } from "./common.ts";

// HBCR-2024-0185 style: HBCR-YYYY-NNNNN or HBCR-YYYY-NNNN
const HBCR_RE = /^HBCR-\d{4}-\d{4,5}$/;
const PIN_RE = /^[1-9][0-9]{5}$/;

export const HBCR_REGISTRATION_NO_REGEX = HBCR_RE;

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
  departmentName: [isString(), trim(), maxLen(128)],
  unitNumber: [isString(), trim(), maxLen(32)],
  hospitalRegistrationNo: [isString(), trim(), maxLen(64)],
  hospitalRegistrationNoType: [isString(), trim(), maxLen(64)],
  dateOfReporting: [isDate()],
  caseRegisteredThrough: [inEnum(CaseThrough)],
  caseRegisteredThroughOther: [isString(), trim(), maxLen(128)],
  referralType: [inEnum(ReferralType)],
  referralFacilityName: [isString(), trim(), maxLen(255)],
  referralFacilityCity: [isString(), trim(), maxLen(64)],
  referralFacilityDistrict: [isString(), trim(), maxLen(64)],
  referralFacilityPincode: [isString(), trim(), maxLen(6), matches(PIN_RE, "must be a 6-digit Indian PIN code")],
  referralFacilityHospitalLabNh: [isString(), trim(), maxLen(255)],
  referralFacilityRegDate: [isDate()],
  dateOfFirstDiagnosis: [isDate()],
  microscopicConfirmationLater: [isBoolean()],
  anthropometricHeightCm: [isNumber("must be a number")],
  anthropometricWeightKg: [isNumber("must be a number")],
  maritalStatus: [inEnum(MaritalStatus)],
  maritalStatusOther: [isString(), trim(), maxLen(128)],
  education: [inEnum(Education)],
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
  departmentName: [isString(), trim(), maxLen(128)],
  unitNumber: [isString(), trim(), maxLen(32)],
  hospitalRegistrationNo: [isString(), trim(), maxLen(64)],
  hospitalRegistrationNoType: [isString(), trim(), maxLen(64)],
  dateOfReporting: [isDate()],
  caseRegisteredThrough: [inEnum(CaseThrough)],
  caseRegisteredThroughOther: [isString(), trim(), maxLen(128)],
  referralType: [inEnum(ReferralType)],
  referralFacilityName: [isString(), trim(), maxLen(255)],
  referralFacilityCity: [isString(), trim(), maxLen(64)],
  referralFacilityDistrict: [isString(), trim(), maxLen(64)],
  referralFacilityPincode: [isString(), trim(), maxLen(6), matches(PIN_RE, "must be a 6-digit Indian PIN code")],
  referralFacilityHospitalLabNh: [isString(), trim(), maxLen(255)],
  referralFacilityRegDate: [isDate()],
  dateOfFirstDiagnosis: [isDate()],
  microscopicConfirmationLater: [isBoolean()],
  anthropometricHeightCm: [isNumber("must be a number")],
  anthropometricWeightKg: [isNumber("must be a number")],
  maritalStatus: [inEnum(MaritalStatus)],
  maritalStatusOther: [isString(), trim(), maxLen(128)],
  education: [inEnum(Education)],
  occupation: [isString(), trim(), maxLen(128)],
  status: [inEnum(RegistrationStatus)],
  formCompletedBy: [isString(), trim(), maxLen(255)],
  formCompletionDate: [isDate()],
  remarks: [isString(), trim(), maxLen(1000)],
  contactNumber: [isString(), trim(), maxLen(15)],
  designation: [isString(), trim(), maxLen(128)],
});
