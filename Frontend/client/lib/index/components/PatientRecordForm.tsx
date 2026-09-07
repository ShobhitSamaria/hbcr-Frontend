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
  treatmentApi,
  type ApiPatient,
  type ApiPatientIdentification,
  type ApiRegistration,
} from "@/lib/api";
import { extractPathology } from "@/lib/utils/hbcrForm";
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

/** Optional ID rows in Section 13 (label used by the Step-1 form ↔ idType in DB). */
const OPTIONAL_ID_DEFS: { label: string; idType: string }[] = [
  { label: "c). PAN Card", idType: "PAN_CARD" },
  { label: "d). Voter ID", idType: "VOTER_ID" },
  { label: "e). Passport", idType: "PASSPORT" },
  { label: "f). AB-PMJAY", idType: "AB_PMJAY" },
  { label: "g). Other", idType: "OTHER" },
];

/** Same format rules the Step-1 inputs and backend enforce. */
const ID_FORMAT: Record<string, RegExp> = {
  AADHAAR: /^\d{12}$/,
  ABHA: /^\d{14}$/,
  PAN_CARD: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  VOTER_ID: /^[A-Za-z0-9]{10}$/,
  PASSPORT: /^[A-Z][0-9]{7}$/,
  AB_PMJAY: /^[A-Za-z0-9\-]+$/,
};

/** Fields that are always read-only in Patient Records view. */
const READONLY_FIELDS = new Set([
  // 1. Name of Reporting Institution (auto-filled)
  "1. Name of the Reporting Institution (RI)",
  "1(a). Centre code",
  "Centre code",
  "1(b).Reference Number",
  "2.Registration Number",
  // 3(a-b). Department & Unit
  "3(a). Department name",
  "3(b). Unit number",
  // 4. Date of reporting
  "4. Date of reporting",
  // 5. Case Registered Through
  "5. Case Registered Through (Patient’s first reporting at RI)",
  "6(a). Case Registered Through (Other)",
  // 6. Type of referral
  "6. Type of referral",
  // 7. Date of first diagnosis
  "7. Date of first diagnosis",
  // 8. Patient Full Name
  "First Name",
  "Middle Name",
  "Last Name",
  // 9. Date of Birth
  "9. Date of Birth",
  // 10. Age
  "10. Age",
  // 11. Gender
  "11. Gender",
  // 14. Address (residential + permanent)
  "Urban / Rural",
  "14. Address",
  "Flat / House No.",
  "Ward No.",
  "Street / Road",
  "City",
  "District",
  "State",
  "PIN Code",
  "Mobile number",
  "Email address",
  "14(b).Duration of Stay at the above address (in years)",
  "Residential Address is same as Permanent Address",
  "Permanent Flat / House No.",
  "Permanent Street / Road",
  "Permanent City",
  "Permanent District",
  "Permanent State",
  "Permanent PIN Code",
  // 18. Family Cancer History (top-level + conditional sub-fields)
  "19. Relationship to Cancer / Degree of Relationship",
  "Relationship with Cancer",
  "Degree of Relationship",
  "Primary site of tumor for relative",
  "Age at diagnosis",
  "Date of diagnosis",
]);

/** Enum → display-label maps for Step 2 / Step 3 seeded values. */
const METHOD_LABEL: Record<string, string> = {
  CLINICAL_ONLY: "Clinical Only",
  MICROSCOPIC: "Microscopic",
  IMAGING: "Imaging",
  DCO: "DCO",
  OTHER: "Other",
};

const GRADE_LABEL: Record<string, string> = {
  GRADE_I: "Grade I - Well Differentiated",
  GRADE_II: "Grade II - Moderately Differentiated",
  GRADE_III: "Grade III - Poorly Differentiated",
  GRADE_IV: "Grade IV - Undifferentiated",
};

const LATERALITY_LABEL: Record<string, string> = {
  NOT_PAIRED_SITE: "Not a Paired Site",
  PAIRED_SITE: "Paired Site",
  UNKNOWN: "Unknown",
};

