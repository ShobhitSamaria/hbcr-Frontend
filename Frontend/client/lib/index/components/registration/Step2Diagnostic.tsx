import { useState } from "react";
import { useFormStateOptional } from "@/lib/formState";
import { Field, SelectField } from "../FormFields";
import { CodingDetails } from "./CodingDetails";
import { DiagnosticDetails } from "./DiagnosticDetails";

/**
 * Cancer types for which Familial Cancer history section should be shown.
 * Matches the "Primary site of tumor for relative" dropdown options.
 */
const FAMILIAL_CANCER_TYPES = [
  "Breast",
  "Ovary",
  "Colon",
  "Prostate",
  "Endometrial",
  "Melanoma",
  "Thyroid",
  "Pancreas",
];

type Step2DiagnosticProps = {
  familyHistory: string;
  setFamilyHistory: (v: string) => void;
};

export function Step2Diagnostic({
  familyHistory,
  setFamilyHistory,
}: Step2DiagnosticProps) {
  const [methods, setMethods] = useState<string[]>([]);
  const microscopic = methods.includes("Microscopic");
  const ctx = useFormStateOptional();

  // Determine if Familial Cancer section should be shown based on
  // the primary site entered in the pathological diagnosis section.
  const primarySite = (ctx?.values.current?.["21.4 Primary Site of Tumour - Topography"] as string) || "";
  const showFamilial = FAMILIAL_CANCER_TYPES.some(
    (type) => primarySite.toLowerCase() === type.toLowerCase(),
  );

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
      {showFamilial && (
        <FamilialCancerSection
          familyHistory={familyHistory}
          setFamilyHistory={setFamilyHistory}
        />
      )}
    </div>
  );
}

/**
 * 19. Relationship to Cancer / Degree of Relationship — shown only when the
 * primary tumour site matches a known familial cancer type.
 */
function FamilialCancerSection({
  familyHistory,
  setFamilyHistory,
}: {
  familyHistory: string;
  setFamilyHistory: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-3 block text-xs font-bold text-[#486b77]">
        19. Relationship to Cancer / Degree of Relationship
      </label>
      <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="familial-history"
            checked={familyHistory === "Yes"}
            onChange={() => setFamilyHistory("Yes")}
            className="accent-[#0b7d87]"
          />
          Yes
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="familial-history"
            checked={familyHistory === "No"}
            onChange={() => setFamilyHistory("No")}
            className="accent-[#0b7d87]"
          />
          No
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="familial-history"
            checked={familyHistory === "Unknown"}
            onChange={() => setFamilyHistory("Unknown")}
            className="accent-[#0b7d87]"
          />
          Unknown
        </label>
      </div>
      {familyHistory === "Yes" && (
        <div className="mt-5 space-y-5 rounded-xl border border-[#e7f0f1] bg-[#fbfdfd] p-4">
          <div>
            <label className="mb-3 block text-xs font-bold text-[#486b77]">
              Relationship with Cancer
            </label>
            <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="relationship-cancer"
                  required
                  className="accent-[#0b7d87]"
                />
                Same Cancer
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="relationship-cancer"
                  required
                  className="accent-[#0b7d87]"
                />
                Other Cancer
              </label>
            </div>
          </div>
          <div>
            <label className="mb-3 block text-xs font-bold text-[#486b77]">
              Degree of Relationship
            </label>
            <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="degree-relationship"
                  required
                  className="accent-[#0b7d87]"
                />
                First Degree Relative
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="degree-relationship"
                  required
                  className="accent-[#0b7d87]"
                />
                Second Degree Relative
              </label>
            </div>
          </div>
          <SelectField
            label="Primary site of tumor for relative"
            required
            options={["Breast", "Ovary", "Colon", "Prostate", "Endometrial", "Melanoma", "Thyroid", "Pancreas"]}
          />
          <Field
            label="Age at diagnosis"
            type="number"
            placeholder="Age in years"
            required
          />
          <Field label="Date of diagnosis" type="date" required />
        </div>
      )}
    </div>
  );
}
