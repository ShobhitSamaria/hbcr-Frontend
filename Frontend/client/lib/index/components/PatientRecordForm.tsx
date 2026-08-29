/**
 * PatientRecordForm — reuses the existing Patient Registration form components
 * for viewing/editing an existing patient record.
 *
 * Fields 1–12, 15, and 19 are always read-only.
 * All other fields are editable when the user clicks Edit.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Pencil, Save, X } from "lucide-react";
import {
  patientApi,
  registrationApi,
  sideApi,
  pathologyApi,
  familyHistoryApi,
  type ApiPatient,
  type ApiRegistration,
} from "@/lib/api";
import { FormStateProvider, useFormStateOptional } from "@/lib/formState";
import { ValidationProvider } from "@/lib/validationContext";
import { AuthProvider } from "@/lib/auth";
import { Step1Identifying } from "./registration/Step1Identifying";
import { Step2Diagnostic } from "./registration/Step2Diagnostic";
import { ClinicalTreatment } from "./registration/ClinicalTreatment";

type PatientRecordFormProps = {
  patientId: number;
  onBack: () => void;
};

/** Fields that are always read-only in Patient Records view. */
const READONLY_FIELDS = new Set([
  // 1. Name of Reporting Institution (auto-filled)
  "1. Name of the Reporting Institution (RI)",
  "Centre code",
  "Reference Number",
  "Registration Number",
  // 3(a-b). Department & Unit
  "3(a). Department name",
  "3(b). Unit number",
  // 5. Date of reporting
  "5. Date of reporting",
  // 6. Case Registered Through
  "6. Case Registered Through (Patient's first reporting at RI)",
  "6(a). Case Registered Through (Other)",
  // 7. Type of referral
  "7. Type of referral",
  // 8. Date of first diagnosis
  "8. Date of first diagnosis",
  // 9. Patient Full Name
  "First Name",
  "Middle Name",
  "Last Name",
  // 10. Date of Birth
  "10. Date of Birth",
  // 11. Age
  "11. Age",
  // 12. Gender
  "12. Gender",
  // 15. Address
  "Urban / Rural",
  "15. Address",
  "Flat / House No.",
  "Ward No.",
  "Street / Road",
  "City",
  "District",
  "State",
  "PIN Code",
  "Mobile number",
  "Email address",
  "Duration of Stay at the above address (in years)",
  "Residential Address is same as Permanent Address",
  // 19. Family Cancer History
  "19. Relationship to Cancer / Degree of Relationship",
]);

/** Bridges form state from inside FormStateProvider to the parent via a ref. */
function FormStateBridge({ snapshotRef }: { snapshotRef: React.MutableRefObject<Record<string, unknown>> }) {
  const ctx = useFormStateOptional();
  useEffect(() => {
    if (!ctx) return;
    snapshotRef.current = { ...ctx.values.current };
  });
  return null;
}

