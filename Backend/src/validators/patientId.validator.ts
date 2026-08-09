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
} from "./common.ts";

export const createPatientIdentificationValidator = makeValidator({
  idType: [required(), inEnum(IdType)],
  number: [required(), isString(), trim(), maxLen(64)],
});

export const updatePatientIdentificationValidator = makeValidator({
  idType: [inEnum(IdType)],
  number: [isString(), trim(), maxLen(64)],
});
