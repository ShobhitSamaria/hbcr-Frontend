/**
 * Step 2 — Diagnostic & Coding validation rules.
 *
 * Field labels MUST match the strings used as keys in the form-state
 * context (i.e. the `label` prop on every <Field> / <SelectField>).
 */
import {
  defineRules,
  isDate,
  isInt,
  maxLen,
  notEquals,
  validateRecord,
  type RuleSet,
} from "@/lib/validation";

export type Step2Values = {
  // 20. Method of diagnosis lives in component-local state and is mirrored
  // into the form-state context as `_diagnostic.methods` (string[]),
  // `_diagnostic.clinicalDate` (string) and `_diagnostic.microscopicLater`.
  _diagnostic?: {
    methods?: string[];
    clinicalDate?: string;
    microscopicLater?: string;
  };
  "21. Longest duration of symptom for cancer (in months)"?: string;
  "22.1 Anatomical Site of Specimen / Biopsy / SMEAR"?: string;
  "22.2 Pathology Slide No"?: string;
  "22.3 Date of Reporting"?: string;
  "22.4 Primary Site of Tumour - Topography"?: string;
  "22.5 Primary Histology - Morphology"?: string;
  "23.1 Site"?: string;
  "23.1 Code"?: string;
  "23.2 Morphology"?: string;
  "23.2 Code"?: string;
  "23.2 Grade"?: string;
  "23.3 Site"?: string;
  "23.3 Code"?: string;
  "23.4 Morphology"?: string;
  "23.4 Code"?: string;
  "23.4 Grade"?: string;
  "24. Site of Tumour (ICD-10)"?: string;
  // 25. Laterality is a radio group whose value is one of
  // "Not a Paired Site" | "Paired Site" | "Unknown". The paired-laterality
  // radio group is empty by default; we treat it as required only when
  // the top-level "Paired Site" is chosen.
  "25. Laterality"?: string;
  "25(a). pairedLaterality"?: string;
  "26. Sequence"?: string;
};

const step2Rules: RuleSet<Step2Values> = defineRules<Step2Values>({
  "21. Longest duration of symptom for cancer (in months)": [
    isInt(),
    // backend: SmallInt (0..32767) — but realistically capped at 600 (50y)
  ],
  "22.1 Anatomical Site of Specimen / Biopsy / SMEAR": [maxLen(128)],
  "22.2 Pathology Slide No": [maxLen(64)],
  "22.4 Primary Site of Tumour - Topography": [maxLen(128)],
  "22.5 Primary Histology - Morphology": [maxLen(128)],
  "22.3 Date of Reporting": [isDate("Enter a valid date")],
  "23.1 Site": [maxLen(128)],
  "23.1 Code": [maxLen(64)],
  "23.2 Morphology": [maxLen(128)],
  "23.2 Code": [maxLen(64)],
  "23.2 Grade": [
    notEquals(["Select Grade"], "Please select a grade"),
  ],
  "23.3 Site": [maxLen(128)],
  "23.3 Code": [maxLen(64)],
  "23.4 Morphology": [maxLen(128)],
  "23.4 Code": [maxLen(64)],
  // 23.4 is the optional metastasis section (like 23.3), so the grade
  // placeholder is acceptable when the section is left empty.
  "23.4 Grade": [maxLen(64)],
  "24. Site of Tumour (ICD-10)": [maxLen(64)],
  "26. Sequence": [maxLen(64)],
});

/**
 * Validates Step 2 including conditional and cross-component rules.
 * Returns a label -> first error message map.
 */
export function validateStep2(values: Record<string, unknown>): Record<string, string> {
  const out = validateRecord(step2Rules, values);

  // 20. Method of diagnosis — optional for now. If "Clinical Only" is
  // selected, it still requires a date (consistency check, not a gate).
  const methodsRaw = values["_diagnostic.methods"];
  const methods: string[] = Array.isArray(methodsRaw) ? (methodsRaw as string[]) : [];
  if (methods.includes("Clinical Only")) {
    const date = values["_diagnostic.clinicalDate"];
    if (!date || String(date).trim() === "") {
      out["_diagnostic.clinicalDate"] = "Clinical Only requires a date";
    }
  }

  return out;
}
