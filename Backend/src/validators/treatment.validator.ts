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
import { isDate, inEnum, isString, makeValidator, maxLen, required, trim } from "./common.ts";

export const createTreatmentValidator = makeValidator({
  treatmentStage: [required(), inEnum(TreatmentStage)],
  treatmentGivenChoice: [inEnum(YesNoUnknown)],
  treatmentType: [inEnum(TreatmentType)],
  clinicalExtentOfDisease: [inEnum(ClinicalExtent)],
  stagingSystem: [inEnum(StagingSystem)],
  tnmT: [isString(), trim(), maxLen(8)],
  tnmN: [isString(), trim(), maxLen(8)],
  tnmM: [isString(), trim(), maxLen(8)],
  compositeStage: [isString(), trim(), maxLen(16)],
  ecogStatus: [inEnum(EcogStatus)],
  ecogGrade: [inEnum(EcogGrade)],
  targetedTherapyType: [inEnum(TargetedTherapy)],
  targetedTherapyOtherSpecify: [isString(), trim(), maxLen(255)],
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
