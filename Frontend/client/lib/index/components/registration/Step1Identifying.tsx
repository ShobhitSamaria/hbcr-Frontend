import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useFormStateOptional } from "@/lib/formState";
import { Field, SelectField, ToggleDetails } from "../FormFields";

type Step1IdentifyingProps = {
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
  referral,
  setReferral,
  selectedIds,
  setSelectedIds,
  sameAddress,
  setSameAddress,
  familyHistory,
  setFamilyHistory,
}: Step1IdentifyingProps) {
  const ctx = useFormStateOptional();
  const { session } = useAuth();

  // Reporting institution + centre code come from the logged-in hospital's
  // profile (returned by the auth API); the fields are read-only.
  const hospitalName = session?.hospital?.name ?? "";
  const centreCode = session?.hospital?.centre?.code ?? "";

  // Keep the auto-populated values in the form-state capture so validation
  // and the submit snapshot always see the logged-in hospital, even though
  // the inputs are read-only and never fire a change event.
  useEffect(() => {
    if (hospitalName) {
      ctx?.set("1. Name of the Reporting Institution (RI)", hospitalName);
    }
  }, [hospitalName, ctx]);
  useEffect(() => {
    if (centreCode) {
      ctx?.set("Centre code", centreCode);
    }
  }, [centreCode, ctx]);

  // 4. Hospital Registration Number — controlled so the matching input
  // only appears once a type is picked. Restored from the form-state context
  // so the choice survives step navigation.
  const [hospitalRegType, setHospitalRegType] = useState<string>(() => {
    const cur = ctx?.values.current["4. Hospital Registration Number (MRD / CR / Unique ID)"];
    return typeof cur === "string" && cur !== "" ? cur : "";
  });
  const handleHospitalRegType = (v: string) => {
    setHospitalRegType(v);
    ctx?.set("4. Hospital Registration Number (MRD / CR / Unique ID)", v);
  };

  // 15. Urban / Rural — same capture-into-context pattern as above.
  const [urbanRural, setUrbanRural] = useState<string>(() => {
    const cur = ctx?.values.current["Urban / Rural"];
    return typeof cur === "string" ? cur : "";
  });
  const handleUrbanRural = (v: string) => {
    setUrbanRural(v);
    ctx?.set("Urban / Rural", v);
  };

  // 6. Case Registered Through — controlled so the field starts with NO
  // option selected (previously it defaulted to "Out Patient"). The user
  // must explicitly choose; validation rejects the "Select" placeholder.
  const [caseThrough, setCaseThrough] = useState<string>(() => {
    const cur = ctx?.values.current["6. Case Registered Through (Patient’s first reporting at RI)"];
    return typeof cur === "string" && cur !== "" ? cur : "";
  });
  const handleCaseThrough = (v: string) => {
    setCaseThrough(v);
    ctx?.set("6. Case Registered Through (Patient’s first reporting at RI)", v);
  };

  // 10. Date of Birth → 11. Age — age is derived from the DOB and read-only.
  const [dob, setDob] = useState<string>(() => {
    const cur = ctx?.values.current["10. Date of Birth"];
    return typeof cur === "string" ? cur : "";
  });
  const ageFromDob = (dobStr: string): string => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobStr);
    if (!m) return "";
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return "";
    const now = new Date();
    let age = now.getFullYear() - y;
    const monthDiff = now.getMonth() + 1 - mo;
    const dayDiff = now.getDate() - d;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
    return age >= 0 ? String(age) : "";
  };
  const handleDobChange = (v: string) => {
    setDob(v);
    // Field already writes ctx["10. Date of Birth"]; push the recalculated
    // age into the form-state so the submit snapshot sees it.
    ctx?.set("11. Age", ageFromDob(v));
  };

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Field
          label="1. Name of the Reporting Institution (RI)"
          placeholder="e.g. AIIMS New Delhi"
          value={hospitalName}
          readOnly
        />
        <Field
          label="Centre code"
          placeholder="e.g. DL001"
          value={centreCode}
          readOnly
        />
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
        <SelectField
          label="4. Hospital Registration Number (MRD / CR / Unique ID)"
          value={hospitalRegType}
          onChange={handleHospitalRegType}
          options={[
            "Select type",
            "ABHA",
            "Aadhaar",
            "MRD No",
            "CR No.",
            "Unique Hospital Identification Number",
          ]}
        />
        {hospitalRegType && hospitalRegType !== "Select type" && (
          <Field
            label="4. Hospital registration number"
            placeholder={`Enter ${hospitalRegType} number`}
          />
        )}
        <Field label="5. Date of reporting" type="date" />
        <SelectField
          label="6. Case Registered Through (Patient’s first reporting at RI)"
          value={caseThrough}
          onChange={handleCaseThrough}
          options={[
            "Select",
            "Out Patient",
            "In Patient Elective",
            "In Patient Emergency",
            "Unknown Person",
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
            <Field
              label="7(b). Hospital / LAB / N.H."
              placeholder="Enter Hospital / LAB / N.H."
            />
            <Field label="7(c). City" placeholder="City" />
            <Field label="7(d). District" placeholder="District" />
            <Field label="7(e). Pincode" placeholder="Pincode" />
            <Field label="7(f). Date of Registration" type="date" />
          </>
        )}
        <Field label="8. Date of first diagnosis" type="date" />
      </div>
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          9. Patient Full Name
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="First Name" placeholder="First name" />
          <Field label="Middle Name" placeholder="Middle name" />
          <Field label="Last Name" placeholder="Last name" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="10. Date of Birth"
          type="date"
          value={dob}
          onChange={handleDobChange}
        />
        <Field
          label="11. Age"
          type="number"
          placeholder="Years"
          value={ageFromDob(dob)}
          readOnly
        />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <HealthSchemeField />
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
          <Field label="Other name" placeholder="Full name" />
          <Field
            label="Other mobile number"
            placeholder="Mobile number"
          />
        </div>
      </div>
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          15. Address
        </label>
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#718991]">
          <span className="text-[11px] font-bold text-[#5d7a84]">
            Urban / Rural
          </span>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="urban-rural"
              checked={urbanRural === "Urban"}
              onChange={() => handleUrbanRural("Urban")}
              className="accent-[#0b7d87]"
            />
            Urban
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="urban-rural"
              checked={urbanRural === "Rural"}
              onChange={() => handleUrbanRural("Rural")}
              className="accent-[#0b7d87]"
            />
            Rural
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Flat / House No."
            placeholder="House number"
          />
          <Field label="Ward No." placeholder="Ward number" />
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
      <Field
        label="Occupation"
        placeholder="Enter occupation"
      />
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

