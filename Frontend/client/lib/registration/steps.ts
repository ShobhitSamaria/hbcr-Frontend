/**
 * Helpers for the multi-step registration form.
 */
import { validateStep1 } from "./step1Rules";
import { validateStep2 } from "./step2Rules";
import { validateStep3 } from "./step3Rules";

const STEP_VALIDATORS: Record<number, (v: Record<string, unknown>) => Record<string, string>> = {
  1: validateStep1,
  2: validateStep2,
  3: validateStep3,
};

/**
 * The set of form-state keys each step is responsible for. Used to
 * decide which step to jump to when a backend 422 highlights an
 * individual field.
 */
const STEP_KEYS: Record<number, string[]> = {
  1: [
    "1. Name of the Reporting Institution (RI)",
    "Centre code",
    "1(b).Reference Number",
    "2.Registration Number",
    "3(a). Department name",
    "3(b). Unit number",
    "4. Date of reporting",
    "5. Case Registered Through (Patient’s first reporting at RI)",
    "6. Type of referral",
    "6(a). Name of Facility.",
    "6(b). Hospital / LAB / N.H.",
    "6(c). City",
    "6(d). District",
    "6(e). Pincode",
    "6(f). Date of Registration",
    "7. Date of first diagnosis",
    "First Name",
    "Middle Name",
    "Last Name",
    "9. Date of Birth",
    "10. Age",
    "11. Gender",
    "15. Marital status",
    "16. Education",
    "Occupation",
    "Height (cm)",
    "Weight (kg)",
    "Flat / House No.",
    "Street / Road",
    "City",
    "District",
    "State",
    "PIN Code",
    "Mobile number",
    "Email address",
  ],
  2: [
    "_diagnostic.methods",
    "_diagnostic.clinicalDate",
    "_diagnostic.microscopicLater",
    "20. Longest duration of symptom for cancer (in months)",
    "21(a). Anatomical Site of Specimen / Biopsy / SMEAR",
    "21(b). Pathology Slide No",
    "21(c). Date of Reporting",
    "21(d). Primary Site of Tumour - Topography",
    "21(e). Primary Histology / Morphology",
    "19. Relationship to Cancer / Degree of Relationship",
    "23.1 Site",
    "23.1 Code",
    "23.2 Morphology",
    "23.2 Code",
    "23.2 Grade",
    "23.3 Site",
    "23.3 Code",
    "23.4 Morphology",
    "23.4 Code",
    "23.4 Grade",
    "24. Site of Tumour (ICD-10)",
    "25. Laterality",
    "25. Sequence",
  ],
  3: [
    "26. Clinical Extent of Disease Before Cancer Directed Treatment",
    "27(a). Staging system",
    "T",
    "N",
    "M",
    "27(b). Composite stage",
    "28. Treatment Given Prior to Registration at RI / Outside RI",
    "28. Treatment Given Prior to Registration at RI / Outside RI type",
    "28(b). Types of targeted therapy",
    "29(b). Types of targeted therapy",
    "Specify targeted therapy",
    "29(c). Performance Status (ECOG)",
    "If known",
    "30. Name of person completing form (IN CAPITALS)",
    "31. Date of completion of form",
    "Remarks",
    "32. Contact Number",
    "33. Designation",
  ],
};

/**
 * Return the lowest-numbered step that owns at least one of the given
 * labels. Defaults to step 1 if nothing matches.
 */
export function stepForLabels(labels: string[]): 1 | 2 | 3 {
  for (const step of [1, 2, 3] as const) {
    const owned = STEP_KEYS[step];
    if (labels.some((l) => owned.includes(l))) return step;
  }
  return 1;
}
