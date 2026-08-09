import { useState } from "react";
import { Field, SelectField } from "../FormFields";
import { TargetedTherapy } from "./TargetedTherapy";
import { TreatmentBlock } from "./TreatmentBlock";

export function ClinicalTreatment() {
  const [ecog, setEcog] = useState("Unknown");
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <SelectField
          label="Clinical Extent of Disease Before Cancer Directed Treatment"
          options={[
            "In-situ/benign/borderline/pre invasive",
            "Localized",
            "Direct Extension",
            "Regional Nodes",
            "Direct Extension with Regional Nodes",
            "Distant Metastasis",
            "Not Applicable",
            "Recurrence",
            "Unknown Primary",
            "Others (Specify)",
            "Unknown",
          ]}
        />
        <SelectField
          label="28(a). Staging system"
          options={[
            "TNM",
            "FIGO",
            "Ann Arbor",
            "Toronto stage system for childhood cancers",
            "Not Applicable",
            "Lugano",
            "COG",
            "Others (Specify)",
            "Unknown",
          ]}
        />
      </div>
      <p className="mb-2 text-[11px] font-bold text-[#5d7a84]">
        28(b). TNM (Tumour, Node, Metastasis)
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="T" placeholder="e.g. T2" />
        <Field label="N" placeholder="e.g. N2" />
        <Field label="M" placeholder="e.g. M2" />
        <Field label="28(c). Composite stage" placeholder="e.g. Stage IIA" />
      </div>
      <TreatmentBlock
        title="29. Treatment Given Prior to Registration at RI / Outside RI"
        requiredChoice
      />
      <TargetedTherapy />
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          29(c). Performance Status (ECOG)
        </label>
        <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="ecog-status"
              checked={ecog === "Known"}
              onChange={() => setEcog("Known")}
              className="accent-[#0b7d87]"
            />
            Known
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="ecog-status"
              checked={ecog === "Unknown"}
              onChange={() => setEcog("Unknown")}
              className="accent-[#0b7d87]"
            />
            Unknown
          </label>
        </div>
        {ecog === "Known" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SelectField
              label="If known"
              options={[
                "Grade 0 - Fully active",
                "Grade 1 - Restricted in physically strenuous activity",
                "Grade 2 - Ambulatory and capable of self-care",
                "Grade 3 - Limited self-care; confined to bed/chair >50% waking hours",
                "Grade 4 - Completely disabled",
                "Grade 5 - Dead",
              ]}
            />
            {/* <Field label="Date of death" type="date" /> */}
          </div>
        )}
      </div>
      <TreatmentBlock title="30. Treatment at RI" />
      <TargetedTherapy />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="31. Name of person completing form (IN CAPITALS)"
          placeholder="Enter full name"
          required
        />
        <Field
          label="32. Date of completion of form"
          type="date"
          required
        />
      </div>
    </div>
  );
}
