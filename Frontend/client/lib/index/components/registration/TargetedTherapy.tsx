import { useState } from "react";
import { Field, SelectField } from "../FormFields";

export function TargetedTherapy() {
  const [type, setType] = useState("Not Given");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label="30(b). Types of targeted therapy"
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