/**
 * Field 13 - Beneficiary of Health Scheme (RGHS / MAAYOGNA / CGHS).
 * Yes/No radios; when Yes, a free-text field appears for scheme details.
 * Values are written into the form-state context (keyed by label) so the
 * submit pipeline can persist them on the patient record.
 */
function HealthSchemeField() {
  const ctx = useFormStateOptional();
  const [answer, setAnswer] = useState<string>(() => {
    const cur = ctx?.values.current[
      "13. Beneficiary of Health Scheme (RGHS / MAAYOGNA / CGHS)"
    ];
    return typeof cur === "string" ? cur : "No";
  });
  const handle = (v: string) => {
    setAnswer(v);
    ctx?.set("13. Beneficiary of Health Scheme (RGHS / MAAYOGNA / CGHS)", v);
  };
  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center gap-x-5 text-xs text-[#718991]">
        <span className="min-w-0">
          f). Beneficiary of Health Scheme (RGHS / MAAYOGNA / CGHS)
        </span>
        <span className="flex items-center gap-4 whitespace-nowrap">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="health-scheme"
              checked={answer === "Yes"}
              onChange={() => handle("Yes")}
              className="accent-[#0b7d87]"
            />
            Yes
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="health-scheme"
              checked={answer === "No"}
              onChange={() => handle("No")}
              className="accent-[#0b7d87]"
            />
            No
          </label>
        </span>
      </div>
      {answer === "Yes" && (
        <div className="sm:w-1/2">
          <Field
            label="13. Beneficiary of Health Scheme details"
            placeholder="Enter scheme name / details"
          />
        </div>
      )}
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
        19. Relationship to Cancer / Degree of Relationship
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
