import {
  Laterality,
  PairedLaterality,
  Sequence,
} from "../../generated/prisma/enums.ts";
import {
  inEnum,
  isSmallInt,
  isString,
  makeValidator,
  maxLen,
  trim,
} from "./common.ts";

export const createPathologyValidator = makeValidator({
  longestSymptomDurationMonths: [isSmallInt("must be a whole number")],
  anatomicalSite: [isString(), trim(), maxLen(128)],
  pathologySlideNo: [isString(), trim(), maxLen(64)],
  primaryTumorSite: [isString(), trim(), maxLen(128)],
  morphology: [isString(), trim(), maxLen(128)],
  icdoTopography: [isString(), trim(), maxLen(64)],
  icdoMorphology: [isString(), trim(), maxLen(64)],
  secondarySite: [isString(), trim(), maxLen(128)],
  metastasisMorphology: [isString(), trim(), maxLen(128)],
  icd10Site: [isString(), trim(), maxLen(64)],
  laterality: [inEnum(Laterality)],
  pairedLaterality: [inEnum(PairedLaterality)],
  sequence: [inEnum(Sequence)],
});

export const updatePathologyValidator = makeValidator({
  longestSymptomDurationMonths: [isSmallInt("must be a whole number")],
  anatomicalSite: [isString(), trim(), maxLen(128)],
  pathologySlideNo: [isString(), trim(), maxLen(64)],
  primaryTumorSite: [isString(), trim(), maxLen(128)],
  morphology: [isString(), trim(), maxLen(128)],
  icdoTopography: [isString(), trim(), maxLen(64)],
  icdoMorphology: [isString(), trim(), maxLen(64)],
  secondarySite: [isString(), trim(), maxLen(128)],
  metastasisMorphology: [isString(), trim(), maxLen(128)],
  icd10Site: [isString(), trim(), maxLen(64)],
  laterality: [inEnum(Laterality)],
  pairedLaterality: [inEnum(PairedLaterality)],
  sequence: [inEnum(Sequence)],
});