const PAIRED_LATERALITY_LABEL: Record<string, string> = {
  RIGHT: "Right",
  LEFT: "Left",
  ONLY_ONE_SIDE: "Only One Side Involved (Right/Left Origin Unknown)",
  BILATERAL_UNKNOWN: "Bilateral Involvement (Laterality Origin Unknown)",
  PAIRED_MIDLINE: "Paired Site Midline Tumour",
  PAIRED_UNKNOWN: "Paired Site, Laterality Unknown",
};

const SEQUENCE_LABEL: Record<string, string> = {
  ONE_PRIMARY: "One Primary Only",
  FIRST_OF_MULTIPLE: "First of Two or More Primaries",
  SECOND_OF_MULTIPLE: "Second of Two or More Primaries",
  THIRD_OF_MULTIPLE: "Third of Three or More Primaries",
  UNSPECIFIED_UNKNOWN: "Unspecified Sequence Number (Unknown)",
};

const CLINICAL_EXTENT_LABEL: Record<string, string> = {
  IN_SITU_BENIGN_PRE_INVASIVE: "In-situ/benign/borderline/pre invasive",
  LOCALIZED: "Localized",
  DIRECT_EXTENSION: "Direct Extension",
  REGIONAL_NODES: "Regional Nodes",
  DIRECT_EXTENSION_WITH_REGIONAL_NODES: "Direct Extension with Regional Nodes",
  DISTANT_METASTASIS: "Distant Metastasis",
  NOT_APPLICABLE: "Not Applicable",
  RECURRENCE: "Recurrence",
  UNKNOWN_PRIMARY: "Unknown Primary",
  OTHERS_SPECIFY: "Others (Specify)",
  UNKNOWN: "Unknown",
};

const STAGING_SYSTEM_LABEL: Record<string, string> = {
  TNM: "TNM",
  FIGO: "FIGO",
  ANN_ARBOR: "Ann Arbor",
  TORONTO_CHILDHOOD: "Toronto stage system for childhood cancers",
  NOT_APPLICABLE: "Not Applicable",
  LUGANO: "Lugano",
  COG: "COG",
  OTHERS_SPECIFY: "Others (Specify)",
  UNKNOWN: "Unknown",
};

const ECOG_GRADE_LABEL: Record<string, string> = {
  GRADE_0: "Grade 0 - Fully active",
  GRADE_1: "Grade 1 - Restricted in physically strenuous activity",
  GRADE_2: "Grade 2 - Ambulatory and capable of self-care",
  GRADE_3: "Grade 3 - Limited self-care; confined to bed/chair >50% waking hours",
  GRADE_4: "Grade 4 - Completely disabled",
  GRADE_5: "Grade 5 - Dead",
};

const TREATMENT_TYPE_LABEL: Record<string, string> = {
  ALLOPATHIC: "Allopathic",
  NON_ALLOPATHIC: "Non-Allopathic",
  BOTH: "Both",
};

const TARGETED_THERAPY_LABEL: Record<string, string> = {
  TKI: "Tyrosine Kinase Inhibitor (TKI)",
  IMMUNOTHERAPY: "Immunotherapy",
  MONOCLONAL_ANTIBODIES: "Monoclonal Antibodies",
  ANTIBODY_DRUG_CONJUGATE: "Antibody Drug Conjugate",
  CDK46_INHIBITOR: "CDK 4/6 Inhibitor",
  MTOR_INHIBITOR: "mTOR Inhibitor",
  PARP_INHIBITOR: "PARP Inhibitor",
  NOT_GIVEN: "Not Given",
  OTHERS_SPECIFY: "Others (Specify)",
  UNKNOWN: "Unknown",
};

const MODALITY_LABEL: Record<string, string> = {
  SURGERY: "Surgery",
  RADIOTHERAPY_1: "Radiotherapy 1",
  RADIOTHERAPY_2: "Radiotherapy 2",
  CHEMOTHERAPY_1: "Chemotherapy 1",
  CHEMOTHERAPY_2: "Chemotherapy 2",
  HORMONE_THERAPY: "Hormone Therapy",
  TARGETED_THERAPY: "Targeted Therapy",
  OTHERS: "Others",
};

/** Options for the Section-19 "Primary site of tumor for relative" dropdown. */
const FAMILY_SITE_OPTIONS = [
  "Breast",
  "Ovary",
  "Colon",
  "Prostate",
  "Endometrial",
  "Melanoma",
  "Thyroid",
  "Pancreas",
];

