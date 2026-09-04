/**
 * Step 3 — Clinical Treatment validation rules.
 *
 * Field labels MUST match the strings used as keys in the form-state
 * context (i.e. the `label` prop on every <Field> / <SelectField>).
 */
import {
  defineRules,
  isDate,
  maxLen,
  notFutureDate,
  pattern,
  required,
  validateRecord,
  type RuleSet,
} from "@/lib/validation";

const MOBILE_RE = /^[6-9][0-9]{9}$/;

export type Step3Values = {
  "Clinical Extent of Disease Before Cancer Directed Treatment"?: string;
  "28(a). Staging system"?: string;
  "28(a). Staging system value"?: string;
  T?: string;
  N?: string;
  M?: string;
  "28(c). Composite stage"?: string;
  "29. Treatment Given Prior to Registration at RI / Outside RI"?: string;
  // Both treatment blocks (29 + 30) capture "30(a). Type of treatment given"
  // under the same label string because the original UI uses the title
  // as the `name` attribute prefix. We validate the label once.
  "30(a). Type of treatment given"?: string;
  "30(b). Types of targeted therapy"?: string;
  "Specify targeted therapy"?: string;
  "29(c). Performance Status (ECOG)"?: string;
  "If known"?: string;
  "31. Name of person completing form (IN CAPITALS)"?: string;
  "32. Date of completion of form"?: string;
  Remarks?: string;
  "33. Contact Number"?: string;
  "34. Designation"?: string;
  "29. Treatment Given Prior to Registration at RI / Outside RI type"?: string;
  "29. Treatment modalities selected"?: string[];
};

const step3Rules: RuleSet<Step3Values> = defineRules<Step3Values>({
  "Clinical Extent of Disease Before Cancer Directed Treatment": [
    required("Please select a clinical extent"),
  ],
  "28(a). Staging system": [required("Please select a staging system")],
  T: [maxLen(8)],
  N: [maxLen(8)],
  M: [maxLen(8)],
  "28(c). Composite stage": [required("Composite stage is required")],
  "31. Name of person completing form (IN CAPITALS)": [
    required("Name of person completing the form is required"),
    maxLen(255),
  ],
  "32. Date of completion of form": [
    required("Date of completion is required"),
    isDate(),
    notFutureDate(),
  ],
  Remarks: [maxLen(1000)],
  "33. Contact Number": [
    required("Contact number is required"),
    pattern(MOBILE_RE, "Enter a valid 10-digit mobile number"),
  ],
  "34. Designation": [required("Designation is required")],
});

/**
 * Validates Step 3 including conditional rules.
 */
export function validateStep3(values: Record<string, unknown>): Record<string, string> {
  const out = validateRecord(step3Rules, values);

  // If staging system is not TNM, require the staging system value.
  const staging = values["28(a). Staging system"];
  if (staging && staging !== "TNM") {
    const v = values["28(a). Staging system value"];
    if (!v || String(v).trim() === "") {
      out["28(a). Staging system value"] = "Please enter the staging system value";
    }
  }

  // 29. Treatment Given Prior — mandatory (radio group).
  const treatmentGiven = values["29. Treatment Given Prior to Registration at RI / Outside RI"];
  if (!treatmentGiven || String(treatmentGiven).trim() === "") {
    out["29. Treatment Given Prior to Registration at RI / Outside RI"] = "Please select treatment option";
  }

  // 30(b). Targeted therapy "Others (Specify)" requires the text input.
  if (values["30(b). Types of targeted therapy"] === "Others (Specify)") {
    const v = values["Specify targeted therapy"];
    if (!v || String(v).trim() === "") {
      out["Specify targeted therapy"] = "Please specify the targeted therapy";
    }
  }

  // 28(a). When Staging System = TNM, T/N/M are mandatory
  if (staging === "TNM") {
    const tnmRequired = (label: string, msg: string) => {
      const v = values[label];
      if (v === undefined || v === null || String(v).trim() === "") {
        out[label] = msg;
      }
    };
    tnmRequired("T", "T is required when staging system is TNM");
    tnmRequired("N", "N is required when staging system is TNM");
    tnmRequired("M", "M is required when staging system is TNM");
  }

  // 29. When Treatment Given = Yes, Treatment Type must be selected
  const treatmentTypeKey = "29. Treatment Given Prior to Registration at RI / Outside RI" + " type";
  if (treatmentGiven && String(treatmentGiven).trim() === "Yes") {
    const tt = values[treatmentTypeKey];
    if (tt === undefined || tt === null || String(tt).trim() === "") {
      out[treatmentTypeKey] = "Treatment type is required when Treatment Given is Yes";
    }

    // At least one treatment modality must be selected when Yes
    const mods = values["29. Treatment modalities selected"];
    if (!Array.isArray(mods) || mods.length === 0) {
      out["29. Treatment modalities selected"] = "At least one treatment modality must be selected";
    }
  }

  // 29(c). When Performance Status (ECOG) = Known, ECOG Grade ("If known") is mandatory
  const ecogStatus = values["29(c). Performance Status (ECOG)"];
  if (ecogStatus && String(ecogStatus).trim() === "Known") {
    const grade = values["If known"];
    if (grade === undefined || grade === null || String(grade).trim() === "") {
      out["If known"] = "ECOG Grade is required when Performance Status is Known";
    }
  }

  return out;
}
