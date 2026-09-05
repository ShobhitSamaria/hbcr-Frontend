import { useEffect, useState } from "react";
import { useFormStateOptional, useForceReadOnly } from "@/lib/formState";
import { DiagnosticTable } from "../DiagnosticTable";

// The Complete Pathological Diagnosis fields (22.1 - 22.5) are only
// editable when "(2) Microscopic" is selected as a method of diagnosis.
// The keys mirror the Field labels so they can be cleared from the
// form-state capture when Microscopic is unchecked.
const PATHOLOGICAL_DIAGNOSIS_KEYS = [
  "21.1 Anatomical Site of Specimen / Biopsy / SMEAR",
  "21.2 Pathology Slide No",
  "21.3 Date of Reporting",
  "21.4 Primary Site of Tumour - Topography",
  "21.5 Primary Histology / Morphology",
];

export function DiagnosticDetails({
  methods,
  setMethods,
}: {
  methods: string[];
  setMethods: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const readOnly = useForceReadOnly();
  const [clinicalDate, setClinicalDate] = useState("");
  const [microscopicLater, setMicroscopicLater] = useState<"" | "Yes" | "No">("");
  const ctx = useFormStateOptional();

  // Mirror into the form-state capture so the orchestrator can persist them
  // on submit. Pure addition - no UI/flow change.
  useEffect(() => {
    ctx?.set("_diagnostic.methods", [...methods]);
  }, [methods]);
  useEffect(() => {
    ctx?.set("_diagnostic.clinicalDate", clinicalDate);
  }, [clinicalDate]);
  useEffect(() => {
    ctx?.set("_diagnostic.microscopicLater", microscopicLater);
  }, [microscopicLater]);

  const toggle = (method: string, checked: boolean) => {
    if (!checked && method === "Microscopic") {
      // Pathological-diagnosis fields are gated on Microscopic being
      // selected; drop any captured values so stale data isn't submitted.
      PATHOLOGICAL_DIAGNOSIS_KEYS.forEach((key) => ctx?.set(key, ""));
    }
    setMethods((items) =>
      checked ? [...items, method] : items.filter((item) => item !== method),
    );
  };
  return (
    <div className="space-y-7">
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          19. Method of diagnosis<span className="ml-0.5 text-[#d04a4a]">*</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["Clinical Only", "Microscopic", "Imaging", "DCO", "Other"].map(
            (method) => (
              <label
                key={method}
                className="flex flex-wrap items-center gap-2 text-xs text-[#718991]"
              >
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={methods.includes(method)}
                  onChange={(e) => toggle(method, e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[#c9dce0] accent-[#0b7d87]"
                />
                {method}
                {method === "Clinical Only" && methods.includes(method) && (
                  <input
                    type="date"
                    required
                    value={clinicalDate}
                    onChange={(e) => setClinicalDate(e.target.value)}
                    className="ml-2 h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] text-[#6e8790] outline-none focus:border-[#36a99c]"
                  />
                )}

              </label>
            ),
          )}
        </div>
      </div>
      {methods.includes("Microscopic") && (
        <DiagnosticTable
          title="Microscopic method"
          rows={[
            "(a). Histology of Primary",
            "(b). Histology of Metastasis",
            "(c). Autopsy with Histology",
            "(d). Bone Marrow",
            "(e). Blood Film",
            "(f). Cytology of Primary",
            "(g). Cytology of Metastasis",
            "(h). Immunohistochemistry",
            "(i). Cytogenetics",
            "(j).Flow Cytometry",
            "(k) Others",
          ]}
        />
      )}
      {methods.includes("Imaging") && (
        <DiagnosticTable
          title="X-Ray / Imaging Techniques"
          rows={[
            "(a). X-Ray",
            "(b). Isotopes",
            "(c). Angiography",
            "(d). Ultrasonogram",
            "(e). CT Scan",
            "(f). MRI",
            "(g). PET Scan",
            "(i). Others",
          ]}
        />
      )}
      <div className="flex w-full flex-col gap-1.5 rounded-lg border border-[#e3edef] bg-[#f7fbfb] p-2.5">
          <span className="text-[11px] font-semibold leading-snug text-[#486b77]">
            Was microscopic confirmation done at a later date (if other than (2) above is selected)?
            <span className="ml-0.5 text-[#d04a4a]">*</span>
          </span>
          <span className="flex gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <input
                disabled={readOnly}
                type="radio"
                name="microscopic-later"
                checked={microscopicLater === "Yes"}
                onChange={() => setMicroscopicLater("Yes")}
                className="accent-[#0b7d87]"
              />
              Yes
            </span>
            <span className="flex items-center gap-1.5">
              <input
                disabled={readOnly}
                type="radio"
                name="microscopic-later"
                checked={microscopicLater === "No"}
                onChange={() => setMicroscopicLater("No")}
                className="accent-[#0b7d87]"
              />
              No
            </span>
          </span>
        </div>
      {methods.includes("Other") && (
        <DiagnosticTable
          title="Other diagnostic procedures"
          rows={[
            "(a). Endoscopy",
            "(b). Surgery without Histology",
            "(c). Specific Biochemical and/or Immunological Tests",
            "(d). Biological Markers",
            "(e). Others",
          ]}
        />
      )}
    </div>
  );
}
