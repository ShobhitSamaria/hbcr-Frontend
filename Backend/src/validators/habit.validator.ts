import {
  Habit,
  YesNoUnknown,
} from "../../generated/prisma/enums.ts";
import {
  inEnum,
  isSmallInt,
  makeValidator,
  required,
} from "./common.ts";

export const createHabitValidator = makeValidator({
  habit: [required(), inEnum(Habit)],
  answer: [inEnum(YesNoUnknown)],
  durationMonths: [isSmallInt("must be a whole number of months")],
});

export const updateHabitValidator = makeValidator({
  answer: [inEnum(YesNoUnknown)],
  durationMonths: [isSmallInt("must be a whole number of months")],
});
