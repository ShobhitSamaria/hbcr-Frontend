import {
  FamDegree,
  FamPrimarySite,
  FamRelationship,
  YesNoUnknown,
} from "../../generated/prisma/enums.ts";
import { isDate, inEnum, isSmallInt, isString, makeValidator, required, trim } from "./common.ts";

export const createFamilyHistoryValidator = makeValidator({
  familyHistory: [required(), inEnum(YesNoUnknown, "must be yes/no/unknown")],
  relationshipWithCancer: [inEnum(FamRelationship)],
  degreeOfRelationship: [inEnum(FamDegree)],
  primarySite: [inEnum(FamPrimarySite)],
  ageAtDiagnosis: [isSmallInt("must be a whole number")],
  dateOfDiagnosis: [isDate()],
});

export const updateFamilyHistoryValidator = makeValidator({
  familyHistory: [inEnum(YesNoUnknown)],
  relationshipWithCancer: [inEnum(FamRelationship)],
  degreeOfRelationship: [inEnum(FamDegree)],
  primarySite: [inEnum(FamPrimarySite)],
  ageAtDiagnosis: [isSmallInt("must be a whole number")],
  dateOfDiagnosis: [isDate()],
});

// Helper to inline into the registration create flow when needed
export const familyHistoryEmbeddedValidator = createFamilyHistoryValidator;
