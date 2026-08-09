import {
  Comorbidity,
  YesNoUnknown,
} from "../../generated/prisma/enums.ts";
import {
  inEnum,
  isSmallInt,
  makeValidator,
  required,
} from "./common.ts";

export const createComorbidityValidator = makeValidator({
  comorbidity: [required(), inEnum(Comorbidity)],
  answer: [inEnum(YesNoUnknown)],
  durationMonths: [isSmallInt("must be a whole number of months")],
});

export const updateComorbidityValidator = makeValidator({
  answer: [inEnum(YesNoUnknown)],
  durationMonths: [isSmallInt("must be a whole number of months")],
});
