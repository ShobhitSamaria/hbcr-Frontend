import { useState } from "react";
import { Field, SelectField, ToggleDetails } from "../FormFields";

type Step1IdentifyingProps = {
  name: string;
  setName: (v: string) => void;
  referral: string;
  setReferral: (v: string) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  sameAddress: boolean;
  setSameAddress: (v: boolean) => void;
  familyHistory: string;
  setFamilyHistory: (v: string) => void;
};

export function Step1Identifying({
  name,
  setName,
  referral,
  setReferral,
  selectedIds,
  setSelectedIds,
  sameAddress,
  setSameAddress,
  familyHistory,
  setFamilyHistory,
}: Step1IdentifyingProps) {
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Field
          label="1. Name of the Reporting Institution (RI)"
          placeholder="e.g. AIIMS New Delhi"
        />
        <Field label="Centre code" placeholder="e.g. DL001" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Field
          label="2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)"
          placeholder="HBCR-2024-0185"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Field label="3(a). Department name" placeholder="Oncology" />
        <Field label="3(b). Unit number" placeholder="Unit 04" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Field
          label="4. Hospital registration number (MRD No / CR No./Unique Hospital Identification Number)"
          placeholder="Enter registration no."
        />
        <Field label="5. Date of reporting" type="date" />
        <SelectField
          label="6. Case Registered Through (Patient’s first reporting at RI)"
          options={[
            "Out Patient",
            "In Patient Elective",
            "In Patient Emergency",
            "Other",
          ]}
        />
        <SelectField
          label="7. Type of referral"
          value={referral}
          onChange={setReferral}
          options={[
            "Self",
            "Other Hospital/Health Facility",
            "Screen Detected",
            "Unknown",
          ]}
        />
        {referral === "Other Hospital/Health Facility" && (
          <>
            <Field
              label="7(a). Name of Facility."
              placeholder="Enter Facility name"
            />
            <Field label="7(b). City" placeholder="City" />
            <Field label="7(c). District" placeholder="District" />
            <Field
              label="7(d). Hospital / LAB / N.H."
              placeholder="Enter Hospital / LAB / N.H."
            />
            <Field label="7(e). Date of Registration" type="date" />
          </>
        )}
        <Field label="8. Date of first diagnosis" type="date" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="9. Full name"
          placeholder="First, Middle, Last"
          value={name}
          onChange={setName}
        />
        <Field label="10. Age" type="number" placeholder="Years" />
        <Field label="11. Date of Birth" type="date" />
        <SelectField
          label="12. Gender"
          options={["Select gender", "Male", "Female", "Other"]}
        />
      </div>
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          13. Unique identification
        </label>
        <div className="space-y-3">
          {[
            "a). Aadhaar",
            "b). ABHA",
            "c). Voter ID",
            "d). Passport",
            "d). AB-PMJAY",
            "e). Other",
          ].map((id) => (
            <div
              key={id}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#718991]"
            >
              <span className="w-28">{id}</span>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={"id-" + id}
                  checked={!selectedIds.includes(id)}
                  onChange={() =>
                    setSelectedIds(selectedIds.filter((x) => x !== id))
                  }
                  className="accent-[#0b7d87]"
                />
                No
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={"id-" + id}
                  checked={selectedIds.includes(id)}
                  onChange={() =>
                    setSelectedIds(
                      selectedIds.includes(id)
                        ? selectedIds
                        : [...selectedIds, id],
                    )
                  }
                  className="accent-[#0b7d87]"
                />
                Yes
              </label>
              <input
                placeholder={"Enter " + id + " number"}
                disabled={!selectedIds.includes(id)}
                className="h-8 w-44 rounded-lg border border-[#dce9eb] bg-[#fbfdfd] px-2 text-[11px] outline-none focus:border-[#36a99c] disabled:cursor-not-allowed disabled:bg-[#f1f5f5] disabled:text-[#a9b8bc]"
              />
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          14. Relative details
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <Field label="Father name" placeholder="Full name" />
          <Field
            label="Father mobile number"
            placeholder="Mobile number"
          />
          <Field label="Mother name" placeholder="Full name" />
          <Field
            label="Mother mobile number"
            placeholder="Mobile number"
          />
          <Field label="Spouse name" placeholder="Full name" />
          <Field
            label="Spouse mobile number"
            placeholder="Mobile number"
          />
        </div>
      </div>
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          15. Address
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Flat / House No."
            placeholder="House number"
          />
          <Field label="Street / Road" placeholder="Street or road" />
          <Field label="City" placeholder="City" />
          <Field label="District" placeholder="District" />
          <Field label="State" placeholder="State" />
          <Field
            label="PIN Code"
            type="number"
            placeholder="PIN code"
          />
          <Field label="Mobile number" placeholder="Mobile number" />
          <Field
            label="Email address"
            type="email"
            placeholder="patient@email.com"
          />
        </div>
        <label className="mt-4 flex items-center gap-2 text-xs text-[#718991]">
          <input
            type="checkbox"
            checked={sameAddress}
            onChange={(e) => setSameAddress(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-[#c9dce0] accent-[#0b7d87]"
          />
          Residential Address is same as Permanent Address
        </label>
        {!sameAddress && (
          <div className="mt-5 grid gap-4 rounded-xl border border-[#e7f0f1] bg-[#fbfdfd] p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Permanent Flat / House No."
              placeholder="House number"
            />
            <Field
              label="Permanent Street / Road"
              placeholder="Street or road"
            />
            <Field label="Permanent City" placeholder="City" />
            <Field
              label="Permanent District"
              placeholder="District"
            />
            <Field label="Permanent State" placeholder="State" />
            <Field
              label="Permanent PIN Code"
              type="number"
              placeholder="PIN code"
            />
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <SelectField
          label="16. Marital status"
          options={[
            "Select status",
            "Married",
            "Single",
            "Widowed",
            "Divorced",
          ]}
        />
        <SelectField
          label="17. Education"
          options={[
            "Not applicable (for children below 7 years)",
            "Illiterate",
            "Literate",
            "Primary",
            "Middle",
            "Secondary/Higher Secondary",
            "Technical-after matric",
            "Graduate and above",
            "Others (specify)",
            "Unknown",
          ]}
        />
      </div>
      <ToggleDetails
        title="18(a). Habits"
        items={[
          "Smoking",
          "Smokeless Tobacco",
          "Betel Nut",
          "Alcohol",
        ]}
      />
      <ToggleDetails
        title="18(b). Co-Morbidities"
        items={[
          "Tuberculosis",
          "Hypertension",
          "Diabetes",
          "Ischemic Heart Disease",
          "COPD / Asthma",
          "Stroke",
          "Depression",
          "Hepatitis B",
          "Hepatitis C",
          "NAFLD",
          "Chronic Kidney Disease",
          "HIV/AIDS",
          "Hypothyroidism",
          "Others",
        ]}
      />
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          18(c)Anthropometric measurements
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Height (cm)"
            placeholder="Enter height"
            type="number"
            required
          />
          <Field
            label="Weight (kg)"
            placeholder="Enter weight"
            type="number"
            required
          />
        </div>
      </div>
      <FamilialCancerSection
        familyHistory={familyHistory}
        setFamilyHistory={setFamilyHistory}
      />
    </div>
  );
}

type FamilialCancerSectionProps = {
  familyHistory: string;
  setFamilyHistory: (v: string) => void;
};

function FamilialCancerSection({
  familyHistory,
  setFamilyHistory,
}: FamilialCancerSectionProps) {
  return (
    <div>
      <label className="mb-3 block text-xs font-bold text-[#486b77]">
        19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)
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
            options={[
              "Select primary site",
              "Breast",
              "Ovary",
              "Colon",
              "Prostate",
              "Endometrial",
              "Melanoma",
              "Thyroid",
              "Pancreas",
            ]}
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
