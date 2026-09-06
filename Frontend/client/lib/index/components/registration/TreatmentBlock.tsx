import { useEffect, useState } from "react";
import { useFormStateOptional, useForceReadOnly } from "@/lib/formState";
import { TreatmentTable } from "./TreatmentTable";

type TreatmentBlockProps = {
  title: string;
  number: string;
  requiredChoice?: boolean;
  /** Form-state key where the selected modality labels are stored (seeded in
   *  Patient Records so the table checkboxes reflect persisted data). */
  modalityStateKey?: string;
  onSelectionChange?: (selectedRows: string[]) => void;
};

export function TreatmentBlock({
  title,
  number,
  requiredChoice = false,
  modalityStateKey,
  onSelectionChange,
}: TreatmentBlockProps) {
  const ctx = useFormStateOptional();
  const readOnly = useForceReadOnly();
  // Initialize from the form-state capture (Patient Records seeds these) so
  // saved choices display instead of the registration defaults.
  const [given, setGiven] = useState(() => {
    const cur = ctx?.values.current[title];
    if (typeof cur === "string" && cur !== "") return cur;
    return requiredChoice ? "Yes" : "";
  });
  const [type, setType] = useState(() => {
    const cur = ctx?.values.current[title + " type"];
    return typeof cur === "string" ? cur : "";
  });

  useEffect(() => {
    if (requiredChoice) ctx?.set(title, given);
  }, [given, requiredChoice, title, ctx]);

  // Write treatment type to form context for validation
  useEffect(() => {
    if (type) ctx?.set(title + " type", type);
  }, [type, title, ctx]);
  // When "Non-Allopathic" is chosen, the Treatment Modalities table is
  // disabled and any previously entered rows are cleared (the table is
  // remounted via `key` so its local state resets).
  const nonAllopathic = type === "Non-Allopathic";
  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold text-[#486b77]">
        {title}{requiredChoice && <span className="ml-0.5 text-[#d04a4a]">*</span>}
      </label>
      {requiredChoice && (
        <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
          <label className="flex items-center gap-2">
            <input
              disabled={readOnly}
              type="radio"
              name={title}
              checked={given === "Yes"}
              onChange={() => setGiven("Yes")}
              className="accent-[#0b7d87]"
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              disabled={readOnly}
              type="radio"
              name={title}
              checked={given === "No"}
              onChange={() => setGiven("No")}
              className="accent-[#0b7d87]"
            />
            No
          </label>
          <label className="flex items-center gap-2">
            <input
              disabled={readOnly}
              type="radio"
              name={title}
              checked={given === "Unknown"}
              onChange={() => setGiven("Unknown")}
              className="accent-[#0b7d87]"
            />
            Unknown
          </label>
        </div>
      )}
      {(!requiredChoice || given === "Yes") && (
        <>
          <div>              <p className="mb-2 text-[11px] font-bold text-[#5d7a84]">
              {number}(a). If Yes, Type of Treatment Given{(requiredChoice && given === "Yes") ? <span className="ml-0.5 text-[#d04a4a]">*</span> : null}
            </p>
            <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
              {["Allopathic", "Non-Allopathic", "Both"].map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    disabled={readOnly}
                    type="radio"
                    name={title + "type"}
                    checked={type === option}
                    onChange={() => setType(option)}
                    className="accent-[#0b7d87]"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
          <TreatmentTable
            key={type}
            title="Treatment modalities"
            stateKey={modalityStateKey}
            requiredChoice={requiredChoice && given === "Yes"}
            disabled={readOnly || nonAllopathic}
            onSelectionChange={onSelectionChange}
          />
        </>
      )}
    </div>
  );
}
