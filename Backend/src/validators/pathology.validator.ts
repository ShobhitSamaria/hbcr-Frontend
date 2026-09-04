import {
  HistologicalGrade,
  Laterality,
  PairedLaterality,
  Sequence,
} from "../../generated/prisma/enums.ts";
import {
  inEnum,
  isDate,
  isString,
  makeValidator,
  maxLen,
  trim,
  ValidationFieldError,
} from "./common.ts";
import type { ValidatorRule } from "./common.ts";

/**
 * Validates longest_symptom_duration_months as integer in [1, 1200].
 */
const symptomDurationRange: ValidatorRule<Record<string, unknown>> = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 1200)
    throw new ValidationFieldError("Must be between 1 and 1200 months");
  return n;
};

export const createPathologyValidator = makeValidator({
  longestSymptomDurationMonths: [symptomDurationRange],
  anatomicalSite: [isString(), trim(), maxLen(128)],
  pathologySlideNo: [isString(), trim(), maxLen(64)],
  primaryTumorSite: [isString(), trim(), maxLen(128)],
  morphology: [isString(), trim(), maxLen(128)],
  icdoTopography: [isString(), trim(), maxLen(64)],
  topographySite: [isString(), trim(), maxLen(128)],
  icdoMorphology: [isString(), trim(), maxLen(64)],
  histologyMorphology: [isString(), trim(), maxLen(128)],
  morphologyGrade: [inEnum(HistologicalGrade)],
  secondarySite: [isString(), trim(), maxLen(128)],
  secondarySiteCode: [isString(), trim(), maxLen(64)],
  metastasisMorphology: [isString(), trim(), maxLen(128)],
  metastasisMorphologyCode: [isString(), trim(), maxLen(64)],
  metastasisMorphologyGrade: [inEnum(HistologicalGrade)],
  icd10Site: [isString(), trim(), maxLen(64)],
  laterality: [inEnum(Laterality)],
  pairedLaterality: [inEnum(PairedLaterality)],
  sequence: [inEnum(Sequence)],
  pathologyDateOfReporting: [isDate()],
});

export const updatePathologyValidator = makeValidator({
  longestSymptomDurationMonths: [symptomDurationRange],
  anatomicalSite: [isString(), trim(), maxLen(128)],
  pathologySlideNo: [isString(), trim(), maxLen(64)],
  primaryTumorSite: [isString(), trim(), maxLen(128)],
  morphology: [isString(), trim(), maxLen(128)],
  icdoTopography: [isString(), trim(), maxLen(64)],
  topographySite: [isString(), trim(), maxLen(128)],
  icdoMorphology: [isString(), trim(), maxLen(64)],
  histologyMorphology: [isString(), trim(), maxLen(128)],
  morphologyGrade: [inEnum(HistologicalGrade)],
  secondarySite: [isString(), trim(), maxLen(128)],
  secondarySiteCode: [isString(), trim(), maxLen(64)],
  metastasisMorphology: [isString(), trim(), maxLen(128)],
  metastasisMorphologyCode: [isString(), trim(), maxLen(64)],
  metastasisMorphologyGrade: [inEnum(HistologicalGrade)],
  icd10Site: [isString(), trim(), maxLen(64)],
  laterality: [inEnum(Laterality)],
  pairedLaterality: [inEnum(PairedLaterality)],
  sequence: [inEnum(Sequence)],
  pathologyDateOfReporting: [isDate()],
});
