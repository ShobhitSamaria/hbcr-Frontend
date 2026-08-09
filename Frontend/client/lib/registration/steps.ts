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
    "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)",
    "3(a). Department name",
    "3(b). Unit number",
    "4. Hospital registration number (MRD No / CR No./Unique Hospital Identification Number)",
    "5. Date of reporting",
    "6. Case Registered Through (Patient’s first reporting at RI)",
    "7. Type of referral",
    "7(a). Name of Facility.",
    "7(b). City",
    "7(c). District",
    "7(d). Hospital / LAB / N.H.",
    "7(e). Date of Registration",
    "8. Date of first diagnosis",
    "9. Full name",
    "10. Age",
    "11. Date of Birth",
    "12. Gender",
    "16. Marital status",
    "17. Education",
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
    "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)",
  ],
  2: [
    "_diagnostic.methods",
    "_diagnostic.clinicalDate",
    "21. Longest duration of symptom for cancer (in months)",
    "22(a). Anatomical site",
    "22(b). Pathology slide number",
    "22(c). Primary tumor site",
    "22(d). Morphology",
    "23(a). Primary Site of Tumour - Topography",
    "23(b). Primary Histology - Morphology",
    "23(c). Secondary Site of Tumour",
    "23(d). Morphology of Metastasis",
    "24. Site of Tumour (ICD-10)",
    "25. Laterality",
    "26. Sequence",
  ],
  3: [
    "Clinical Extent of Disease Before Cancer Directed Treatment",
    "28(a). Staging system",
    "T",
    "N",
    "M",
    "28(c). Composite stage",
    "29. Treatment Given Prior to Registration at RI / Outside RI",
    "30(a). Type of treatment given",
    "30(b). Types of targeted therapy",
    "Specify targeted therapy",
    "29(c). Performance Status (ECOG)",
    "If known",
    "31. Name of person completing form (IN CAPITALS)",
    "32. Date of completion of form",
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
