import type {
  DeathInfoSource,
  DiseaseStatus,
  FollowUpMethod,
  FollowUpModality,
  PlaceOfDeath,
  VitalStatus,
} from "@/lib/api";

/**
 * Option lists for the Follow-up form. `value` is the stored enum member
 * (backend contract); `label` is the printed-form text including the code
 * number shown on the form (e.g. "2 Post/email").
 */
export const FOLLOW_UP_METHOD_OPTIONS: { value: FollowUpMethod; label: string }[] = [
  { value: "HOSPITAL_VISIT", label: "1 Hospital visit" },
  { value: "POST_EMAIL", label: "2 Post/email" },
  { value: "TELEPHONE", label: "3 Telephone" },
  { value: "HOUSE_VISIT", label: "4 House Visit" },
  { value: "PUBLIC_DATABASE", label: "5 Public Database" },
  { value: "SPECIAL_SURVEY_STUDY", label: "6 Special survey/study" },
  { value: "OTHERS", label: "8 Others" },
];

export const VITAL_STATUS_OPTIONS: { value: VitalStatus; label: string }[] = [
  { value: "ALIVE", label: "1 Alive" },
  { value: "DEAD", label: "2 Dead" },
  { value: "UNKNOWN", label: "9 Unknown" },
];

export const DISEASE_STATUS_OPTIONS: { value: DiseaseStatus; label: string }[] = [
  { value: "NO_EVIDENCE_OF_DISEASE", label: "1 No Evidence of Disease" },
  {
    value: "NED_SECOND_PRIMARY_PRESENT",
    label: "2 No Evidence of Disease but Second Primary Present",
  },
  {
    value: "NED_OTHER_ILLNESS",
    label: "3 No Evidence of Disease but other illness/conditions present",
  },
  { value: "CANCER_REGRESSION_RESIDUAL", label: "4 Cancer in Regression / Residual Disease" },
  { value: "CANCER_PROGRESSION_RECURRENCE", label: "5 Cancer in Progression / Recurrence" },
  { value: "TOO_ADVANCED_CACHEXIA", label: "6 Too Advanced / Cachexia" },
  {
    value: "NED_ON_CHEMO_HORMONAL",
    label: "7 No evidence of disease but on chemo/hormonal therapy",
  },
  { value: "OTHERS", label: "8 Others" },
  { value: "UNKNOWN", label: "9 Unknown" },
];

export const TREATMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "ALLOPATHIC", label: "a. Allopathic" },
  { value: "NON_ALLOPATHIC", label: "b. Non-Allopathic" },
  { value: "BOTH", label: "c. Both" },
];

export const PLACE_OF_DEATH_OPTIONS: { value: PlaceOfDeath; label: string }[] = [
  { value: "RI", label: "1 At Reporting Institution (RI)" },
  { value: "OTHER_HOSPITAL", label: "2 Other hospital" },
  { value: "RESIDENCE", label: "3 Residence" },
  { value: "OTHERS", label: "8 Others" },
  { value: "UNKNOWN", label: "9 Not available/Unknown" },
];

export const DEATH_INFO_SOURCE_OPTIONS: { value: DeathInfoSource; label: string }[] = [
  { value: "CIVIL_REGISTRATION", label: "1 Civil registration system" },
  { value: "BURIAL_CREMATION", label: "2 Burial/cremation record" },
  { value: "VOTER_LIST", label: "3 Voter list" },
  { value: "AADHAAR", label: "4 Aadhaar" },
  { value: "CENSUS", label: "5 Census" },
  {
    value: "ABDM",
    label: "6 Ayushman Bharat Digital Mission database",
  },
  { value: "OTHERS", label: "8 Others" },
  { value: "UNKNOWN", label: "9 Not available/Unknown" },
];

export const FOLLOW_UP_MODALITIES: { value: FollowUpModality; label: string }[] = [
  { value: "SURGERY", label: "Surgery" },
  { value: "RADIOTHERAPY", label: "Radiotherapy" },
  { value: "CHEMOTHERAPY", label: "Chemotherapy" },
  { value: "HORMONE_THERAPY", label: "Hormone Therapy" },
  { value: "TARGETED_THERAPY", label: "Targeted Therapy" },
  { value: "OTHERS", label: "Others" },
];

/** Look up the printed label for a stored enum value; falls back to "—". */
export function optionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T | null | undefined,
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}
