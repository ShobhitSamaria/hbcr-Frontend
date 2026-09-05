import {
  AddressType,
  UrbanRural,
} from "../../generated/prisma/enums.ts";
import {
  inEnum,
  isInt,
  isString,
  makeValidator,
  matches,
  maxLen,
  required,
  trim,
  ValidationFieldError,
} from "./common.ts";

const PIN_RE = /^[1-9][0-9]{5}$/;
const MOBILE_RE = /^[6-9][0-9]{9}$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Duration of Stay: integer in range [0, 150].
 */
const durationStayRange = (v: unknown) => {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 150) {
    throw new ValidationFieldError("Duration of stay must be a whole number between 0 and 150");
  }
  return n;
};

export const createAddressValidator = makeValidator({
  addressType: [required(), inEnum(AddressType)],
  urbanRural: [inEnum(UrbanRural)],
  wardNo: [isString(), trim(), maxLen(32)],
  flatHouseNo: [isString(), trim(), maxLen(64)],
  streetRoad: [isString(), trim(), maxLen(255)],
  city: [isString(), trim(), maxLen(64)],
  district: [required("District is required"), isString(), trim(), maxLen(64)],
  state: [isString(), trim(), maxLen(64)],
  pinCode: [required("PIN code is required"), isString(), trim(), maxLen(6), matches(PIN_RE, "must be a 6-digit Indian PIN code")],
  mobileNumber: [
    isString(),
    trim(),
    matches(MOBILE_RE, "must be a 10-digit Indian mobile number"),
  ],
  email: [isString(), trim(), maxLen(255), matches(EMAIL_RE, "must be a valid email")],
  durationStay: [required("Duration of stay is required"), durationStayRange],
});

export const updateAddressValidator = makeValidator({
  urbanRural: [inEnum(UrbanRural)],
  wardNo: [isString(), trim(), maxLen(32)],
  flatHouseNo: [isString(), trim(), maxLen(64)],
  streetRoad: [isString(), trim(), maxLen(255)],
  city: [isString(), trim(), maxLen(64)],
  district: [required("District is required"), isString(), trim(), maxLen(64)],
  state: [isString(), trim(), maxLen(64)],
  pinCode: [required("PIN code is required"), isString(), trim(), maxLen(6), matches(PIN_RE, "must be a 6-digit Indian PIN code")],
  mobileNumber: [
    isString(),
    trim(),
    matches(MOBILE_RE, "must be a 10-digit Indian mobile number"),
  ],
  email: [isString(), trim(), maxLen(255), matches(EMAIL_RE, "must be a valid email")],
  durationStay: [required("Duration of stay is required"), durationStayRange],
});
