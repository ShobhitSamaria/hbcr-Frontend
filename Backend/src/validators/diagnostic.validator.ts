import { DiagnosticMethodKind } from "../../generated/prisma/enums.ts";
import { isDate, inEnum, isBoolean, isString, makeValidator, maxLen, required, trim } from "./common.ts";

export const createDiagnosticMethodValidator = makeValidator({
  method: [required(), inEnum(DiagnosticMethodKind)],
  clinicalOnlyDate: [isDate()],
});

export const updateDiagnosticMethodValidator = makeValidator({
  clinicalOnlyDate: [isDate()],
});

export const createDiagnosticProcedureValidator = makeValidator({
  procedureName: [required(), isString(), trim(), maxLen(128)],
  isOthers: [isBoolean()],
  othersSpecify: [isString(), trim(), maxLen(255)],
  procedureDate: [isDate()],
});

export const updateDiagnosticProcedureValidator = makeValidator({
  procedureName: [isString(), trim(), maxLen(128)],
  isOthers: [isBoolean()],
  othersSpecify: [isString(), trim(), maxLen(255)],
  procedureDate: [isDate()],
});