/** Reverse maps used when persisting Step-3 edits. */
const LABEL_TO_ENUM: Record<string, Record<string, string>> = {
  stagingSystem: Object.fromEntries(Object.entries(STAGING_SYSTEM_LABEL).map(([k, v]) => [v, k])),
  clinicalExtent: Object.fromEntries(Object.entries(CLINICAL_EXTENT_LABEL).map(([k, v]) => [v, k])),
  treatmentType: Object.fromEntries(Object.entries(TREATMENT_TYPE_LABEL).map(([k, v]) => [v, k])),
  ecogGrade: Object.fromEntries(Object.entries(ECOG_GRADE_LABEL).map(([k, v]) => [v, k])),
  targetedTherapy: Object.fromEntries(Object.entries(TARGETED_THERAPY_LABEL).map(([k, v]) => [v, k])),
  modality: Object.fromEntries(Object.entries(MODALITY_LABEL).map(([k, v]) => [v, k])),
};

/**
 * Bridges form state from inside FormStateProvider to the parent via a ref.
 *
 * Subscribes to every value change and copies the *current* map into the ref
 * on each render, so the parent's save handler always sees the latest typed
 * values instead of the initial ones.
 */
function FormStateBridge({ snapshotRef }: { snapshotRef: React.MutableRefObject<Record<string, unknown>> }) {
  const ctx = useFormStateOptional();
  const [, force] = useState(0);
  useEffect(() => {
    if (!ctx) return;
    snapshotRef.current = { ...ctx.values.current };
  });
  // Re-render whenever any form value changes so the effect above re-syncs the
  // ref immediately after each keystroke / selection.
  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe(() => force((n) => n + 1));
  }, [ctx]);
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

  // Derive the "Yes" toggles for the optional Section-13 IDs (c–g) from the
  // rows that are actually persisted for this patient, so view/edit mode shows
  // them correctly instead of defaulting to "No".
  useEffect(() => {
    if (!patient) return;
    const byType = new Set<string>((patient.identifications ?? []).map((i) => i.idType));
    const present = OPTIONAL_ID_DEFS.filter((d) => byType.has(d.idType)).map((d) => d.label);
    setSelectedIds(present);
  }, [patient]);

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
    const pd = reg.pathologicalDiagnosis;
    const prior = reg.treatments?.find((t) => t.treatmentStage === "PRIOR_REGISTRATION");
    const atRi = reg.treatments?.find((t) => t.treatmentStage === "AT_RI");

    const label = (map: Record<string, string>, val: string | null | undefined): string =>
      val ? (map[val] ?? "") : "";
    const date = (v: string | null | undefined): string => toDateStr(v);
    // Selected treatment-modality labels for a given treatment row.
    const selectedModalities = (t: typeof prior) =>
      (t?.modalities ?? [])
        .filter((m) => m.isSelected)
        .map((m) => label(MODALITY_LABEL, m.modality))
        .filter(Boolean);
    // Diagnostic-method procedure rows per section (label sets for tables).
    const proceduresFor = (kind: string): string[] => {
      const dm = reg.diagnosticMethods?.find((d) => d.method === kind);
      return (dm?.procedures ?? []).map((p) => p.procedureName);
    };

    const vals: Record<string, unknown> = {
      // Step 1 — read-only fields
      "1. Name of the Reporting Institution (RI)": "",
      "Centre code": "",
      "1(b).Reference Number": reg.referenceNo ?? "",
      "2.Registration Number": reg.hbcrRegistrationNo ?? "",
      "3(a). Department name": reg.departmentName ?? "",
      "3(b). Unit number": reg.unitNumber ?? "",
      "4. Date of reporting": toDateStr(reg.dateOfReporting),
      "5. Case Registered Through (Patient’s first reporting at RI)": toDisplay(reg.caseRegisteredThrough),
      "6(a). Case Registered Through (Other)": reg.caseRegisteredThroughOther ?? "",
      "6. Type of referral": toDisplay(reg.referralType) || "Self",
      "6(a). Name of Facility.": reg.referralFacilityName ?? "",
      "6(b). Hospital / LAB / N.H.": reg.referralFacilityHospitalLabNh ?? "",
      "6(c). City": reg.referralFacilityCity ?? "",
      "6(d). District": reg.referralFacilityDistrict ?? "",
      "6(e). Pincode": reg.referralFacilityPincode ?? "",
      "6(f). Date of Registration": toDateStr(reg.referralFacilityRegDate),
      "7. Date of first diagnosis": toDateStr(reg.dateOfFirstDiagnosis),
      // Step 1 — editable fields
      "First Name": patient.firstName ?? "",
      "Middle Name": patient.middleName ?? "",
      "Last Name": patient.lastName ?? "",
      "9. Date of Birth": toDateStr(patient.dateOfBirth),
      "10. Age": patient.age != null ? String(patient.age) : "",
      // Gender arrives as the Prisma enum ("FEMALE") while the Step-1
      // select options are title-case ("Female") — map it like every other
      // enum field so the saved value actually displays.
      "11. Gender": toDisplay(patient.gender),
      // 13. Identifications — the keys must match the stateKeys the Step-1
      // form reads (Aadhaar/ABHA end in " number"; optional ID numbers use
      // the bare "<label> number" key; Yes/No radios use "id-<label>").
      "a). Aadhaar number": aadhaar?.number ?? "",
      "b). ABHA number": abha?.number ?? "",
      "id-c). PAN Card": pan ? "Yes" : "No",
      "c). PAN Card number": pan?.number ?? "",
      "id-d). Voter ID": voter ? "Yes" : "No",
      "d). Voter ID number": voter?.number ?? "",
      "id-e). Passport": passport ? "Yes" : "No",
      "e). Passport number": passport?.number ?? "",
      "id-f). AB-PMJAY": abPmjay ? "Yes" : "No",
      "f). AB-PMJAY number": abPmjay?.number ?? "",
      "id-g). Other": otherIds.length > 0 ? "Yes" : "No",
      "g). Other number": otherIds[0]?.number ?? "",
      "g). Other name": otherIds[0]?.idName ?? "",
      // 13(f). Beneficiary of Health Scheme — the Step-1 radio reads this
      // exact key (previously seeded under a wrong "health-scheme" key, so
      // the saved answer never displayed).
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
      // 15. Address (read-only) — urbanRural arrives as URBAN/RURAL but the
      // Step-1 radios compare against "Urban"/"Rural", so map it here.
      "Urban / Rural": res?.urbanRural === "URBAN" ? "Urban" : res?.urbanRural === "RURAL" ? "Rural" : "",
      "Flat / House No.": res?.flatHouseNo ?? "",
      "Ward No.": res?.wardNo ?? "",
      "Street / Road": res?.streetRoad ?? "",
      "City": res?.city ?? "",
      "District": res?.district ?? "",
      "State": res?.state ?? "",
      "PIN Code": res?.pinCode ?? "",
      "Mobile number": res?.mobileNumber ?? "",
      "Email address": res?.email ?? "",
      "14(b).Duration of Stay at the above address (in years)": res?.durationStay != null ? String(res.durationStay) : "",
      "Residential Address is same as Permanent Address": sameAddress,
      // 15. Marital Status
      "15. Marital status": toDisplay(reg.maritalStatus),
      "15(a). Marital status (Other)": reg.maritalStatusOther ?? "",
      // 16. Education
      "16. Education": toDisplay(reg.education),
      "16(a). Education (Other)": reg.educationOther ?? "",
      // 18(c). Anthropometric — Step-1 form keys are "Height (cm)"/"Weight (kg)"
      "Height (cm)": reg.anthropometricHeightCm != null ? String(reg.anthropometricHeightCm) : "",
      "Weight (kg)": reg.anthropometricWeightKg != null ? String(reg.anthropometricWeightKg) : "",
      // Occupation
      "Occupation": reg.occupation ?? "",
      // Step-3 completion block (keys must match the ClinicalTreatment labels)
      "30. Name of person completing form (IN CAPITALS)": reg.formCompletedBy ?? "",
      "31. Date of completion of form": toDateStr(reg.formCompletionDate),
      "32. Contact Number": reg.contactNumber ?? "",
      "33. Designation": reg.designation ?? "",
      "Remarks": reg.remarks ?? "",
      // 17. Habits / Comorbidities — managed via ToggleDetails
      // 19. Family History — read-only; seed the conditional sub-fields too.
      "19. Relationship to Cancer / Degree of Relationship": fh?.familyHistory === "YES" ? "Yes" : fh?.familyHistory === "UNKNOWN" ? "Unknown" : "No",
      "Relationship with Cancer": fh?.relationshipWithCancer === "SAME_CANCER" ? "Same Cancer" : fh?.relationshipWithCancer === "OTHER_CANCER" ? "Other Cancer" : "",
      "Degree of Relationship": fh?.degreeOfRelationship === "FIRST_DEGREE" ? "First Degree Relative" : fh?.degreeOfRelationship === "SECOND_DEGREE" ? "Second Degree Relative" : "",
      "Primary site of tumor for relative": (() => {
        const stored = (fh?.primarySite ?? "").trim();
        if (!stored) return "";
        // The dropdown options are title-case while the DB stores the value
        // uppercased — match case-insensitively so the saved site displays.
        return (
          FAMILY_SITE_OPTIONS.find((o) => o.toLowerCase() === stored.toLowerCase()) ??
          stored
        );
      })(),
      "Age at diagnosis": fh?.ageAtDiagnosis != null ? String(fh.ageAtDiagnosis) : "",
      "Date of diagnosis": date(fh?.dateOfDiagnosis),
      // ===== Step 2 — Diagnostic Details (Fields 20–26) =====
      "_diagnostic.methods": (reg.diagnosticMethods ?? [])
        .map((d) => label(METHOD_LABEL, d.method))
        .filter(Boolean),
      "_diagnostic.clinicalDate": date(
        reg.diagnosticMethods?.find((d) => d.method === "CLINICAL_ONLY")?.clinicalOnlyDate ?? null,
      ),
      "_diagnostic.microscopicLater":
        reg.microscopicConfirmationLater === true ? "Yes" : reg.microscopicConfirmationLater === false ? "No" : "",
      "_diagnostic.procedures.Microscopic": proceduresFor("MICROSCOPIC"),
      "_diagnostic.procedures.Imaging": proceduresFor("IMAGING"),
      "_diagnostic.procedures.Other": proceduresFor("OTHER"),
      "20. Longest duration of symptom for cancer (in months)":
        pd?.longestSymptomDurationMonths != null ? String(pd.longestSymptomDurationMonths) : "",
      "21(a). Anatomical Site of Specimen / Biopsy / SMEAR": pd?.anatomicalSite ?? "",
      "21(b). Pathology Slide No": pd?.pathologySlideNo ?? "",
      "21(c). Date of Reporting": date(pd?.pathologyDateOfReporting),
      "21(d). Primary Site of Tumour - Topography": pd?.primaryTumorSite ?? "",
      "21(e). Primary Histology / Morphology": pd?.morphology ?? "",
      // 23. ICD-O-3 coding
      "23.1 Code": pd?.icdoTopography ?? "",
      "23.1 Site": pd?.topographySite ?? "",
      "23.2 Code": pd?.icdoMorphology ?? "",
      "23.2 Morphology": pd?.histologyMorphology ?? "",
      "23.2 Grade": label(GRADE_LABEL, pd?.morphologyGrade),
      "23.3 Site": pd?.secondarySite ?? "",
      "23.3 Code": pd?.secondarySiteCode ?? "",
      "23.4 Morphology": pd?.metastasisMorphology ?? "",
      "23.4 Code": pd?.metastasisMorphologyCode ?? "",
      "23.4 Grade": label(GRADE_LABEL, pd?.metastasisMorphologyGrade),
      // 24–26
      "24. Site of Tumour (ICD-10)": pd?.icd10Site ?? "",
      "25. Laterality": label(LATERALITY_LABEL, pd?.laterality),
      "25(a). pairedLaterality": label(PAIRED_LATERALITY_LABEL, pd?.pairedLaterality),
      "25. Sequence": label(SEQUENCE_LABEL, pd?.sequence),
      // ===== Step 3 — Clinical Stage & Treatment (Fields 26–33) =====
      "26. Clinical Extent of Disease Before Cancer Directed Treatment": label(CLINICAL_EXTENT_LABEL, prior?.clinicalExtentOfDisease ?? atRi?.clinicalExtentOfDisease),
      "27(a). Staging system": label(STAGING_SYSTEM_LABEL, prior?.stagingSystem ?? atRi?.stagingSystem),
      "T": prior?.tnmT ?? "",
      "N": prior?.tnmN ?? "",
      "M": prior?.tnmM ?? "",
      "27(a). Staging system value": prior?.stagingSystemValue ?? "",
      "27(b). Composite stage": prior?.compositeStage ?? atRi?.compositeStage ?? "",
      "28. Treatment Given Prior to Registration at RI / Outside RI":
        prior?.treatmentGivenChoice === "YES" ? "Yes" : prior?.treatmentGivenChoice === "UNKNOWN" ? "Unknown" : "No",
      "28. Treatment Given Prior to Registration at RI / Outside RI type": label(TREATMENT_TYPE_LABEL, prior?.treatmentType),
      "29. Treatment modalities selected": selectedModalities(prior),
      "29. Treatment at RI":
        atRi?.treatmentGivenChoice === "YES" ? "Yes" : atRi?.treatmentGivenChoice === "UNKNOWN" ? "Unknown" : "No",
      "29. Treatment at RI type": label(TREATMENT_TYPE_LABEL, atRi?.treatmentType),
      "30. Treatment modalities selected": selectedModalities(atRi),
      "29(c). Performance Status (ECOG)":
        (prior?.ecogStatus ?? atRi?.ecogStatus) === "KNOWN" ? "Known" : (prior?.ecogStatus ?? atRi?.ecogStatus) === "UNKNOWN" ? "Unknown" : "",
      "If known": label(ECOG_GRADE_LABEL, prior?.ecogGrade ?? atRi?.ecogGrade),
      "28(b). Types of targeted therapy": label(TARGETED_THERAPY_LABEL, prior?.targetedTherapyType),
      "29(b). Types of targeted therapy": label(TARGETED_THERAPY_LABEL, atRi?.targetedTherapyType),
      "Specify targeted therapy": prior?.targetedTherapyOtherSpecify ?? atRi?.targetedTherapyOtherSpecify ?? "",
    };
    return vals;
  }, [patient, registrations, sameAddress]);

  const handleSave = async () => {
    if (!patient || !registrations[0]) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const fs = formSnapshotRef.current;
    const str = (key: string): string => {
      const v = fs[key];
      return typeof v === "string" ? v.trim() : "";
    };

    try {
      const reg = registrations[0];
      const patientId = patient.id;
      const existing = new Map<string, ApiPatientIdentification>(
        (patient.identifications ?? []).map((i) => [i.idType, i] as const),
      );

      // 1) Client-side validation (mirrors Step-1 rules) so an invalid value
      // can never overwrite a valid persisted one.
      const errors: string[] = [];
      const aadhaar = str("a). Aadhaar number");
      const abha = str("b). ABHA number");
      if (!/^\d{12}$/.test(aadhaar)) errors.push("Aadhaar must be exactly 12 digits");
      if (!/^\d{14}$/.test(abha)) errors.push("ABHA must be exactly 14 digits");
      for (const { label, idType } of OPTIONAL_ID_DEFS) {
        const toggled = str(`id-${label}`) === "Yes";
        if (!toggled) continue;
        const num = str(`${label} number`);
        const name = str(`${label} name`);
        if (!num) {
          errors.push(`${label} number is required`);
        } else if (ID_FORMAT[idType] && !ID_FORMAT[idType].test(num)) {
          errors.push(`${label} number is not in a valid format`);
        }
        if (idType === "OTHER" && !name) errors.push("Other ID name is required");
      }
      const height = str("Height (cm)");
      const weight = str("Weight (kg)");
      for (const [nm, val] of [["Height", height], ["Weight", weight]] as const) {
        if (val === "") continue; // blank = leave unchanged
        const n = Number(val);
        if (!Number.isInteger(n) || n <= 0 || n > 999) {
          errors.push(`${nm} must be a positive whole number`);
        }
      }
      if (errors.length > 0) {
        setSaveError(errors.join("; "));
        setSaving(false);
        return;
      }

      // 2) Persist Aadhaar / ABHA (create when missing, otherwise update only
      // when the value actually changed).
      for (const [idType, value] of [["AADHAAR", aadhaar], ["ABHA", abha]] as const) {
        const row = existing.get(idType);
        if (row) {
          if ((row.number ?? "") !== value) {
            await sideApi.identifications.update(patientId, row.id, { number: value });
          }
        } else if (value) {
          await sideApi.identifications.create(patientId, { idType, number: value });
        }
      }

      // 3) Optional IDs (c–g): create / update / remove to match the form.
      for (const { label, idType } of OPTIONAL_ID_DEFS) {
        const row = existing.get(idType);
        const toggled = str(`id-${label}`) === "Yes";
        const num = toggled ? str(`${label} number`) : "";
        const name = toggled ? str(`${label} name`) : "";
        if (!toggled) {
          if (row) await sideApi.identifications.remove(patientId, row.id);
        } else if (!row) {
          await sideApi.identifications.create(patientId, {
            idType,
            number: num || undefined,
            idName: name || undefined,
          });
        } else {
          const changed =
            (row.number ?? "") !== num ||
            (idType === "OTHER" && (row.idName ?? "") !== name);
          if (changed) {
            await sideApi.identifications.update(patientId, row.id, {
              number: num || undefined,
              ...(idType === "OTHER" ? { idName: name || undefined } : {}),
            });
          }
        }
      }

      // 4) Registration-level editable fields (completion block, occupation,
      // anthropometrics). Blank anthropometrics are left unchanged.
      const numOrUndef = (v: string): number | undefined => {
        const n = Number(v);
        return v !== "" && Number.isFinite(n) ? n : undefined;
      };
      const hCm = numOrUndef(height);
      const wKg = numOrUndef(weight);
      await registrationApi.update(reg.id, {
        remarks: str("Remarks") || undefined,
        designation: str("33. Designation") || undefined,
        contactNumber: str("32. Contact Number") || undefined,
        formCompletedBy: str("30. Name of person completing form (IN CAPITALS)") || undefined,
        formCompletionDate: str("31. Date of completion of form") || undefined,
        occupation: str("Occupation") || undefined,
        ...(hCm !== undefined ? { anthropometricHeightCm: hCm } : {}),
        ...(wKg !== undefined ? { anthropometricWeightKg: wKg } : {}),
      });

      // 5) Family history — Section 19 is read-only even in edit mode, so
      // replay the existing record. The backend rejects a YES record that
      // omits the conditional sub-fields, so include them when YES.
      if (familyHistory) {
        const fhVal = familyHistory === "Yes" ? "YES" : familyHistory === "Unknown" ? "UNKNOWN" : "NO";
        const existingFh = reg.familialCancerHistory;
        await familyHistoryApi.upsert(reg.id, {
          familyHistory: fhVal,
          ...(fhVal === "YES" && existingFh
            ? {
                relationshipWithCancer: existingFh.relationshipWithCancer ?? undefined,
                degreeOfRelationship: existingFh.degreeOfRelationship ?? undefined,
                primarySite: existingFh.primarySite ?? undefined,
                ageAtDiagnosis: existingFh.ageAtDiagnosis ?? undefined,
                dateOfDiagnosis: existingFh.dateOfDiagnosis
                  ? toDateStr(existingFh.dateOfDiagnosis)
                  : undefined,
              }
            : {}),
        });
      }

      // 6) Pathology (Step 2) — upsert whatever diagnostic values the form
      // captured (blank values are left unchanged on the backend).
      const pathologyPatch = extractPathology(fs);
      if (Object.keys(pathologyPatch).length > 0) {
        await pathologyApi.upsert(reg.id, pathologyPatch);
      }

      // 7) Treatments (Step 3) — the backend upsert validator requires the
      // full block (composite stage, staging system, ECOG status + their
      // conditionals), so we only persist when the block is internally
      // consistent. Each stage is gated separately and the whole Step-3
      // persistence is best-effort: it can never fail the rest of the edit.
      const compositeStage = str("27(b). Composite stage");
      const stagingSystem = str("27(a). Staging system");
      const stagingValue = str("27(a). Staging system value");
      const tnmT = str("T");
      const tnmN = str("N");
      const tnmM = str("M");
      const ecogStatus = str("29(c). Performance Status (ECOG)");
      const ecogGrade = str("If known");
      const given29 = str("28. Treatment Given Prior to Registration at RI / Outside RI");
      const type29 = str("28. Treatment Given Prior to Registration at RI / Outside RI type");
      const given30 = str("29. Treatment at RI");
      const type30 = str("29. Treatment at RI type");
      const stagingOk =
        stagingSystem === "TNM"
          ? Boolean(tnmT && tnmN && tnmM)
          : stagingSystem === "" || stagingValue !== "";
      const ecogOk = ecogStatus === "" || ecogStatus === "Unknown" || (ecogStatus === "Known" && ecogGrade !== "");
      if (compositeStage !== "" && stagingSystem !== "" && stagingOk && ecogOk) {
        const enumVal = (mapName: string, label: string): string | undefined => {
          const m = LABEL_TO_ENUM[mapName];
          return label && m ? (m[label] ?? undefined) : undefined;
        };
        const modalities = (key: string): string[] => {
          const v = fs[key];
          return Array.isArray(v) ? (v as string[]) : [];
        };
        try {
          const persistBlock = async (
            stage: "PRIOR_REGISTRATION" | "AT_RI",
            given: string,
            type: string,
            modKey: string,
          ) => {
            // Skip stages whose validator requirements can't be satisfied
            // (AT_RI always needs a treatment type; a Yes choice needs one too).
            if (given === "") return;
            if (type === "") return;
            const saved = await treatmentApi.upsert(reg.id, {
              treatmentStage: stage,
              treatmentGivenChoice:
                given === "Yes" ? "YES" : given === "Unknown" ? "UNKNOWN" : "NO",
              treatmentType: enumVal("treatmentType", type),
              clinicalExtentOfDisease: enumVal("clinicalExtent", str("26. Clinical Extent of Disease Before Cancer Directed Treatment")),
              stagingSystem: enumVal("stagingSystem", stagingSystem),
              stagingSystemValue: stagingSystem !== "TNM" ? stagingValue || undefined : undefined,
              tnmT: stagingSystem === "TNM" ? tnmT || undefined : undefined,
              tnmN: stagingSystem === "TNM" ? tnmN || undefined : undefined,
              tnmM: stagingSystem === "TNM" ? tnmM || undefined : undefined,
              compositeStage,
              ecogStatus: ecogStatus === "Known" ? "KNOWN" : "UNKNOWN",
              ecogGrade: ecogStatus === "Known" ? enumVal("ecogGrade", ecogGrade) : undefined,
              targetedTherapyType: enumVal("targetedTherapy", str("28(b). Types of targeted therapy")),
              targetedTherapyOtherSpecify: str("Specify targeted therapy") || undefined,
            });
            // Sync the selected-modality checkboxes with the table state.
            const selected = modalities(modKey);
            for (const [labelText, enumName] of Object.entries(LABEL_TO_ENUM.modality)) {
              await treatmentApi.upsertModality(saved.id, {
                modality: enumName,
                isSelected: selected.includes(labelText),
              });
            }
          };
          await persistBlock("PRIOR_REGISTRATION", given29, type29, "29. Treatment modalities selected");
          await persistBlock("AT_RI", given30, type30, "30. Treatment modalities selected");
        } catch {
          // Best-effort: Step-3 persistence failure must not block the rest.
        }
      }

      setSaveSuccess(true);
      setEditMode(false);
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setSaveError(msg);
      // Re-sync with the database so the UI never shows values that weren't
      // actually persisted.
      await loadData().catch(() => {});
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
                initialCaseThrough={initialValues["5. Case Registered Through (Patient’s first reporting at RI)"] as string || ""}
                initialCaseThroughOther={initialValues["6(a). Case Registered Through (Other)"] as string || ""}
                initialMaritalStatus={initialValues["15. Marital status"] as string || ""}
                initialEducation={initialValues["16. Education"] as string || ""}
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
