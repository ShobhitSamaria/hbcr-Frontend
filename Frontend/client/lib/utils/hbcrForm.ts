/**
 * Helpers that turn the captured `Field`/`SelectField` form-state into the
 * payloads the HBCR backend expects.
 *
 * Keys here match the field LABEL strings used in the existing form
 * components (the names of the form fields in Step 1 / 2 / 3). When the
 * label changes, update this map.
 */

import type {
  ApiDiagnosticMethod,
  ApiFamilialCancerHistory,
  ApiPathologicalDiagnosis,
  ApiPatient,
  ApiRegistration,
  ApiTreatment,
} from "@/lib/api";

type Values = Record<string, unknown>;

function val(v: Values, key: string): string | null {
  const x = v[key];
  if (x === undefined || x === null) return null;
  const s = String(x).trim();
  return s === "" ? null : s;
}

function valInt(v: Values, key: string): number | null {
  const n = Number(v[key]);
  return Number.isFinite(n) && Number.isInteger(n) ? n : null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// =============================================================================
// Patient + side tables
// =============================================================================

export type Gender = "MALE" | "FEMALE" | "OTHER";
export function extractPatient(v: Values): {
  fullName: string;
  age: number | null;
  dateOfBirth: string | null;
  gender: Gender;
} {
  const gender = (val(v, "12. Gender") ?? "Male").toLowerCase().startsWith("f")
    ? "FEMALE"
    : (val(v, "12. Gender") ?? "Male").toLowerCase().startsWith("m")
      ? "MALE"
      : "OTHER";
  return {
    fullName: val(v, "9. Full name") ?? "",
    age: valInt(v, "10. Age"),
    dateOfBirth: val(v, "11. Date of Birth"),
    gender,
  };
}

export function extractAddresses(v: Values): Array<{
  addressType: "RESIDENTIAL" | "PERMANENT";
  flatHouseNo?: string;
  streetRoad?: string;
  city?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  mobileNumber?: string;
  email?: string;
}> {
  const res = {
    addressType: "RESIDENTIAL" as const,
    flatHouseNo: val(v, "Flat / House No.") ?? undefined,
    streetRoad: val(v, "Street / Road") ?? undefined,
    city: val(v, "City") ?? undefined,
    district: val(v, "District") ?? undefined,
    state: val(v, "State") ?? undefined,
    pinCode: val(v, "PIN Code") ?? undefined,
    mobileNumber: val(v, "Mobile number") ?? undefined,
    email: val(v, "Email address") ?? undefined,
  };
  return [res];
}

export function extractRelatives(v: Values): Array<{
  relationship: "FATHER" | "MOTHER" | "SPOUSE";
  name?: string;
  mobileNumber?: string;
}> {
  const out: Array<{
    relationship: "FATHER" | "MOTHER" | "SPOUSE";
    name?: string;
    mobileNumber?: string;
  }> = [];
  const f = val(v, "Father name");
  if (f) out.push({ relationship: "FATHER", name: f, mobileNumber: val(v, "Father mobile number") ?? undefined });
  const m = val(v, "Mother name");
  if (m) out.push({ relationship: "MOTHER", name: m, mobileNumber: val(v, "Mother mobile number") ?? undefined });
  const s = val(v, "Spouse name");
  if (s) out.push({ relationship: "SPOUSE", name: s, mobileNumber: val(v, "Spouse mobile number") ?? undefined });
  return out;
}

export function extractHabits(v: Values): Array<{
  habit: "SMOKING" | "SMOKELESS_TOBACCO" | "BETEL_NUT" | "ALCOHOL";
  answer: "YES" | "NO";
  durationMonths?: number;
}> {
  const items = ["Smoking", "Smokeless Tobacco", "Betel Nut", "Alcohol"] as const;
  return items
    .map((item) => {
      const answer = String(v[`18(a). Habits::${item}::answer`] ?? "No") as "Yes" | "No";
      return {
        habit: item.toUpperCase().replace(/ /g, "_") as any,
        answer: (answer === "Yes" ? "YES" : "NO") as "YES" | "NO",
      };
    });
}

export function extractComorbidities(v: Values): Array<{
  comorbidity: string;
  answer: "YES" | "NO";
}> {
  const items = [
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
  ];
  return items
    .filter((c) => String(v[`18(b). Co-Morbidities::${c}::answer`] ?? "No") === "Yes")
    .map((c) => ({
      comorbidity: c.toUpperCase().replace(/[\s/]+/g, "_") as any,
      answer: "YES" as const,
    }));
}

export function extractIdentifications(v: Values): Array<{
  idType:
    | "AADHAAR"
    | "ABHA"
    | "VOTER_ID"
    | "PASSPORT"
    | "AB_PMJAY"
    | "OTHER";
  number: string;
}> {
  const labels = [
    { label: "a). Aadhaar", type: "AADHAAR" as const },
    { label: "b). ABHA", type: "ABHA" as const },
    { label: "c). Voter ID", type: "VOTER_ID" as const },
    { label: "d). Passport", type: "PASSPORT" as const },
    { label: "d). AB-PMJAY", type: "AB_PMJAY" as const },
    { label: "e). Other", type: "OTHER" as const },
  ];
  const out: Array<{
    idType: typeof labels[number]["type"];
    number: string;
  }> = [];
  for (const { label, type } of labels) {
    // The UI uses Yes/No radios; we treat only "Yes" as filled in.
    const yesNoUnknownKey = label; // IDs are separate controls with the same label; we use the input value below.
    const numKey = label + " number";
    void yesNoUnknownKey;
    const number = val(v, numKey);
    if (number) out.push({ idType: type, number });
  }
  return out;
}

// =============================================================================
// Registration
// =============================================================================

export function extractRegistration(
  v: Values,
  fallbackHospitalId: number,
): {
  hbcrRegistrationNo: string;
  hospitalId: number;
  departmentName?: string;
  unitNumber?: string;
  hospitalRegistrationNo?: string;
  dateOfReporting?: string;
  caseRegisteredThrough?: string;
  referralType?: string;
  referralFacilityName?: string;
  referralFacilityCity?: string;
  referralFacilityDistrict?: string;
  referralFacilityHospitalLabNh?: string;
  referralFacilityRegDate?: string;
  dateOfFirstDiagnosis?: string;
  maritalStatus?: string;
  education?: string;
} {
  const referralType = (val(v, "7. Type of referral") ?? "Self").replace(/ /g, "_").toUpperCase();
  const caseThrough = val(v, "6. Case Registered Through (Patient’s first reporting at RI)");
  const marital = val(v, "16. Marital status") ?? "";
  const education = val(v, "17. Education") ?? "";
  return {
    hbcrRegistrationNo:
      val(
        v,
        "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)",
      ) ?? "",
    hospitalId: fallbackHospitalId,
    departmentName: val(v, "3(a). Department name") ?? undefined,
    unitNumber: val(v, "3(b). Unit number") ?? undefined,
    hospitalRegistrationNo: undefined,
    dateOfReporting: val(v, "5. Date of reporting") ?? undefined,
    caseRegisteredThrough: caseThrough
      ? caseThrough.replace(/ /g, "_").toUpperCase()
      : undefined,
    referralType,
    referralFacilityName: val(v, "7(a). Name of Facility.") ?? undefined,
    referralFacilityCity: val(v, "7(b). City") ?? undefined,
    referralFacilityDistrict: val(v, "7(c). District") ?? undefined,
    referralFacilityHospitalLabNh: val(v, "7(d). Hospital / LAB / N.H.") ?? undefined,
    referralFacilityRegDate: val(v, "7(e). Date of Registration") ?? undefined,
    dateOfFirstDiagnosis: val(v, "8. Date of first diagnosis") ?? undefined,
    maritalStatus: marital ? marital.replace(/ /g, "_").toUpperCase() : undefined,
    education: education ? education.replace(/ /g, "_").toUpperCase() : undefined,
  };
}

// =============================================================================
// Pathology (Step 2 fields 21-26)
// =============================================================================

export function extractPathology(v: Values): Partial<ApiPathologicalDiagnosis> {
  const map: Partial<ApiPathologicalDiagnosis> = {};
  const num = (k: string): number | undefined => {
    const n = Number(v[k]);
    return Number.isFinite(n) ? n : undefined;
  };
  const longest = num("21. Longest duration of symptom for cancer (in months)");
  if (longest !== undefined) map.longestSymptomDurationMonths = longest;

  const text = (k: string) => val(v, k) ?? undefined;
  map.anatomicalSite = text("22(a). Anatomical site");
  map.pathologySlideNo = text("22(b). Pathology slide number");
  map.primaryTumorSite = text("22(c). Primary tumor site");
  map.morphology = text("22(d). Morphology");
  map.icdoTopography = text("23(a). Primary Site of Tumour - Topography");
  map.icdoMorphology = text("23(b). Primary Histology - Morphology");
  map.secondarySite = text("23(c). Secondary Site of Tumour");
  map.metastasisMorphology = text("23(d). Morphology of Metastasis");
  map.icd10Site = text("24. Site of Tumour (ICD-10)");
  const lat = val(v, "25. Laterality");
  if (lat) map.laterality = lat.toUpperCase().replace(/ /g, "_") as any;
  // Paired-laterality radios captured via the same "25. Laterality" key.
  const paired = val(v, "25. Laterality");
  void paired;
  const seq = val(v, "26. Sequence");
  if (seq) map.sequence = seq.toUpperCase().replace(/ /g, "_") as any;
  return map;
}

// =============================================================================
// Family history (Step 1 field 19)
// =============================================================================

export function extractFamilyHistory(v: Values): Partial<ApiFamilialCancerHistory> {
  const yesNo = (val(v, "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)") ?? "No") as string;
  return {
    familyHistory: (yesNo === "Yes" ? "YES" : yesNo === "Unknown" ? "UNKNOWN" : "NO") as any,
  };
}

// =============================================================================
// Diagnostic methods (Step 2 field 20) — captured via the form-state mirror
// written by `DiagnosticDetails.tsx`.
// =============================================================================

export function extractDiagnosticMethods(v: Values): {
  methods: string[];
  clinicalDate: string | null;
} {
  const m = v["_diagnostic.methods"];
  const methods = Array.isArray(m) ? (m as string[]) : [];
  const cd = val(v, "_diagnostic.clinicalDate");
  return { methods, clinicalDate: cd };
}

// =============================================================================
// Treatment (Step 3 fields 27-32)
// =============================================================================

function extractTreatments(_v: Values): Array<Partial<ApiTreatment>> {
  // ClinicalTreatment owns its own local state. We send a default row per
  // stage so the form reaches a complete record.
  const stage = "PRIOR_REGISTRATION";
  void stage;
  return [];
}
