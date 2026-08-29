import { isInt, isString, makeValidator, maxLen, required, trim } from "./common.ts";

/**
 * Validates the non-JSON fields of a draft save request.
 * `formData` is a free-form JSON object — validated at the service level only.
 * `patientName` is required so drafts always have a visible name.
 */
export const saveDraftValidator = makeValidator({
  id: [isInt("must be a number")],
  formData: [required()],
  currentStep: [required(), isInt("must be a number")],
  patientName: [required("Patient Name is required for draft"), isString(), trim(), maxLen(256)],
});
