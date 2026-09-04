import { useState } from "react";
import { useFormStateOptional } from "@/lib/formState";
import { useForceReadOnly } from "@/lib/formState";
import { Field, SelectField, TextAreaField } from "../FormFields";
import { TargetedTherapy } from "./TargetedTherapy";
import { TreatmentBlock } from "./TreatmentBlock";

const STAGING_SYSTEM_OPTIONS = [
  "TNM",
  "FIGO",
  "Ann Arbor",
  "Toronto stage system for childhood cancers",
  "Not Applicable",
  "Lugano",
  "COG",
  "Others (Specify)",
  "Unknown",
];

export function ClinicalTreatment() {
  const readOnly = useForceReadOnly();
  const ctx = useFormStateOptional();
  const [ecog, setEcog] = useState("Unknown");
  const [stagingSystem, setStagingSystem] = useState("");
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [selectedModalities30, setSelectedModalities30] = useState<string[]>([]);
  const isTNM = stagingSystem === "TNM";

  // Write ecog status to form context for validation
  const handleEcogChange = (v: string) => {
    setEcog(v);
    ctx?.set("29(c). Performance Status (ECOG)", v);
  };

  return (
    <div className="space-y-7">
      <style>{`input[name="31. Name of person completing form (IN CAPITALS)"] { text-transform: uppercase; }`}</style>
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
          required
        />
        <SelectField
          label="28(a). Staging system"
          options={STAGING_SYSTEM_OPTIONS}
          value={stagingSystem}
          onChange={setStagingSystem}
          required
        />
      </div>
      {isTNM ? (
        <>
          <p className="mb-2 text-[11px] font-bold text-[#5d7a84]">
            28(b). TNM (Tumour, Node, Metastasis)
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              label="T"
              required={isTNM}
              options={["Tx",
                "Tis",
                "Tis(DCIS)",
                "Tis(paget)",
                "T1mi",
                "T1b3",
                "T0",
                "T1",
                "T1a",
                "T1a1",
                "T1a2",
                "T1b",
                "T1b1",
                "T1b2",
                "T1c",
                "T1c1",
                "T1c2",
                "T1c3",
                "T2",
                "T2a",
                "T2a1",
                "T2a2",
                "T2b",
                "T2c",
                "T3",
                "T3a",
                "T3b",
                "T3c",
                "T3d",
                "T3e",
                "T4",
                "T4a",
                "T4b",
                "T4c",
                "T4d",
              ]}
            />
            <SelectField
              label="N"
              required={isTNM}
              options={["Nx",
                "N0",
                "N1",
                "N1a",
                "N1b",
                "N1c",
                "N1mi",
                "N2",
                "N2a",
                "N2b",
                "N2c",
                "N3",
                "N3a",
                "N3b",
                "N3c",
              ]}
            />
            <SelectField
              label="M"
              required={isTNM}
              options={["Mx",
                "M0",
                "M1",
                "M1a",
                "M1b",
                "M1c",
                "M1d",
              ]}
            />
          </div>
        </>
      ) : (
        stagingSystem && (
          <div>
            <p className="mb-2 text-[11px] font-bold text-[#5d7a84]">
              28(a). Staging system value
            </p>
            <Field
              label=""
              placeholder="Enter staging value"
              stateKey="28(a). Staging system value"
              required={!isTNM && stagingSystem !== ""}
            />
          </div>
        )
      )}
      <SelectField
        label="28(c). Composite stage"
        required
        options={["IA",
          "IA1",
          "IA2",
          "IB",
          "IB1",
          "IB2",
          "IB3",
          "IC",
          "IS",
          "II",
          "IIA",
          "IIA1",
          "IIA2",
          "IIB",
          "IIC",
          "III",
          "IIIA",
          "IIIA1",
          "IIIA2",
          "IIIB",
          "IIIC",
          "IIIC1",
          "IIIC2",
          "IV",
          "IVA",
          "IVB",
          "IVC",
          "8888",
          "Unknown",
        ]}
      />
      <TreatmentBlock
        title="29. Treatment Given Prior to Registration at RI / Outside RI"
        requiredChoice
        onSelectionChange={(rows) => {
          setSelectedModalities(rows);
          ctx?.set("29. Treatment modalities selected", rows);
        }}
      />
      <TargetedTherapy />
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          29(c). Performance Status (ECOG)<span className="ml-0.5 text-[#d04a4a]">*</span>
        </label>
        <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
          <label className="flex items-center gap-2">
            <input
              disabled={readOnly}
              type="radio"
              name="ecog-status"
              checked={ecog === "Known"}
              onChange={() => handleEcogChange("Known")}
              className="accent-[#0b7d87]"
            />
            Known
          </label>
          <label className="flex items-center gap-2">
            <input
              disabled={readOnly}
              type="radio"
              name="ecog-status"
              checked={ecog === "Unknown"}
              onChange={() => handleEcogChange("Unknown")}
              className="accent-[#0b7d87]"
            />
            Unknown
          </label>
        </div>
        {ecog === "Known" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SelectField
              label="If known"
              required={ecog === "Known"}
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
      <TreatmentBlock
        title="30. Treatment at RI"
        requiredChoice
        onSelectionChange={(rows) => {
          setSelectedModalities30(rows);
          ctx?.set("30. Treatment modalities selected", rows);
        }}
      />
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
        <Field
          label="33. Contact Number"
          placeholder="Enter contact number"
          required
        />
        <Field
          label="34. Designation"
          placeholder="Enter designation"
          required
        />
        <div className="sm:col-span-2">
          <TextAreaField
            label="Remarks"
            placeholder="Enter any remarks (max 1000 characters)"
            maxLength={1000}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
