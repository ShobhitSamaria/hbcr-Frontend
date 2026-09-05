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
  notFutureDate,
  range,
  required,
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
  "21.1 Anatomical Site of Specimen / Biopsy / SMEAR"?: string;
  "21.2 Pathology Slide No"?: string;
  "21.3 Date of Reporting"?: string;
  "21.4 Primary Site of Tumour - Topography"?: string;
  "21.5 Primary Histology / Morphology"?: string;
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
    required("Longest duration of symptom is required"),
    isInt(),
    range(1, 1200, "Must be between 1 and 1200 months"),
  ],
  "21.1 Anatomical Site of Specimen / Biopsy / SMEAR": [maxLen(128)],
  "21.2 Pathology Slide No": [maxLen(64)],
  "21.3 Date of Reporting": [isDate("Enter a valid date"), notFutureDate("Date cannot be in the future")],
  "21.4 Primary Site of Tumour - Topography": [maxLen(128)],
  "21.5 Primary Histology / Morphology": [maxLen(128)],
  "23.1 Site": [maxLen(128)],
  "23.1 Code": [maxLen(64)],
  "23.2 Morphology": [maxLen(128)],
  "23.2 Code": [maxLen(64)],
  "23.2 Grade": [],
  "23.3 Site": [maxLen(128)],
  "23.3 Code": [maxLen(64)],
  "23.4 Morphology": [maxLen(128)],
  "23.4 Code": [maxLen(64)],
  // 23.4 is the optional metastasis section (like 23.3), so the grade
  // placeholder is acceptable when the section is left empty.
  "23.4 Grade": [maxLen(64)],
  "24. Site of Tumour (ICD-10)": [maxLen(64)],
  "25. Laterality": [required("Laterality is required")],
  "26. Sequence": [maxLen(64)],
});

/**
 * Validates Step 2 including conditional and cross-component rules.
 * Returns a label -> first error message map.
 */
export function validateStep2(values: Record<string, unknown>): Record<string, string> {
  const out = validateRecord(step2Rules, values);

  const methodsRaw = values["_diagnostic.methods"];
  const methods: string[] = Array.isArray(methodsRaw) ? (methodsRaw as string[]) : [];

  // 20. Method of diagnosis — mandatory.
  if (methods.length === 0) {
    out["_diagnostic.methods"] = "Select at least one method of diagnosis";
  }

  // Clinical Only requires a date.
  if (methods.includes("Clinical Only")) {
    const date = values["_diagnostic.clinicalDate"];
    if (!date || String(date).trim() === "") {
      out["_diagnostic.clinicalDate"] = "Clinical Only diagnosis date is required";
    }
  }

  // Microscopic confirmation done at a later date — always mandatory.
  const microscopicLater = values["_diagnostic.microscopicLater"];
  if (!microscopicLater || String(microscopicLater).trim() === "") {
    out["_diagnostic.microscopicLater"] = "Microscopic confirmation question is required";
  }

  // 25. Laterality — mandatory.
  const lat = values["25. Laterality"];
  if (!lat || String(lat).trim() === "") {
    out["25. Laterality"] = "Laterality is required";
  } else if (lat === "Paired Site") {
    // When Paired Site is selected, paired laterality must also be selected.
    const paired = values["25(a). pairedLaterality"];
    if (!paired || String(paired).trim() === "") {
      out["25(a). pairedLaterality"] = "Please select paired laterality";
    }
  }

  // When Microscopic is selected, pathological fields are mandatory.
  if (methods.includes("Microscopic")) {
    const pathFields: [string, string][] = [
      ["21.1 Anatomical Site of Specimen / Biopsy / SMEAR", "Anatomical Site is required"],
      ["21.3 Date of Reporting", "Date of Reporting is required"],
      ["21.4 Primary Site of Tumour - Topography", "Primary Site of Tumour is required"],
      ["21.5 Primary Histology / Morphology", "Primary Histology / Morphology is required"],
    ];
    for (const [field, msg] of pathFields) {
      const v = values[field];
      if (!v || String(v).trim() === "") {
        out[field] = msg;
      }
    }

    // NOTE: No cross-field comparison between Date of First Diagnosis (Field 8)
    // and the microscopic confirmation / reporting dates. Per the business rule,
    // Field 8 only needs to be a valid, non-future date (enforced in step1Rules)
    // and MAY be earlier than the Date of Reporting.
  }

  return out;
}
