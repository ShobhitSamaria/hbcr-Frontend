import {
  FamDegree,
  FamPrimarySite,
  FamRelationship,
  YesNoUnknown,
} from "../../generated/prisma/enums.ts";
import { isDate, inEnum, isSmallInt, isString, makeValidator, required, trim, ValidationFieldError } from "./common.ts";
import type { ValidatorRule } from "./common.ts";

/**
 * Conditional required: field is mandatory only when familyHistory is YES.
 */
const requiredIfYes = (msg: string): ValidatorRule<Record<string, unknown>> => (v, all) => {
  if (all.familyHistory === "YES") {
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
      throw new ValidationFieldError(msg);
    }
  }
  return v;
};

/**
 * Conditional enum: only validates when familyHistory is YES; otherwise passes through.
 */
const enumIfYes = <T extends Record<string, string>>(
  enumObj: T,
  msg?: string,
): ValidatorRule<Record<string, unknown>> => (v, all) => {
  if (all.familyHistory !== "YES") return undefined;
  return inEnum(enumObj, msg)(v, all);
};

/**
 * Conditional small int: only validates when familyHistory is YES.
 */
const smallIntIfYes = (
  msg: string,
): ValidatorRule<Record<string, unknown>> => (v, all) => {
  if (all.familyHistory !== "YES") return undefined;
  return isSmallInt(msg)(v, all);
};

/**
 * Conditional date: only validates when familyHistory is YES.
 */
const dateIfYes = (
  msg?: string,
): ValidatorRule<Record<string, unknown>> => (v, all) => {
  if (all.familyHistory !== "YES") return undefined;
  return isDate(msg)(v, all);
};

export const createFamilyHistoryValidator = makeValidator<Record<string, unknown>>({
  familyHistory: [required(), inEnum(YesNoUnknown, "must be yes/no/unknown")],
  relationshipWithCancer: [
    requiredIfYes("Relationship with Cancer is required when family history is Yes"),
    enumIfYes(FamRelationship),
  ],
  degreeOfRelationship: [
    requiredIfYes("Degree of Relationship is required when family history is Yes"),
    enumIfYes(FamDegree),
  ],
  primarySite: [
    requiredIfYes("Primary Site is required when family history is Yes"),
    enumIfYes(FamPrimarySite),
  ],
  ageAtDiagnosis: [
    requiredIfYes("Age at Diagnosis is required when family history is Yes"),
    smallIntIfYes("must be a whole number"),
  ],
  dateOfDiagnosis: [
    requiredIfYes("Date of Diagnosis is required when family history is Yes"),
    dateIfYes(),
  ],
});

export const updateFamilyHistoryValidator = makeValidator<Record<string, unknown>>({
  familyHistory: [inEnum(YesNoUnknown)],
  relationshipWithCancer: [inEnum(FamRelationship)],
  degreeOfRelationship: [inEnum(FamDegree)],
  primarySite: [inEnum(FamPrimarySite)],
  ageAtDiagnosis: [isSmallInt("must be a whole number")],
  dateOfDiagnosis: [isDate()],
});

// Helper to inline into the registration create flow when needed
export const familyHistoryEmbeddedValidator = createFamilyHistoryValidator;