export function PatientRecordForm({ patientId, onBack }: PatientRecordFormProps) {
  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [registrations, setRegistrations] = useState<ApiRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Lifted state for Step1Identifying
  const [referral, setReferral] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sameAddress, setSameAddress] = useState(false);
  const [familyHistory, setFamilyHistory] = useState("No");

  // Ref to capture form state from inside FormStateProvider
  const formSnapshotRef = useRef<Record<string, unknown>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, regs] = await Promise.all([
        patientApi.get(patientId),
        registrationApi.forPatient(patientId),
      ]);
      setPatient(p);
      setRegistrations(regs);

      // Set lifted state from loaded data
      const firstReg = regs[0];
      if (firstReg) {
        setReferral(firstReg.referralType ?? "Self");
        setFamilyHistory(firstReg.familialCancerHistory?.familyHistory === "YES" ? "Yes" : firstReg.familialCancerHistory?.familyHistory === "UNKNOWN" ? "Unknown" : "No");
      }
      // Set sameAddress from addresses
      const resAddr = p.addresses?.find((a) => a.addressType === "RESIDENTIAL");
      const permAddr = p.addresses?.find((a) => a.addressType === "PERMANENT");
      if (resAddr && permAddr) {
        setSameAddress(resAddr.flatHouseNo === permAddr.flatHouseNo && resAddr.city === permAddr.city);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patient");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /** Explicit reverse mapping: Prisma enum → form option label. */
  const ENUM_DISPLAY: Record<string, string> = {
    out_patient: "Out Patient",
    in_patient_elective: "In Patient Elective",
    in_patient_emergency: "In Patient Emergency",
    other_hospital: "Other Hospital/Health Facility",
    screen_detected: "Screen Detected Referral",
    self: "Self",
    married: "Married",
    single: "Single",
    widowed: "Widowed",
    divorced: "Divorced",
    separated: "Separated",
    other: "Other",
    unknown: "Unknown",
    illiterate: "Illiterate",
    literate: "Literate",
    primary: "Primary",
    middle: "Middle",
    secondary_higher_secondary: "Secondary/Higher Secondary",
    technical_after_matric: "Technical-after matric",
    graduate_and_above: "Graduate and above",
    others: "Others (specify)",
    male: "Male",
    female: "Female",
  };
  /** Convert Prisma enum value (lowercase) to display string used in form options. */
  const toDisplay = (val: string | null | undefined): string => {
    if (!val) return "";
    const key = val.toLowerCase();
    return ENUM_DISPLAY[key] ?? val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };
  /** Convert ISO date string to YYYY-MM-DD for <input type="date">. */
  const toDateStr = (val: string | null | undefined): string => {
    if (!val) return "";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  /** Build initial values for FormState from loaded API data. */
  const initialValues = useMemo(() => {
    if (!patient || !registrations[0]) return {};
    const reg = registrations[0];
    const res = patient.addresses?.find((a) => a.addressType === "RESIDENTIAL");
    const perm = patient.addresses?.find((a) => a.addressType === "PERMANENT");
    const aadhaar = patient.identifications?.find((i) => i.idType === "AADHAAR");
    const abha = patient.identifications?.find((i) => i.idType === "ABHA");
    const pan = patient.identifications?.find((i) => i.idType === "PAN_CARD");
    const voter = patient.identifications?.find((i) => i.idType === "VOTER_ID");
    const passport = patient.identifications?.find((i) => i.idType === "PASSPORT");
    const abPmjay = patient.identifications?.find((i) => i.idType === "AB_PMJAY");
    const otherIds = patient.identifications?.filter((i) => i.idType === "OTHER") ?? [];
    const father = patient.relatives?.find((r) => r.relationship === "FATHER");
    const mother = patient.relatives?.find((r) => r.relationship === "MOTHER");
    const spouse = patient.relatives?.find((r) => r.relationship === "SPOUSE");
    const son = patient.relatives?.find((r) => r.relationship === "SON");
    const daughter = patient.relatives?.find((r) => r.relationship === "DAUGHTER");
    const otherRel = patient.relatives?.find((r) => r.relationship === "OTHER");
    const fh = reg.familialCancerHistory;

    const vals: Record<string, unknown> = {
      // Step 1 — read-only fields
      "1. Name of the Reporting Institution (RI)": "",
      "Centre code": "",
      "Reference Number": reg.referenceNo ?? "",
      "Registration Number": reg.hbcrRegistrationNo ?? "",
      "3(a). Department name": reg.departmentName ?? "",
      "3(b). Unit number": reg.unitNumber ?? "",
      "5. Date of reporting": toDateStr(reg.dateOfReporting),
      "6. Case Registered Through (Patient's first reporting at RI)": toDisplay(reg.caseRegisteredThrough),
      "6(a). Case Registered Through (Other)": reg.caseRegisteredThroughOther ?? "",
      "7. Type of referral": toDisplay(reg.referralType) || "Self",
      "7(a). Referral facility name": reg.referralFacilityName ?? "",
      "7(b). Referral facility city": reg.referralFacilityCity ?? "",
      "7(c). Referral facility district": reg.referralFacilityDistrict ?? "",
      "7(d). Referral facility pincode": reg.referralFacilityPincode ?? "",
      "7(e). Referral facility hospital/lab/NH": reg.referralFacilityHospitalLabNh ?? "",
      "7(f). Referral facility reg date": reg.referralFacilityRegDate ?? "",
      "8. Date of first diagnosis": toDateStr(reg.dateOfFirstDiagnosis),
      // Step 1 — editable fields
      "First Name": patient.firstName ?? "",
      "Middle Name": patient.middleName ?? "",
      "Last Name": patient.lastName ?? "",
      "10. Date of Birth": toDateStr(patient.dateOfBirth),
      "11. Age": patient.age != null ? String(patient.age) : "",
      "12. Gender": patient.gender ?? "",
      // 13. Identifications
      "a). Aadhaar": aadhaar?.number ?? "",
      "b). ABHA": abha?.number ?? "",
      "id-c). PAN Card": pan ? "Yes" : "No",
      "Enter c). PAN Card number": pan?.number ?? "",
      "id-d). Voter ID": voter ? "Yes" : "No",
      "Enter d). Voter ID number": voter?.number ?? "",
      "id-e). Passport": passport ? "Yes" : "No",
      "Enter e). Passport number": passport?.number ?? "",
      "id-f). AB-PMJAY": abPmjay ? "Yes" : "No",
      "Enter f). AB-PMJAY number": abPmjay?.number ?? "",
      "id-g). Other": otherIds.length > 0 ? "Yes" : "No",
      "Enter g). Other number": otherIds[0]?.number ?? "",
      "g). Other ID Name": otherIds[0]?.idName ?? "",
      "health-scheme": patient.healthSchemeBeneficiary ? "Yes" : "No",
      "13. Beneficiary of Health Scheme (RGHS / MAAYOGNA / CGHS)": patient.healthSchemeBeneficiary ? "Yes" : "No",
      "13. Beneficiary of Health Scheme details": patient.healthSchemeDetails ?? "",
      // 14. Relatives
      "Father name": father?.name ?? "",
      "Father mobile number": father?.mobileNumber ?? "",
      "Mother name": mother?.name ?? "",
      "Mother mobile number": mother?.mobileNumber ?? "",
      "Spouse name": spouse?.name ?? "",
      "Spouse mobile number": spouse?.mobileNumber ?? "",
      "Son name": son?.name ?? "",
      "Son mobile number": son?.mobileNumber ?? "",
      "Daughter name": daughter?.name ?? "",
      "Daughter mobile number": daughter?.mobileNumber ?? "",
      "Other name": otherRel?.name ?? "",
      "Other mobile number": otherRel?.mobileNumber ?? "",
      // 15. Address (read-only)
      "Urban / Rural": res?.urbanRural ?? "",
      "Flat / House No.": res?.flatHouseNo ?? "",
      "Ward No.": res?.wardNo ?? "",
      "Street / Road": res?.streetRoad ?? "",
      "City": res?.city ?? "",
      "District": res?.district ?? "",
      "State": res?.state ?? "",
      "PIN Code": res?.pinCode ?? "",
      "Mobile number": res?.mobileNumber ?? "",
      "Email address": res?.email ?? "",
      "Duration of Stay at the above address (in years)": "",
      "Residential Address is same as Permanent Address": sameAddress,
      // 16. Marital Status
      "16. Marital status": toDisplay(reg.maritalStatus),
      "16(a). Marital status (Other)": reg.maritalStatusOther ?? "",
      // 17. Education
      "17. Education": toDisplay(reg.education),
      "17(a). Education (Other)": reg.educationOther ?? "",
      // Anthropometric
      "Anthropometric Height (cm)": reg.anthropometricHeightCm ?? "",
      "Anthropometric Weight (kg)": reg.anthropometricWeightKg ?? "",
      // Occupation
      "Occupation": reg.occupation ?? "",
      // Contact / Designation (on registration)
      "Name of Person Completing Form (in capitals)": reg.formCompletedBy ?? "",
      "Designation": reg.designation ?? "",
      "Contact Number": reg.contactNumber ?? "",
      "Date of Completion of this Form": toDateStr(reg.formCompletionDate),
      // 18. Habits / Comorbidities — managed via ToggleDetails
      // 19. Family History
      "19. Relationship to Cancer / Degree of Relationship": fh?.familyHistory === "YES" ? "Yes" : fh?.familyHistory === "UNKNOWN" ? "Unknown" : "No",
    };
    return vals;
  }, [patient, registrations, sameAddress]);

  const handleSave = async () => {
    if (!patient || !registrations[0]) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const reg = registrations[0];
      const fs = formSnapshotRef.current;
      const str = (key: string): string => {
        const v = fs[key];
        return typeof v === "string" ? v.trim() : "";
      };

      // 1. Update registration-level editable fields
      await registrationApi.update(reg.id, {
        remarks: str("Remarks") || undefined,
        designation: str("Designation") || undefined,
        contactNumber: str("Contact Number") || undefined,
        formCompletedBy: str("Name of Person Completing Form (in capitals)") || undefined,
      });

      // 2. Save family history
      if (familyHistory) {
        const fhVal = familyHistory === "Yes" ? "YES" : familyHistory === "Unknown" ? "UNKNOWN" : "NO";
        await familyHistoryApi.upsert(reg.id, { familyHistory: fhVal });
      }

      setSaveSuccess(true);
      setEditMode(false);
      await loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#087888]" />
        <span className="ml-3 text-sm text-[#82979e]">Loading patient record…</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[#087888]">
          <ArrowLeft size={16} /> Back to Patient Records
        </button>
        <p className="text-sm text-[#d04a4a]">{error || "Patient not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-[#dce9eb] bg-white px-4 py-2.5 text-xs font-bold text-[#087888] transition hover:bg-[#e8f5f5]"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#103e54]">
              {patient.fullName}
            </h2>
            <p className="text-sm text-[#82979e]">
              {editMode ? "Editing patient record" : "Patient record"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="rounded-lg bg-[#e8f6ec] px-3 py-1.5 text-xs font-bold text-[#30935c]">
              Saved successfully
            </span>
          )}
          {saveError && (
            <span className="rounded-lg bg-[#fde8e8] px-3 py-1.5 text-xs font-bold text-[#d04a4a]">
              {saveError}
            </span>
          )}
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 rounded-xl bg-[#0b7d87] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#096a73]"
            >
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => { setEditMode(false); setSaveError(null); setSaveSuccess(false); }}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-[#dce9eb] bg-white px-4 py-2.5 text-xs font-bold text-[#6d858e] transition hover:bg-[#f0f4f5] disabled:opacity-50"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#0b7d87] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#096a73] disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Registration form — all 3 steps */}
      <div className="rounded-2xl border border-[#e3edef] bg-white shadow-[0_5px_20px_rgba(25,73,89,.035)] p-5 sm:p-6">
        <AuthProvider>
          {/* key on FormStateProvider forces full remount when patient data loads,
              so all children mount fresh and read initial values from the ref. */}
          <FormStateProvider
            key={`fs-${patient.id}-${registrations[0]?.id ?? 0}`}
            readOnlyFields={READONLY_FIELDS}
            initialValues={initialValues}
            forceReadOnly={!editMode}
          >
            <ValidationProvider>
              <FormStateBridge snapshotRef={formSnapshotRef} />
              <RegistrationSteps
                editMode={editMode}
                referral={referral}
                setReferral={setReferral}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                sameAddress={sameAddress}
                setSameAddress={setSameAddress}
                familyHistory={familyHistory}
                setFamilyHistory={setFamilyHistory}
                initialCaseThrough={initialValues["6. Case Registered Through (Patient's first reporting at RI)"] as string || ""}
                initialCaseThroughOther={initialValues["6(a). Case Registered Through (Other)"] as string || ""}
                initialMaritalStatus={initialValues["16. Marital status"] as string || ""}
                initialEducation={initialValues["17. Education"] as string || ""}
              />
            </ValidationProvider>
          </FormStateProvider>
        </AuthProvider>
      </div>
    </div>
  );
}

/**
 * Renders the 3 registration steps with a step selector.
 * In view mode, all steps are shown as read-only.
 * In edit mode, only non-read-only fields are editable.
 */
function RegistrationSteps({
  editMode,
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
}: {
  editMode: boolean;
  referral: string;
  setReferral: (v: string) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  sameAddress: boolean;
  setSameAddress: (v: boolean) => void;
  familyHistory: string;
  setFamilyHistory: (v: string) => void;
  initialCaseThrough: string;
  initialCaseThroughOther: string;
  initialMaritalStatus: string;
  initialEducation: string;
}) {
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6">
      {/* Step tabs */}
      <div className="flex gap-2 border-b border-[#edf3f4] pb-3">
        {[
          { num: 1, label: "Identifying Information" },
          { num: 2, label: "Diagnostic Details" },
          { num: 3, label: "Clinical Stage & Treatment" },
        ].map(({ num, label }) => (
          <button
            key={num}
            onClick={() => setStep(num)}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              step === num
                ? "bg-[#0b7d87] text-white"
                : "bg-[#f0f4f5] text-[#6d858e] hover:bg-[#e4edef]"
            }`}
          >
            {num}. {label}
          </button>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && (
        <Step1Identifying
          referral={referral}
          setReferral={setReferral}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          sameAddress={sameAddress}
          setSameAddress={setSameAddress}
          familyHistory={familyHistory}
          setFamilyHistory={setFamilyHistory}
          initialCaseThrough={initialCaseThrough}
          initialCaseThroughOther={initialCaseThroughOther}
          initialMaritalStatus={initialMaritalStatus}
          initialEducation={initialEducation}
        />
      )}
      {step === 2 && <Step2Diagnostic />}
      {step === 3 && <ClinicalTreatment />}
    </div>
  );
}
