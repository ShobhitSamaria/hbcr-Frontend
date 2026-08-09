import { useState } from "react";
import { TreatmentTable } from "./TreatmentTable";

type TreatmentBlockProps = {
  title: string;
  requiredChoice?: boolean;
};

export function TreatmentBlock({
  title,
  requiredChoice = false,
}: TreatmentBlockProps) {
  const [given, setGiven] = useState(requiredChoice ? "Yes" : "");
  const [type, setType] = useState("");
  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold text-[#486b77]">{title}</label>
      {requiredChoice && (
        <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
          <label className="flex items-center gap-2">
            <input
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
          <div>
            <p className="mb-2 text-[11px] font-bold text-[#5d7a84]">
              30(a). Type of treatment given
            </p>
            <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
              {["Allopathic", "Non-Allopathic", "Both"].map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
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
          <TreatmentTable title="Treatment modalities" />
        </>
      )}
    </div>
  );
}
