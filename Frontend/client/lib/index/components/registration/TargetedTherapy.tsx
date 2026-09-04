import { useState } from "react";
import { Field, SelectField } from "../FormFields";

type TargetedTherapyProps = {
  label: string;
  specifyLabel: string;
};

export function TargetedTherapy({
  label,
  specifyLabel,
}: TargetedTherapyProps) {
  const [type, setType] = useState("Not Given");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label={label}
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
          label={specifyLabel}
          placeholder="Enter therapy type"
          required
        />
      )}
    </div>
  );
}