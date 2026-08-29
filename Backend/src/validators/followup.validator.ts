import {
  DeathInfoSource,
  DiseaseStatus,
  FollowUpMethod,
  FollowUpModality,
  PlaceOfDeath,
  TreatmentType,
  VitalStatus,
} from "../../generated/prisma/enums.ts";
import {
  inEnum,
  isBoolean,
  isDate,
  isPositiveInt,
  isString,
  makeValidator,
  maxLen,
  required,
  trim,
  ValidationFieldError,
  type ValidatorRule,
} from "./common.ts";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Accepts an optional "YYYY-MM-DD" value and returns a UTC `Date` (or
 * undefined when absent) — mirrors the shared `isDate()` helper but usable
 * inside a custom cross-field rule.
 */
function optionalDate(v: unknown, field: string): Date | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string" || !DATE_ONLY_RE.test(v)) {
    throw new ValidationFieldError(`${field} must be a valid ISO date (YYYY-MM-DD)`);
  }
  const d = new Date(v + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) {
    throw new ValidationFieldError(`${field} must be a valid ISO date (YYYY-MM-DD)`);
  }
  return d;
}

/** `required()` but only when `when(all)` is true; otherwise the field is dropped. */
function requireWhen(
  when: (all: Record<string, unknown>) => boolean,
  msg: string,
): ValidatorRule<Record<string, unknown>> {
  return (v, all) => {
    if (!when(all)) return undefined;
    return required(msg)(v);
  };
}

/**
 * Validates the `treatments` array (modality rows). Only runs when
 * `treatmentGiven === true`; otherwise the field is dropped entirely so
 * nothing irrelevant is stored. Each row keeps startDate and — except for
 * Surgery — endDate. Surgery deliberately never stores an end date.
 */
const validateTreatments: ValidatorRule<Record<string, unknown>> = (v, all) => {
  if (all.treatmentGiven !== true) return undefined;
  if (!Array.isArray(v)) {
    throw new ValidationFieldError("must be a list of treatment modalities");
  }
  if (v.length === 0) {
    throw new ValidationFieldError("select at least one treatment modality when treatment is given");
  }
  const allowedModalities = new Set(Object.values(FollowUpModality));
  return v.map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const modality = item.modality;
    if (typeof modality !== "string" || !allowedModalities.has(modality)) {
      throw new ValidationFieldError("contains an invalid treatment modality");
    }
    const row: Record<string, unknown> = { modality };
    const start = optionalDate(item.startDate, "startDate");
    if (start) row.startDate = start;
    if (modality !== "SURGERY") {
      const end = optionalDate(item.endDate, "endDate");
      if (end) row.endDate = end;
    }
    return row;
  });
};

/**
 * Body validator for POST /api/followups. Cross-field rules enforce the
 * printed form's conditions and strip inapplicable fields BEFORE they reach
 * the database:
 *
 *   - diseaseStatus / treatment only when method = Hospital visit
 *   - dateOfFirstRecurrence only when diseaseStatus = 5 (progression/recurrence)
 *   - death section only when vitalStatus = Dead
 *   - sourceOfDeathInfo only when placeOfDeath = 8 (Others)
 *   - cause-of-death text only when placeOfDeath = 1 (Reporting Institution)
 *
 * Rule order matters: every `when(...)` reads a field that appears earlier
 * in the schema below.
 */
export const createFollowUpValidator = makeValidator({
  registrationId: [required(), isPositiveInt()],
  dateOfFollowUp: [required(), isDate()],
  methodOfFollowUp: [required(), inEnum(FollowUpMethod)],
  vitalStatus: [required(), inEnum(VitalStatus)],

  // Section 4 — disease status (hospital visit only).
  diseaseStatus: [
    requireWhen((all) => all.methodOfFollowUp === "HOSPITAL_VISIT", "is required when Method is Hospital visit"),
    inEnum(DiseaseStatus),
  ],
  dateOfFirstRecurrence: [
    requireWhen(
      (all) => all.diseaseStatus === "CANCER_PROGRESSION_RECURRENCE",
      "is required when Disease Status is Cancer in Progression/Recurrence",
    ),
    (v) => optionalDate(v, "dateOfFirstRecurrence"),
  ],

  // Section 5 — treatment (hospital visit only).
  treatmentGiven: [
    requireWhen((all) => all.methodOfFollowUp === "HOSPITAL_VISIT", "is required when Method is Hospital visit"),
    isBoolean(),
  ],
  treatmentType: [
    requireWhen((all) => all.treatmentGiven === true, "is required when Treatment is Yes"),
    inEnum(TreatmentType),
  ],
  treatments: [validateTreatments],

  // Section 6-11 — death details (dead only).
  dateOfDeath: [
    requireWhen((all) => all.vitalStatus === "DEAD", "is required when Vital Status is Dead"),
    isDate(),
  ],
  placeOfDeath: [
    requireWhen((all) => all.vitalStatus === "DEAD", "is required when Vital Status is Dead"),
    inEnum(PlaceOfDeath),
  ],
  sourceOfDeathInfo: [
    requireWhen((all) => all.placeOfDeath === "OTHERS", "is required when Place of Death is Others"),
    inEnum(DeathInfoSource),
  ],
  causeIa: [
    (v, all) => (all.placeOfDeath === "RI" ? isString()(v) : undefined),
    trim(),
    maxLen(255),
  ],
  causeIb: [
    (v, all) => (all.placeOfDeath === "RI" ? isString()(v) : undefined),
    trim(),
    maxLen(255),
  ],
  causeIc: [
    (v, all) => (all.placeOfDeath === "RI" ? isString()(v) : undefined),
    trim(),
    maxLen(255),
  ],
  causeIi: [
    (v, all) => (all.placeOfDeath === "RI" ? isString()(v) : undefined),
    trim(),
    maxLen(255),
  ],
  icd10Ucod: [
    (v, all) => (all.vitalStatus === "DEAD" ? isString()(v) : undefined),
    trim(),
    maxLen(16),
  ],
  majorCauseGroupUcod: [
    (v, all) => (all.vitalStatus === "DEAD" ? isString()(v) : undefined),
    trim(),
    maxLen(128),
  ],

  // Section 12-13 — form completion (always applicable).
  formCompletedBy: [isString(), trim(), maxLen(255)],
  dateOfCompletion: [isDate()],
});

/** Query validator for the follow-up patient search (all optional). */
export const searchFollowUpValidator = makeValidator({
  referenceNo: [isString(), trim(), maxLen(64)],
  hbcrRegNo: [isString(), trim(), maxLen(20)],
  aadhaar: [isString(), trim(), maxLen(32)],
  phone: [isString(), trim(), maxLen(15)],
});
