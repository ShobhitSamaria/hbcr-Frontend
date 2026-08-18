import {
  AddressType,
  UrbanRural,
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

const PIN_RE = /^[1-9][0-9]{5}$/;
const MOBILE_RE = /^[6-9][0-9]{9}$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const createAddressValidator = makeValidator({
  addressType: [required(), inEnum(AddressType)],
  urbanRural: [inEnum(UrbanRural)],
  wardNo: [isString(), trim(), maxLen(32)],
  flatHouseNo: [isString(), trim(), maxLen(64)],
  streetRoad: [isString(), trim(), maxLen(255)],
  city: [isString(), trim(), maxLen(64)],
  district: [isString(), trim(), maxLen(64)],
  state: [isString(), trim(), maxLen(64)],
  pinCode: [isString(), trim(), maxLen(6), matches(PIN_RE, "must be a 6-digit Indian PIN code")],
  mobileNumber: [
    isString(),
    trim(),
    matches(MOBILE_RE, "must be a 10-digit Indian mobile number"),
  ],
  email: [isString(), trim(), maxLen(255), matches(EMAIL_RE, "must be a valid email")],
});

export const updateAddressValidator = makeValidator({
  urbanRural: [inEnum(UrbanRural)],
  wardNo: [isString(), trim(), maxLen(32)],
  flatHouseNo: [isString(), trim(), maxLen(64)],
  streetRoad: [isString(), trim(), maxLen(255)],
  city: [isString(), trim(), maxLen(64)],
  district: [isString(), trim(), maxLen(64)],
  state: [isString(), trim(), maxLen(64)],
  pinCode: [isString(), trim(), maxLen(6), matches(PIN_RE, "must be a 6-digit Indian PIN code")],
  mobileNumber: [
    isString(),
    trim(),
    matches(MOBILE_RE, "must be a 10-digit Indian mobile number"),
  ],
  email: [isString(), trim(), maxLen(255), matches(EMAIL_RE, "must be a valid email")],
});
