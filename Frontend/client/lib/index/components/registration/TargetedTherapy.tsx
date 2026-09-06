import { useState } from "react";
import { useFormStateOptional } from "@/lib/formState";
import { Field, SelectField } from "../FormFields";

export function TargetedTherapy() {
  const ctx = useFormStateOptional();
  // Initialize from the form-state capture so Patient Records shows the saved
  // therapy type instead of always defaulting to "Not Given".
  const [type, setType] = useState(() => {
    const cur = ctx?.values.current["30(b). Types of targeted therapy"];
    return typeof cur === "string" && cur !== "" ? cur : "Not Given";
  });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label={`30(b). Types of targeted therapy${type === "Others (Specify)" ? " *" : ""}`}
        stateKey="30(b). Types of targeted therapy"
        value={type}
        onChange={setType}
        options={[
          "Tyrosine Kinase Inhibitor (TKI)",
          "Immunotherapy",
          "Monoclonal Antibodies",
          "Antibody Drug Conjugate",
          "CDK 4/6 Inhibitor",
          "mTOR Inhibitor",
          "PARP Inhibitor",
          "Not Given",
          "Others (Specify)",
          "Unknown",
        ]}
      />
      {type === "Others (Specify)" && (
        <Field
          label="Specify targeted therapy"
          placeholder="Enter therapy type"
          required
        />
      )}
    </div>
  );
}
