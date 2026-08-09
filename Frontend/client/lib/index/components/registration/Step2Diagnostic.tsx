import { Field } from "../FormFields";
import { CodingDetails } from "./CodingDetails";
import { DiagnosticDetails } from "./DiagnosticDetails";

export function Step2Diagnostic() {
  return (
    <div className="space-y-7">
      <DiagnosticDetails />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Field
          label="21. Longest duration of symptom for cancer (in months)"
          type="number"
          placeholder="Months"
        />
      </div>
      <label className="mb-3 block text-xs font-bold text-[#486b77]">
        22. Complete Pathological Diagnosis: (With Complete Description of
        Primary Site of Tumor and Morphological Diagnosis)
      </label>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Field
          label="22(a). Anatomical site"
          placeholder="e.g. Upper outer quadrant"
        />
        <Field
          label="22(b). Pathology slide number"
          placeholder="Slide number"
        />
        <Field
          label="22(c). Primary tumor site"
          placeholder="e.g. Breast"
        />
        <Field label="22(d). Morphology" placeholder="Enter morphology" />
      </div>
      <CodingDetails />
    </div>
  );
}
