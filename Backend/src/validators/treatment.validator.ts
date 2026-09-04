import {
  ClinicalExtent,
  EcogGrade,
  EcogStatus,
  Intention,
  Role,
  StagingSystem,
  TargetedTherapy,
  TreatmentDetail,
  TreatmentModality,
  TreatmentStage,
  TreatmentType,
  YesNoUnknown,
} from "../../generated/prisma/enums.ts";
import { isDate, inEnum, isString, makeValidator, maxLen, required, trim, ValidationFieldError } from "./common.ts";
import type { ValidatorRule } from "./common.ts";

/**
 * Conditional required: field is mandatory only when stagingSystem is TNM.
 */
const requiredIfTNM = (
  msg: string,
): ValidatorRule<Record<string, unknown>> => (v, all) => {
  if (all.stagingSystem !== "TNM") return v;
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
    throw new ValidationFieldError(msg);
  }
  return v;
};

/**
 * Conditional required: field is mandatory only when treatmentGivenChoice is YES.
 */
const requiredIfYes = (
  msg: string,
): ValidatorRule<Record<string, unknown>> => (v, all) => {
  if (all.treatmentGivenChoice !== "YES") return v;
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
    throw new ValidationFieldError(msg);
  }
  return v;
};

/**
 * Conditional required: ECOG grade is mandatory when ecogStatus is KNOWN.
 */
const requiredIfKnown = (
  msg: string,
): ValidatorRule<Record<string, unknown>> => (v, all) => {
  if (all.ecogStatus !== "KNOWN") return v;
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
    throw new ValidationFieldError(msg);
  }
  return v;
};

/**
 * Conditional required: treatmentType is mandatory when treatmentStage is AT_RI.
 */
const requiredIfAT_RI = (
  msg: string,
): ValidatorRule<Record<string, unknown>> => (v, all) => {
  if (all.treatmentStage !== "AT_RI") return v;
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
    throw new ValidationFieldError(msg);
  }
  return v;
};

export const createTreatmentValidator = makeValidator({
  treatmentStage: [required(), inEnum(TreatmentStage)],
  treatmentGivenChoice: [required(), inEnum(YesNoUnknown)],
  treatmentType: [
    requiredIfYes("Treatment Type is required when Treatment Given is Yes"),
    requiredIfAT_RI("Treatment Type is required for Treatment at RI"),
    inEnum(TreatmentType),
  ],
  clinicalExtentOfDisease: [inEnum(ClinicalExtent)],
  stagingSystem: [inEnum(StagingSystem)],
  stagingSystemValue: [isString(), trim(), maxLen(512)],
  tnmT: [
    requiredIfTNM("T is required when staging system is TNM"),
    isString(), trim(), maxLen(16),
  ],
  tnmN: [
    requiredIfTNM("N is required when staging system is TNM"),
    isString(), trim(), maxLen(16),
  ],
  tnmM: [
    requiredIfTNM("M is required when staging system is TNM"),
    isString(), trim(), maxLen(16),
  ],
  compositeStage: [required(), isString(), trim(), maxLen(256)],
  ecogStatus: [inEnum(EcogStatus)],
  ecogGrade: [
    requiredIfKnown("ECOG Grade is required when Performance Status is Known"),
    inEnum(EcogGrade),
  ],
  targetedTherapyType: [inEnum(TargetedTherapy)],
  targetedTherapyOtherSpecify: [
    (v, all) => {
      if (all.targetedTherapyType !== "OTHERS_SPECIFY") return v;
      if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
        throw new ValidationFieldError("Please specify the Targeted Therapy (Others)");
      }
      return v;
    },
    isString(), trim(), maxLen(255),
  ],
});

export const updateTreatmentValidator = createTreatmentValidator;

export const createTreatmentModalityValidator = makeValidator({
  modality: [required(), inEnum(TreatmentModality)],
  isSelected: [],
  intentionToTreat: [inEnum(Intention)],
  role: [inEnum(Role)],
  details: [inEnum(TreatmentDetail)],
  startDate: [isDate()],
  endDate: [isDate()],
  othersSpecify: [isString(), trim(), maxLen(255)],
});

export const updateTreatmentModalityValidator = makeValidator({
  isSelected: [],
  intentionToTreat: [inEnum(Intention)],
  role: [inEnum(Role)],
  details: [inEnum(TreatmentDetail)],
  startDate: [isDate()],
  endDate: [isDate()],
  othersSpecify: [isString(), trim(), maxLen(255)],
});
