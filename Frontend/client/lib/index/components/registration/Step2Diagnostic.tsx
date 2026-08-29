import { useState } from "react";
import { Field, SelectField } from "../FormFields";
import { CodingDetails } from "./CodingDetails";
import { DiagnosticDetails } from "./DiagnosticDetails";

export function Step2Diagnostic() {
  const [methods, setMethods] = useState<string[]>([]);
  const microscopic = methods.includes("Microscopic");

  return (
    <div className="space-y-7">
      <DiagnosticDetails methods={methods} setMethods={setMethods} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Field
          label="21. Longest duration of symptom for cancer (in months)"
          type="number"
          placeholder="Months"
          required
        />
      </div>
      <label className="mb-3 block text-xs font-bold text-[#486b77]">
        21. Complete Pathological Diagnosis: (With Complete Description of
        Primary Site of Tumor and Morphological Diagnosis)
      </label>
      {/* Keyed by `microscopic` so the fields remount (and re-read the
          form-state capture) when the Microscopic dependency flips. */}
      <div
        key={microscopic ? "microscopic-on" : "microscopic-off"}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2"
      >
        <Field
          label="21.1 Anatomical Site of Specimen / Biopsy / SMEAR"
          placeholder="e.g. Upper outer quadrant"
          disabled={!microscopic}
          required={microscopic}
        />
        <Field
          label="21.2 Pathology Slide No"
          placeholder="Slide number"
          disabled={!microscopic}
          required={microscopic}
        />
        <Field
          label="21.3 Date of Reporting"
          type="date"
          disabled={!microscopic}
          required={microscopic}
        />
        <Field
          label="21.4 Primary Site of Tumour - Topography"
          placeholder="e.g. Breast"
          disabled={!microscopic}
          required={microscopic}
        />
        <Field
          label="21.5 Primary Histology / Morphology"
          placeholder="Enter morphology"
          disabled={!microscopic}
          required={microscopic}
        />
      </div>
      <CodingDetails />
    </div>
  );
}
