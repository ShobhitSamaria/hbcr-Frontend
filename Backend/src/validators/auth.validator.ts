import {
  isString,
  makeValidator,
  maxLen,
  required,
  trim,
} from "./common.ts";

export type LoginInput = {
  username: string;
  password: string;
};

export const validateLogin = makeValidator<LoginInput>({
  username: [
    required("Hospital code / username is required"),
    isString(),
    trim(),
    maxLen(64, "Hospital code / username is too long"),
  ],
  password: [
    required("Password is required"),
    isString(),
    maxLen(128, "Password is too long"),
  ],
});
