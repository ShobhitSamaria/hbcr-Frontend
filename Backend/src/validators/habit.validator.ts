import {
  Habit,
  YesNoUnknown,
} from "../../generated/prisma/enums.ts";
import {
  inEnum,
  isPositiveInt,
  makeValidator,
  required,
  ValidationFieldError,
} from "./common.ts";

const positiveDurationRule = (v: unknown, all: Record<string, unknown>) => {
  if (v === undefined || v === null || String(v).trim() === "") {
    if (String(all.answer).toUpperCase() === "YES") {
      throw new ValidationFieldError("Duration (Months) is required when Yes is selected");
    }
    return v;
  }
  return isPositiveInt("must be a positive whole number (minimum 1)")(v);
};

export const createHabitValidator = makeValidator({
  habit: [required(), inEnum(Habit)],
  answer: [inEnum(YesNoUnknown)],
  durationMonths: [positiveDurationRule],
});

export const updateHabitValidator = makeValidator({
  answer: [inEnum(YesNoUnknown)],
  durationMonths: [positiveDurationRule],
});
