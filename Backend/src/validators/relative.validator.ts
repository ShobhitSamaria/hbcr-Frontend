import {
  Relationship,
} from "../../generated/prisma/enums.ts";
import {
  inEnum,
  isString,
  makeValidator,
  matches,
  maxLen,
  required,
  trim,
} from "./common.ts";

const MOBILE_RE = /^[6-9][0-9]{9}$/;

export const createRelativeValidator = makeValidator({
  relationship: [required(), inEnum(Relationship)],
  name: [isString(), trim(), maxLen(255)],
  mobileNumber: [
    isString(),
    trim(),
    matches(MOBILE_RE, "must be a 10-digit Indian mobile number"),
  ],
});

export const updateRelativeValidator = makeValidator({
  name: [isString(), trim(), maxLen(255)],
  mobileNumber: [
    isString(),
    trim(),
    matches(MOBILE_RE, "must be a 10-digit Indian mobile number"),
  ],
});
