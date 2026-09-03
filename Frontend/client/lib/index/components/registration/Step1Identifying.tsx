import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useFormStateOptional, useForceReadOnly } from "@/lib/formState";
import { useValidationOptional } from "@/lib/validationContext";
import { registrationApi } from "@/lib/api";
import { Field, SelectField, ToggleDetails } from "../FormFields";
import { DistrictPincodeFields } from "./DistrictPincodeFields";

type Step1IdentifyingProps = {
  referral: string;
  setReferral: (v: string) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  sameAddress: boolean;
  setSameAddress: (v: boolean) => void;
  familyHistory: string;
  setFamilyHistory: (v: string) => void;
  /** Pre-populated values for edit mode (from PatientRecordForm) */
  initialCaseThrough?: string;
  initialCaseThroughOther?: string;
  initialMaritalStatus?: string;
  initialEducation?: string;
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
  initialCaseThrough,
  initialCaseThroughOther,
  initialMaritalStatus,
  initialEducation,
}: Step1IdentifyingProps) {
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();
  const { session } = useAuth();
  const readOnly = useForceReadOnly();

  // Reporting institution + centre code come from the logged-in hospital's
  // profile (returned by the auth API); the fields are read-only.
  const hospitalName = session?.hospital?.name ?? "";
  const hospitalId = session?.user?.hospitalId;
  const centreCode = session?.hospital?.centre?.code ?? "";

  // Auto-generated Reference Number and Registration Number
  const [previewNumbers, setPreviewNumbers] = useState<{
    referenceNo: string;
    registrationNo: string;
  } | null>(null);
  const fetchedRef = useRef<number | null>(null);

  // Fetch preview numbers once when hospital is known.
  // We intentionally do NOT list `ctx` as a dependency — the form-state
  // context object identity changes on every render, which would cause
  // an infinite loop of API calls.
  useEffect(() => {
    if (!hospitalId || fetchedRef.current === hospitalId) return;
    fetchedRef.current = hospitalId;
    let cancelled = false;
    registrationApi
      .previewNumbers(hospitalId)
      .then((result) => {
        if (cancelled) return;
        setPreviewNumbers({
          referenceNo: result.referenceNo,
          registrationNo: result.registrationNo,
        });
      })
      .catch(() => {
        // API not available yet (e.g. migration pending) — leave fields
        // empty so submit relies on backend auto-generation.
        if (cancelled) return;
        setPreviewNumbers(null);
      });
    return () => { cancelled = true; };
  }, [hospitalId]);

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
    if (initialCaseThrough && initialCaseThrough !== "") return initialCaseThrough;
    const cur = ctx?.values.current["6. Case Registered Through (Patient’s first reporting at RI)"];
    return typeof cur === "string" && cur !== "" ? cur : "";
  });
  // Sync from context/prop when values change (e.g., when loading patient record for edit)
  useEffect(() => {
    const newVal = initialCaseThrough && initialCaseThrough !== "" ? initialCaseThrough : (ctx?.values.current["6. Case Registered Through (Patient’s first reporting at RI)"] as string | undefined);
    if (typeof newVal === "string" && newVal !== "" && newVal !== caseThrough) {
      setCaseThrough(newVal);
    }
  });
  const handleCaseThrough = (v: string) => {
    setCaseThrough(v);
    ctx?.set("6. Case Registered Through (Patient’s first reporting at RI)", v);
    if (v !== "Other") ctx?.set("6(a). Case Registered Through (Other)", "");
  };
  const [caseThroughOther, setCaseThroughOther] = useState<string>(() => {
    if (initialCaseThroughOther && initialCaseThroughOther !== "") return initialCaseThroughOther;
    const cur = ctx?.values.current["6(a). Case Registered Through (Other)"];
    return typeof cur === "string" ? cur : "";
  });
  const handleCaseThroughOther = (v: string) => {
    setCaseThroughOther(v);
    ctx?.set("6(a). Case Registered Through (Other)", v);
  };

  // 16. Marital Status — when "Other" is selected, show a text input.
  const [maritalStatus, setMaritalStatus] = useState<string>(() => {
    if (initialMaritalStatus && initialMaritalStatus !== "") return initialMaritalStatus;
    const cur = ctx?.values.current["16. Marital status"];
    return typeof cur === "string" ? cur : "";
  });
  // Sync from context/prop when values change (e.g., when loading patient record for edit)
  useEffect(() => {
    const newVal = initialMaritalStatus && initialMaritalStatus !== "" ? initialMaritalStatus : (ctx?.values.current["16. Marital status"] as string | undefined);
    if (typeof newVal === "string" && newVal !== "" && newVal !== maritalStatus) {
      setMaritalStatus(newVal);
    }
  });
  const handleMaritalStatus = (v: string) => {
    setMaritalStatus(v);
    ctx?.set("16. Marital status", v);
    if (v !== "Other") ctx?.set("16(a). Marital status (Other)", "");
  };
  const [maritalOther, setMaritalOther] = useState<string>(() => {
    const cur = ctx?.values.current["16(a). Marital status (Other)"];
    return typeof cur === "string" ? cur : "";
  });
  const handleMaritalOther = (v: string) => {
    setMaritalOther(v);
    ctx?.set("16(a). Marital status (Other)", v);
  };

  // 17. Education — when "Others (specify)" is selected, show a text input.
  const [education, setEducation] = useState<string>(() => {
    if (initialEducation && initialEducation !== "") return initialEducation;
    const cur = ctx?.values.current["17. Education"];
    return typeof cur === "string" ? cur : "";
  });
  // Sync from context/prop when values change (e.g., when loading patient record for edit)
  useEffect(() => {
    const newVal = initialEducation && initialEducation !== "" ? initialEducation : (ctx?.values.current["17. Education"] as string | undefined);
    if (typeof newVal === "string" && newVal !== "" && newVal !== education) {
      setEducation(newVal);
    }
  });
  const handleEducation = (v: string) => {
    setEducation(v);
    ctx?.set("17. Education", v);
    if (v !== "Others (specify)") ctx?.set("17(a). Education (Other)", "");
  };
  const [educationOther, setEducationOther] = useState<string>(() => {
    const cur = ctx?.values.current["17(a). Education (Other)"];
    return typeof cur === "string" ? cur : "";
  });
  const handleEducationOther = (v: string) => {
    setEducationOther(v);
    ctx?.set("17(a). Education (Other)", v);
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
          required
        />
        <Field
          label="Centre code"
          placeholder="e.g. DL001"
          value={centreCode}
          readOnly
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Field
          label="Reference Number"
          value={previewNumbers?.referenceNo ?? ""}
          readOnly
          placeholder="Auto-generated on submission"
        />
        <Field
          label="Registration Number"
          value={previewNumbers?.registrationNo ?? ""}
          readOnly
          placeholder="Auto-generated on submission"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Field label="3(a). Department name" placeholder="Oncology" required />
        <Field label="3(b). Unit number" placeholder="Unit 04" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Field label="5. Date of reporting" type="date" required />
        <SelectField
          label="6. Case Registered Through (Patient’s first reporting at RI)"
          value={caseThrough}
          onChange={handleCaseThrough}
          options={["Out Patient", "In Patient Elective", "In Patient Emergency", "Unknown", "Other"]}
          required
        />
        {caseThrough === "Other" && (
          <Field
            label="6(a). Case Registered Through (Other)"
            placeholder="Specify other case registered through"
            value={caseThroughOther}
            onChange={handleCaseThroughOther}
          />
        )}
        <SelectField
          label="7. Type of referral"
          value={referral}
          required
          onChange={setReferral}
          options={[
            "Self",
            "Other Hospital/Health Facility",
            "Screen Detected Referral",
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
        <Field label="8. Date of first diagnosis" type="date" required />
      </div>
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          9. Patient Full Name
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="First Name" placeholder="First name" required />
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
          required
        />
        <Field
          label="11. Age"
          type="number"
          placeholder="Years"
          value={ageFromDob(dob)}
          readOnly
          required
        />
        <SelectField
          label="12. Gender"
          options={["Male", "Female", "Other"]}
          required
        />
      </div>
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          13. Unique identification
        </label>
        <div className="space-y-3">
          {/* Aadhaar & ABHA — mandatory, direct input fields (no Yes/No) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="a). Aadhaar"
              placeholder="Enter Aadhaar number (12 digits)"
              maxLength={12}
              required
              stateKey="a). Aadhaar number"
            />
            <Field
              label="b). ABHA"
              placeholder="Enter ABHA number (14 digits)"
              maxLength={14}
              required
              stateKey="b). ABHA number"
            />
          </div>
          {/* Remaining ID types — optional, with Yes/No toggle */}
          {([
            { label: "c). PAN Card", maxLength: 10, pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/, formatMsg: "PAN must be 5 uppercase letters + 4 digits + 1 uppercase letter" },
            { label: "d). Voter ID", maxLength: 10, pattern: /^[A-Za-z0-9]{10}$/, formatMsg: "Voter ID must be exactly 10 alphanumeric characters" },
            { label: "e). Passport", maxLength: 8, pattern: /^[A-Z][0-9]{7}$/, formatMsg: "Passport must be 1 uppercase letter + 7 digits" },
            { label: "f). AB-PMJAY", maxLength: 20, pattern: /^[A-Za-z0-9\-]+$/, formatMsg: "AB-PMJAY ID contains invalid characters" },
            { label: "g). Other", maxLength: 128 },
          ]).map(({ label, maxLength, pattern, formatMsg }) => {
            const numKey = label + " number";
            const nameKey = label + " name";
            const isSelected = selectedIds.includes(label);
            const isOther = label === "g). Other";
            return (
              <div
                key={label}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#718991]"
              >
                <span className="w-28">{label}</span>
                <span className="flex items-center gap-1.5">
                  <input
                    disabled={readOnly}
                    type="radio"
                    name={"id-" + label}
                    checked={!isSelected}
                    onChange={() => {
                      setSelectedIds(selectedIds.filter((x) => x !== label));
                      ctx?.set("id-" + label, "No");
                    }}
                    className="accent-[#0b7d87]"
                  />
                  No
                </span>
                <span className="flex items-center gap-1.5">
                  <input
                    disabled={readOnly}
                    type="radio"
                    name={"id-" + label}
                    checked={isSelected}
                    onChange={() => {
                      if (!isSelected) setSelectedIds([...selectedIds, label]);
                      ctx?.set("id-" + label, "Yes");
                    }}
                    className="accent-[#0b7d87]"
                  />
                  Yes
                </span>
                {isOther && isSelected && (
                  <div className="flex flex-col">
                    <OtherIdInput
                      placeholder="Enter identification name/type (e.g. Card Name)"
                      stateKey={nameKey}
                      onBlur={() => validation?.markTouched(nameKey)}
                      hasError={!!(validation?.errors[nameKey] && (validation.forceShow.has(nameKey) || validation.touched.has(nameKey)))}
                      errorMessage={validation?.errors[nameKey]}
                    />
                    {validation?.errors[nameKey] && (validation.forceShow.has(nameKey) || validation.touched.has(nameKey)) && (
                      <span className="mt-0.5 text-[10px] font-medium text-[#d04a4a]">
                        {validation.errors[nameKey]}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex flex-col">
                  <OtherIdInput
                    placeholder={isOther ? "Enter identification number" : "Enter " + label + " number"}
                    stateKey={numKey}
                    disabled={!isSelected}
                    maxLength={maxLength}
                    onBlur={() => validation?.markTouched(numKey)}
                    hasError={!!(validation?.errors[numKey] && (validation.forceShow.has(numKey) || validation.touched.has(numKey)))}
                    errorMessage={validation?.errors[numKey]}
                    isErrorStyle={isSelected}
                  />
                  {validation?.errors[numKey] && (validation.forceShow.has(numKey) || validation.touched.has(numKey)) && (
                    <span className="mt-0.5 text-[10px] font-medium text-[#d04a4a]">
                      {validation.errors[numKey]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
          <Field label="Son name" placeholder="Full name" />
          <Field
            label="Son mobile number"
            placeholder="Mobile number"
          />
          <Field label="Daughter name" placeholder="Full name" />
          <Field
            label="Daughter mobile number"
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
          15. Address<span className="ml-0.5 text-[#d04a4a]">*</span>
        </label>
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#718991]">
          <span className="text-[11px] font-bold text-[#5d7a84]">
            Urban / Rural
          </span>
          <label className="flex items-center gap-1.5">
            <input
              disabled={readOnly}
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
              disabled={readOnly}
              type="radio"
              name="urban-rural"
              checked={urbanRural === "Rural"}
              onChange={() => handleUrbanRural("Rural")}
              className="accent-[#0b7d87]"
            />
            Rural
          </label>
        </div>
        {!urbanRural && (
          <p className="mb-2 text-[11px] italic text-[#96aab0]">
            Please select Urban or Rural to enter address details
          </p>
        )}
        {urbanRural && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Flat / House No."
                placeholder="House number"
                required 
              />
              <Field label="Ward No." placeholder="Ward number" />
              <Field label="Street / Road" placeholder="Street or road" required />
              <Field label="City" placeholder="City" required />
              <DistrictPincodeFields />
              <Field label="Mobile number" placeholder="Mobile number" required /> 
              <Field
                label="Email address"
                type="email"
                placeholder="patient@email.com"
              />
            </div>
            <div className="mt-4">
              <Field
                label="Duration of Stay at the above address (in years)"
                type="number"
                placeholder="e.g. 5"
                required
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
                     required
                     />
                <Field
                      label="Permanent Street / Road"
                      placeholder="Street or road"
                      required
                      />
                <Field
                     label="Permanent City"
                     placeholder="City"
                     required
                     />
                <DistrictPincodeFields prefix="Permanent " />
              </div>
            )}
          </>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <SelectField
          label="16. Marital status"
          value={maritalStatus}
          onChange={handleMaritalStatus}
          options={["Married", "Single", "Widowed", "Divorced", "Separated", "Other", "Unknown"]}
          required
        />
        {maritalStatus === "Other" && (
          <Field
            label="16(a). Marital status (Other)"
            placeholder="Specify other marital status"
            value={maritalOther}
            onChange={handleMaritalOther}
          />
        )}
        <SelectField
          label="17. Education"
          value={education}
          onChange={handleEducation}
          options={["Illiterate", "Literate", "Primary", "Middle", "Secondary/Higher Secondary", "Technical-after matric", "Graduate and above", "Others (specify)", "Unknown"]}
          required
        />
        {education === "Others (specify)" && (
          <Field
            label="17(a). Education (Other)"
            placeholder="Specify education level"
            value={educationOther}
            onChange={handleEducationOther}
          />
        )}
      </div>
      <Field
        label="Occupation"
        placeholder="Enter occupation"
      />
      <ToggleDetails
        title="18(a). Habits"
        required
        items={[
          "Smoking",
          "Smokeless",
          "Betel Nut with Tobacco",
          "Betel Nut without Tobacco",
          "Alcohol",
        ]}
      />
      <ToggleDetails
        title="18(b). Co-Morbidities"
        required
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
      {/* 19. Relationship to Cancer / Degree of Relationship */}
      <FamilialCancerSection
        familyHistory={familyHistory}
        setFamilyHistory={setFamilyHistory}
      />
    </div>
  );
}

/**
 * 19. Relationship to Cancer / Degree of Relationship.
 * Always visible on Step 1. Allows patient to declare family cancer history.
 */
function FamilialCancerSection({
  familyHistory,
  setFamilyHistory,
}: {
  familyHistory: string;
  setFamilyHistory: (v: string) => void;
}) {
  const readOnly = useForceReadOnly();
  const ctx = useFormStateOptional();

  // Sub-field state for "Yes" conditional fields
  const [relationshipCancer, setRelationshipCancer] = useState(
    () => (ctx?.values.current["Relationship with Cancer"] as string) ?? ""
  );
  const [degreeRelationship, setDegreeRelationship] = useState(
    () => (ctx?.values.current["Degree of Relationship"] as string) ?? ""
  );

  const handleRelationshipCancer = (v: string) => {
    setRelationshipCancer(v);
    ctx?.set("Relationship with Cancer", v);
  };
  const handleDegreeRelationship = (v: string) => {
    setDegreeRelationship(v);
    ctx?.set("Degree of Relationship", v);
  };
  return (
    <div>
      <label className="mb-3 block text-xs font-bold text-[#486b77]">
        19. Relationship to Cancer / Degree of Relationship
      </label>
      <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
        <span className="flex items-center gap-2">
          <input
            disabled={readOnly}
            type="radio"
            name="familial-history"
            checked={familyHistory === "Yes"}
            onChange={() => setFamilyHistory("Yes")}
            className="accent-[#0b7d87]"
          />
          Yes
        </span>
        <span className="flex items-center gap-2">
          <input
            disabled={readOnly}
            type="radio"
            name="familial-history"
            checked={familyHistory === "No"}
            onChange={() => setFamilyHistory("No")}
            className="accent-[#0b7d87]"
          />
          No
        </span>
        <span className="flex items-center gap-2">
          <input
            disabled={readOnly}
            type="radio"
            name="familial-history"
            checked={familyHistory === "Unknown"}
            onChange={() => setFamilyHistory("Unknown")}
            className="accent-[#0b7d87]"
          />
          Unknown
        </span>
      </div>
      {familyHistory === "Yes" && (
        <div className="mt-5 space-y-5 rounded-xl border border-[#e7f0f1] bg-[#fbfdfd] p-4">
          <div>
            <label className="mb-3 block text-xs font-bold text-[#486b77]">
              Relationship with Cancer <span className="text-[#d04a4a]">*</span>
            </label>
            <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
              <span className="flex items-center gap-2">
                <input
                  disabled={readOnly}
                  type="radio"
                  name="relationship-cancer"
                  checked={relationshipCancer === "Same Cancer"}
                  onChange={() => handleRelationshipCancer("Same Cancer")}
                  className="accent-[#0b7d87]"
                />
                Same Cancer
              </span>
              <span className="flex items-center gap-2">
                <input
                  disabled={readOnly}
                  type="radio"
                  name="relationship-cancer"
                  checked={relationshipCancer === "Other Cancer"}
                  onChange={() => handleRelationshipCancer("Other Cancer")}
                  className="accent-[#0b7d87]"
                />
                Other Cancer
              </span>
            </div>
          </div>
          <div>
            <label className="mb-3 block text-xs font-bold text-[#486b77]">
              Degree of Relationship <span className="text-[#d04a4a]">*</span>
            </label>
            <div className="flex flex-wrap gap-5 text-xs text-[#718991]">
              <span className="flex items-center gap-2">
                <input
                  disabled={readOnly}
                  type="radio"
                  name="degree-relationship"
                  checked={degreeRelationship === "First Degree Relative"}
                  onChange={() => handleDegreeRelationship("First Degree Relative")}
                  className="accent-[#0b7d87]"
                />
                First Degree Relative
              </span>
              <span className="flex items-center gap-2">
                <input
                  disabled={readOnly}
                  type="radio"
                  name="degree-relationship"
                  checked={degreeRelationship === "Second Degree Relative"}
                  onChange={() => handleDegreeRelationship("Second Degree Relative")}
                  className="accent-[#0b7d87]"
                />
                Second Degree Relative
              </span>
            </div>
          </div>
          <SelectField
            label="Primary site of tumor for relative"
            required
            options={["Breast", "Ovary", "Colon", "Prostate", "Endometrial", "Melanoma", "Thyroid", "Pancreas"]}
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

/**
 * Field 13 - Beneficiary of Health Scheme (RGHS / MAAYOGNA / CGHS).
 * Yes/No radios; when Yes, a free-text field appears for scheme details.
 * Values are written into the form-state context (keyed by label) so the
 * submit pipeline can persist them on the patient record.
 */
type OtherIdInputProps = {
  placeholder?: string;
  stateKey: string;
  disabled?: boolean;
  maxLength?: number;
  onBlur?: () => void;
  hasError?: boolean;
  errorMessage?: string;
  isErrorStyle?: boolean;
};

function OtherIdInput({
  placeholder,
  stateKey,
  disabled = false,
  maxLength,
  onBlur,
  hasError,
  errorMessage,
  isErrorStyle = true,
}: OtherIdInputProps) {
  const ctx = useFormStateOptional();
  const [innerValue, setInnerValue] = useState<string>(
    () => (ctx?.values.current[stateKey] != null ? String(ctx.values.current[stateKey]) : "")
  );
  return (
    <>
      <input
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        value={innerValue}
        onChange={(e) => {
          const v = e.target.value;
          setInnerValue(v);
          ctx?.set(stateKey, v);
        }}
        onBlur={onBlur}
        className={`h-8 w-44 rounded-lg border px-2 text-[11px] outline-none focus:ring-2 ${
          hasError
            ? "border-[#d04a4a] bg-[#fef2f2] focus:border-[#d04a4a] focus:ring-[#d04a4a]/15"
            : isErrorStyle
              ? "border-[#dce9eb] bg-[#fbfdfd] focus:border-[#36a99c] focus:ring-[#36a99c]/10"
              : "cursor-not-allowed border-[#dce9eb] bg-[#f1f5f5] text-[#a9b8bc]"
        }`}
      />
      {hasError && errorMessage && (
        <span className="mt-0.5 text-[10px] font-medium text-[#d04a4a]">
          {errorMessage}
        </span>
      )}
    </>
  );
}

function HealthSchemeField() {
  const readOnly = useForceReadOnly();
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
          <span className="flex items-center gap-1.5">
            <input
              disabled={readOnly}
              type="radio"
              name="health-scheme"
              checked={answer === "Yes"}
              onChange={() => handle("Yes")}
              className="accent-[#0b7d87]"
            />
            Yes
          </span>
          <span className="flex items-center gap-1.5">
            <input
              disabled={readOnly}
              type="radio"
              name="health-scheme"
              checked={answer === "No"}
              onChange={() => handle("No")}
              className="accent-[#0b7d87]"
            />
            No
          </span>
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
