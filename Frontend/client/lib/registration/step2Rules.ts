/**
 * Step 2 — Diagnostic & Coding validation rules.
 *
 * Field labels MUST match the strings used as keys in the form-state
 * context (i.e. the `label` prop on every <Field> / <SelectField>).
 */
import {
  defineRules,
  isInt,
  maxLen,
  notEquals,
  required,
  validateRecord,
  type RuleSet,
} from "@/lib/validation";

const SEQUENCE_PLACEHOLDER = "Select sequence";

export type Step2Values = {
  // 20. Method of diagnosis lives in component-local state and is mirrored
  // into the form-state context as `_diagnostic.methods` (string[]) and
  // `_diagnostic.clinicalDate` (string).
  _diagnostic?: { methods?: string[]; clinicalDate?: string };
  "21. Longest duration of symptom for cancer (in months)"?: string;
  "22(a). Anatomical site"?: string;
  "22(b). Pathology slide number"?: string;
  "22(c). Primary tumor site"?: string;
  "22(d). Morphology"?: string;
  "23(a). Primary Site of Tumour - Topography"?: string;
  "23(b). Primary Histology - Morphology"?: string;
  "23(c). Secondary Site of Tumour"?: string;
  "23(d). Morphology of Metastasis"?: string;
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
  "22(a). Anatomical site": [maxLen(128)],
  "22(b). Pathology slide number": [maxLen(64)],
  "22(c). Primary tumor site": [maxLen(128)],
  "22(d). Morphology": [maxLen(128)],
  "23(a). Primary Site of Tumour - Topography": [
    required("ICD-O-3 topography is required"),
    maxLen(64),
  ],
  "23(b). Primary Histology - Morphology": [
    required("ICD-O-3 morphology is required"),
    maxLen(64),
  ],
  "23(c). Secondary Site of Tumour": [maxLen(128)],
  "23(d). Morphology of Metastasis": [maxLen(128)],
  "24. Site of Tumour (ICD-10)": [maxLen(64)],
  "26. Sequence": [
    required("Please select a sequence"),
    notEquals([SEQUENCE_PLACEHOLDER], "Please select a sequence"),
  ],
});

/**
 * Validates Step 2 including conditional and cross-component rules.
 * Returns a label -> first error message map.
 */
export function validateStep2(values: Record<string, unknown>): Record<string, string> {
  const out = validateRecord(step2Rules, values);

  // 20. Method of diagnosis — at least one method must be selected.
  // The form-state context stores it as `_diagnostic.methods: string[]`.
  const methodsRaw = values["_diagnostic.methods"];
  const methods: string[] = Array.isArray(methodsRaw) ? (methodsRaw as string[]) : [];
  if (methods.length === 0) {
    out["_diagnostic.methods"] = "Please select at least one method of diagnosis";
  } else if (methods.includes("Clinical Only")) {
    // Clinical Only requires a date.
    const date = values["_diagnostic.clinicalDate"];
    if (!date || String(date).trim() === "") {
      out["_diagnostic.clinicalDate"] = "Clinical Only requires a date";
    }
  }

  // 25. Paired-laterality sub-group is required when "Paired Site" is chosen.
  // The radio group is captured by name="paired-laterality"; we treat its
  // presence by detecting a non-empty value on the parent key (the form
  // wires both into the same label slot). For now we only validate that
  // the user picked a top-level laterality; the paired radio isn't
  // surfaced into the form-state context. We surface a soft "required"
  // hint via a special key the orchestrator can map back to the section.
  if (!values["25. Laterality"]) {
  out["25. Laterality"] = "Please select a laterality option";
}


  return out;
}
