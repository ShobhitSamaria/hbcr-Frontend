import { useEffect, useState } from "react";
import { useFormStateOptional } from "@/lib/formState";
import { DiagnosticTable } from "../DiagnosticTable";

export function DiagnosticDetails() {
  const [methods, setMethods] = useState<string[]>([]);
  const [clinicalDate, setClinicalDate] = useState("");
  const ctx = useFormStateOptional();

  // Mirror into the form-state capture so the orchestrator can persist them
  // on submit. Pure addition - no UI/flow change.
  useEffect(() => {
    ctx?.set("_diagnostic.methods", [...methods]);
  }, [methods]);
  useEffect(() => {
    ctx?.set("_diagnostic.clinicalDate", clinicalDate);
  }, [clinicalDate]);

  const toggle = (method: string, checked: boolean) =>
    setMethods((items) =>
      checked ? [...items, method] : items.filter((item) => item !== method),
    );
  return (
    <div className="space-y-7">
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          20. Method of diagnosis
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["Clinical Only", "Microscopic", "Imaging", "DCO", "Other"].map(
            (method) => (
              <label
                key={method}
                className="flex items-center gap-2 text-xs text-[#718991]"
              >
                <input
                  type="checkbox"
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
