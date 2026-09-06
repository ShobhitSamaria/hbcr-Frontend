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

/** Convert a stored numeric-string value to a number, or undefined when blank. */
function numericOrUndefined(x: string | null): number | undefined {
  if (x === null) return undefined;
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
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
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  age: string | null;
  dateOfBirth: string | null;
  gender: Gender;
  healthSchemeBeneficiary: boolean;
  healthSchemeDetails: string | null;
} {
  const gender = (val(v, "12. Gender") ?? "Male").toLowerCase().startsWith("f")
    ? "FEMALE"
    : (val(v, "12. Gender") ?? "Male").toLowerCase().startsWith("m")
      ? "MALE"
      : "OTHER";
  const firstName = val(v, "First Name");
  const middleName = val(v, "Middle Name");
  const lastName = val(v, "Last Name");
  return {
    fullName: [firstName, middleName, lastName].filter(Boolean).join(" "),
    firstName,
    middleName,
    lastName,
    age: val(v, "11. Age") || null,
    dateOfBirth: val(v, "10. Date of Birth"),
    gender,
    healthSchemeBeneficiary:
      val(v, "13. Beneficiary of Health Scheme (RGHS / MAAYOGNA / CGHS)") === "Yes",
    healthSchemeDetails: val(v, "13. Beneficiary of Health Scheme details"),
  };
}

export function extractAddresses(v: Values): Array<{
  addressType: "RESIDENTIAL" | "PERMANENT";
  urbanRural?: "URBAN" | "RURAL";
  wardNo?: string;
  flatHouseNo?: string;
  streetRoad?: string;
  city?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  mobileNumber?: string;
  email?: string;
  durationStay?: number;
}> {
  const urbanRural = val(v, "Urban / Rural");
  const res = {
    addressType: "RESIDENTIAL" as const,
    urbanRural:
      urbanRural === "Urban" || urbanRural === "Rural"
        ? (urbanRural.toUpperCase() as "URBAN" | "RURAL")
        : undefined,
    wardNo: val(v, "Ward No.") ?? undefined,
    flatHouseNo: val(v, "Flat / House No.") ?? undefined,
    streetRoad: val(v, "Street / Road") ?? undefined,
    city: val(v, "City") ?? undefined,
    district: val(v, "District") ?? undefined,
    state: val(v, "State") ?? undefined,
    pinCode: val(v, "PIN Code") ?? undefined,
    mobileNumber: val(v, "Mobile number") ?? undefined,
    email: val(v, "Email address") ?? undefined,
    durationStay: (() => {
      const raw = val(v, "Duration of Stay at the above address (in years)");
      if (raw === undefined || raw === null || raw === "") return undefined;
      const n = Number(raw);
      return Number.isFinite(n) && Number.isInteger(n) ? n : undefined;
    })(),
  };
  return [res];
}

export function extractRelatives(v: Values): Array<{
  relationship: "FATHER" | "MOTHER" | "SPOUSE" | "SON" | "DAUGHTER" | "OTHER";
  name?: string;
  mobileNumber?: string;
}> {
  const out: Array<{
    relationship: "FATHER" | "MOTHER" | "SPOUSE" | "SON" | "DAUGHTER" | "OTHER";
    name?: string;
    mobileNumber?: string;
  }> = [];
  const f = val(v, "Father name");
  if (f) out.push({ relationship: "FATHER", name: f, mobileNumber: val(v, "Father mobile number") ?? undefined });
  const m = val(v, "Mother name");
  if (m) out.push({ relationship: "MOTHER", name: m, mobileNumber: val(v, "Mother mobile number") ?? undefined });
  const s = val(v, "Spouse name");
  if (s) out.push({ relationship: "SPOUSE", name: s, mobileNumber: val(v, "Spouse mobile number") ?? undefined });
  const son = val(v, "Son name");
  if (son) out.push({ relationship: "SON", name: son, mobileNumber: val(v, "Son mobile number") ?? undefined });
  const daughter = val(v, "Daughter name");
  if (daughter) out.push({ relationship: "DAUGHTER", name: daughter, mobileNumber: val(v, "Daughter mobile number") ?? undefined });
  const o = val(v, "Other name");
  if (o) out.push({ relationship: "OTHER", name: o, mobileNumber: val(v, "Other mobile number") ?? undefined });
  return out;
}

export function extractHabits(v: Values): Array<{
  habit: "SMOKING" | "SMOKELESS" | "BETEL_NUT_WITH_TOBACCO" | "BETEL_NUT_WITHOUT_TOBACCO" | "ALCOHOL";
  answer: "YES" | "NO";
  durationMonths?: number;
}> {
  // Map display labels to enum values
  const HABIT_MAP: Record<string, string> = {
    "Smoking": "SMOKING",
    "Smokeless": "SMOKELESS",
    "Betel Nut with Tobacco": "BETEL_NUT_WITH_TOBACCO",
    "Betel Nut without Tobacco": "BETEL_NUT_WITHOUT_TOBACCO",
    "Alcohol": "ALCOHOL",
  };
  const items = ["Smoking", "Smokeless", "Betel Nut with Tobacco", "Betel Nut without Tobacco", "Alcohol"] as const;
  return items
    .map((item) => {
      const answer = String(v[`18(a). Habits::${item}::answer`] ?? "No") as "Yes" | "No";
      return {
        habit: HABIT_MAP[item] as any,
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
    | "PAN_CARD"
    | "VOTER_ID"
    | "PASSPORT"
    | "AB_PMJAY"
    | "OTHER";
  number?: string;
  idName?: string;
}> {
  const labels = [
    { label: "a). Aadhaar", type: "AADHAAR" as const },
    { label: "b). ABHA", type: "ABHA" as const },
    { label: "c). PAN Card", type: "PAN_CARD" as const },
    { label: "d). Voter ID", type: "VOTER_ID" as const },
    { label: "e). Passport", type: "PASSPORT" as const },
    { label: "f). AB-PMJAY", type: "AB_PMJAY" as const },
    { label: "g). Other", type: "OTHER" as const },
  ];
  const out: Array<{
    idType: typeof labels[number]["type"];
    number?: string;
    idName?: string;
  }> = [];
  for (const { label, type } of labels) {
    const numKey = label + " number";
    const nameKey = label + " name";
    const number = val(v, numKey);
    const idName = val(v, nameKey);
    // For Other (g)., include even without number/name when Yes is selected
    const radioKey = `id-${label}`;
    const radioVal = val(v, radioKey);
    const isOtherYes = type === "OTHER" && radioVal === "Yes";
    if (number || idName || isOtherYes) out.push({
      idType: type,
      ...(number ? { number } : {}),
      ...(idName ? { idName } : {}),
    });
  }
  return out;
}

// =============================================================================
// Registration
// =============================================================================

/** Explicit mapping from frontend education option labels to Prisma enum values. */
const EDU_ENUM_MAP: Record<string, string> = {
  "Illiterate": "ILLITERATE",
  "Literate": "LITERATE",
  "Primary": "PRIMARY",
  "Middle": "MIDDLE",
  "Secondary/Higher Secondary": "SECONDARY_HIGHER_SECONDARY",
  "Technical-after matric": "TECHNICAL_AFTER_MATRIC",
  "Graduate and above": "GRADUATE_AND_ABOVE",
  "Others (specify)": "OTHERS",
  "Unknown": "UNKNOWN",
};

export function extractRegistration(
  v: Values,
  fallbackHospitalId: number,
): {
  hbcrRegistrationNo?: string; // Optional - auto-generated by backend if not provided
  hospitalId: number;
  referenceNo?: string; // Optional - auto-generated by backend if not provided
  departmentName?: string;
  unitNumber?: string;
  dateOfReporting?: string;
  caseRegisteredThrough?: string;
  caseRegisteredThroughOther?: string;
  referralType?: string;
  referralFacilityName?: string;
  referralFacilityCity?: string;
  referralFacilityDistrict?: string;
  referralFacilityPincode?: string;
  referralFacilityHospitalLabNh?: string;
  referralFacilityRegDate?: string;
  dateOfFirstDiagnosis?: string;
  microscopicConfirmationLater?: boolean;
  anthropometricHeightCm?: number;
  anthropometricWeightKg?: number;
  maritalStatus?: string;
  maritalStatusOther?: string;
  education?: string;
  educationOther?: string;
  occupation?: string;
  remarks?: string;
  contactNumber?: string;
  designation?: string;
  formCompletedBy?: string;
  formCompletionDate?: string;
} {
  // Explicit map: the naive replace(/ /g, "_") would turn
  // "Other Hospital/Health Facility" into "OTHER_HOSPITAL/HEALTH_FACILITY",
  // which is not a ReferralType enum member. Map option text → enum name.
  const REFERRAL_TYPE_MAP: Record<string, string> = {
    Self: "SELF",
    "Other Hospital/Health Facility": "OTHER_HOSPITAL",
    "Screen Detected Referral": "SCREEN_DETECTED",
    Unknown: "UNKNOWN",
  };
  const referralType =
    REFERRAL_TYPE_MAP[val(v, "7. Type of referral") ?? "Self"] ?? "UNKNOWN";
  const caseThrough = val(v, "6. Case Registered Through (Patient’s first reporting at RI)");
  const marital = val(v, "16. Marital status") ?? "";
  const education = val(v, "17. Education") ?? "";
  // Reference Number and Registration Number are auto-generated by backend.
  // They are displayed as read-only preview fields; on submit the backend
  // generates the real values if these are absent.
  const referenceNo = val(v, "Reference Number") ?? undefined;
  const hbcrRegistrationNo = val(v, "Registration Number") ?? undefined;

  return {
    ...(hbcrRegistrationNo ? { hbcrRegistrationNo } : {}),
    hospitalId: fallbackHospitalId,
    ...(referenceNo ? { referenceNo } : {}),
    departmentName: val(v, "3(a). Department name") ?? undefined,
    unitNumber: val(v, "3(b). Unit number") ?? undefined,
    dateOfReporting: val(v, "5. Date of reporting") ?? undefined,
    caseRegisteredThrough: caseThrough === "Unknown"
      ? "UNKNOWN"
      : caseThrough
        ? caseThrough.replace(/ /g, "_").toUpperCase()
        : undefined,
    caseRegisteredThroughOther: val(v, "6(a). Case Registered Through (Other)") ?? undefined,
    referralType,
    referralFacilityName: val(v, "7(a). Name of Facility.") ?? undefined,
    referralFacilityHospitalLabNh: val(v, "7(b). Hospital / LAB / N.H.") ?? undefined,
    referralFacilityCity: val(v, "7(c). City") ?? undefined,
    referralFacilityDistrict: val(v, "7(d). District") ?? undefined,
    referralFacilityPincode: val(v, "7(e). Pincode") ?? undefined,
    referralFacilityRegDate: val(v, "7(f). Date of Registration") ?? undefined,
    dateOfFirstDiagnosis: val(v, "8. Date of first diagnosis") ?? undefined,
    microscopicConfirmationLater:
      val(v, "_diagnostic.microscopicLater") === "Yes"
        ? true
        : val(v, "_diagnostic.microscopicLater") === "No"
          ? false
          : undefined,
    anthropometricHeightCm: numericOrUndefined(val(v, "Height (cm)")),
    anthropometricWeightKg: numericOrUndefined(val(v, "Weight (kg)")),
    maritalStatus: marital ? marital.replace(/ /g, "_").toUpperCase() : undefined,
    maritalStatusOther: val(v, "16(a). Marital status (Other)") ?? undefined,
    education: education ? EDU_ENUM_MAP[education] ?? education.replace(/[^A-Za-z0-9]+/g, "_").replace(/_+$/, "").toUpperCase() : undefined,
    educationOther: val(v, "17(a). Education (Other)") ?? undefined,
    occupation: val(v, "Occupation") ?? undefined,
    remarks: val(v, "Remarks") ?? undefined,
    contactNumber: val(v, "33. Contact Number") ?? undefined,
    designation: val(v, "34. Designation") ?? undefined,
    formCompletedBy: val(v, "31. Name of person completing form (IN CAPITALS)") ?? undefined,
    formCompletionDate: val(v, "32. Date of completion of form") ?? undefined,
  };
}

// =============================================================================
// Pathology (Step 2 fields 21-26)
// =============================================================================

const GRADE_ENUM: Record<string, string> = {
  "Grade I - Well Differentiated": "GRADE_I",
  "Grade II - Moderately Differentiated": "GRADE_II",
  "Grade III - Poorly Differentiated": "GRADE_III",
  "Grade IV - Undifferentiated": "GRADE_IV",
};

// UI option text -> backend Laterality / PairedLaterality / Sequence enums.
// These can't be derived by a naive uppercase/spaces->underscores transform
// (e.g. "Not a Paired Site" -> NOT_A_PAIRED_SITE, which the backend rejects).
const LATERALITY_ENUM: Record<string, string> = {
  "Not a Paired Site": "NOT_PAIRED_SITE",
  "Paired Site": "PAIRED_SITE",
  Unknown: "UNKNOWN",
};

const PAIRED_LATERALITY_ENUM: Record<string, string> = {
  Right: "RIGHT",
  Left: "LEFT",
  "Only One Side Involved (Right/Left Origin Unknown)": "ONLY_ONE_SIDE",
  "Bilateral Involvement (Laterality Origin Unknown)": "BILATERAL_UNKNOWN",
  "Paired Site Midline Tumour": "PAIRED_MIDLINE",
  "Paired Site, Laterality Unknown": "PAIRED_UNKNOWN",
};

const SEQUENCE_ENUM: Record<string, string> = {
  "One Primary Only": "ONE_PRIMARY",
  "First of Two or More Primaries": "FIRST_OF_MULTIPLE",
  "Second of Two or More Primaries": "SECOND_OF_MULTIPLE",
  "Third of Three or More Primaries": "THIRD_OF_MULTIPLE",
  "Unspecified Sequence Number (Unknown)": "UNSPECIFIED_UNKNOWN",
};

export function extractPathology(v: Values): Partial<ApiPathologicalDiagnosis> {
  const map: Partial<ApiPathologicalDiagnosis> = {};
  const num = (k: string): number | undefined => {
    const n = Number(v[k]);
    return Number.isFinite(n) ? n : undefined;
  };
  const grade = (
    k: string,
  ): "GRADE_I" | "GRADE_II" | "GRADE_III" | "GRADE_IV" | undefined => {
    const g = val(v, k);
    const mapped = g ? GRADE_ENUM[g] : undefined;
    return (mapped as "GRADE_I" | "GRADE_II" | "GRADE_III" | "GRADE_IV") ?? undefined;
  };
  const longest = num("21. Longest duration of symptom for cancer (in months)");
  if (longest !== undefined) map.longestSymptomDurationMonths = longest;

  const text = (k: string) => val(v, k) ?? undefined;
  map.anatomicalSite = text("21.1 Anatomical Site of Specimen / Biopsy / SMEAR");
  map.pathologySlideNo = text("21.2 Pathology Slide No");
  map.primaryTumorSite = text("21.4 Primary Site of Tumour - Topography");
  map.morphology = text("21.5 Primary Histology / Morphology");
  // 23. ICD-O-3 coding (sub-sections 23.1 - 23.4)
  map.icdoTopography = text("23.1 Code");
  map.topographySite = text("23.1 Site");
  map.icdoMorphology = text("23.2 Code");
  map.histologyMorphology = text("23.2 Morphology");
  map.morphologyGrade = grade("23.2 Grade");
  map.secondarySite = text("23.3 Site");
  map.secondarySiteCode = text("23.3 Code");
  map.metastasisMorphology = text("23.4 Morphology");
  map.metastasisMorphologyCode = text("23.4 Code");
  map.metastasisMorphologyGrade = grade("23.4 Grade");
  map.icd10Site = text("24. Site of Tumour (ICD-10)");
  map.pathologyDateOfReporting = text("21.3 Date of Reporting");
  const lat = val(v, "25. Laterality");
  if (lat) map.laterality = (LATERALITY_ENUM[lat] ?? lat) as ApiPathologicalDiagnosis["laterality"];
  const paired = val(v, "25(a). pairedLaterality");
  if (paired)
    map.pairedLaterality = (PAIRED_LATERALITY_ENUM[paired] ??
      paired) as ApiPathologicalDiagnosis["pairedLaterality"];
  const seq = val(v, "26. Sequence");
  if (seq) map.sequence = (SEQUENCE_ENUM[seq] ?? seq) as ApiPathologicalDiagnosis["sequence"];
  return map;
}

// =============================================================================
// Family history (Step 1 field 19)
// =============================================================================

export function extractFamilyHistory(v: Values): Partial<ApiFamilialCancerHistory> {
  const yesNo = (val(v, "19. Relationship to Cancer / Degree of Relationship") ?? "No") as string;
  const familyHistory = (yesNo === "Yes" ? "YES" : yesNo === "Unknown" ? "UNKNOWN" : "NO") as any;

  if (familyHistory !== "YES") {
    return { familyHistory };
  }

  // Map frontend labels to backend enums
  const relCancer = val(v, "Relationship with Cancer");
  const relationshipWithCancer =
    relCancer === "Same Cancer" ? "SAME_CANCER" : relCancer === "Other Cancer" ? "OTHER_CANCER" : undefined;

  const degreeRel = val(v, "Degree of Relationship");
  const degreeOfRelationship =
    degreeRel === "First Degree Relative" ? "FIRST_DEGREE" : degreeRel === "Second Degree Relative" ? "SECOND_DEGREE" : undefined;

  const primarySiteRaw = val(v, "Primary site of tumor for relative");
  const primarySite = primarySiteRaw ? primarySiteRaw.toUpperCase() : undefined;

  const ageAtDiagnosisRaw = val(v, "Age at diagnosis");
  const ageAtDiagnosis = ageAtDiagnosisRaw ? parseInt(ageAtDiagnosisRaw, 10) : undefined;

  const dateOfDiagnosis = val(v, "Date of diagnosis") || undefined;

  return {
    familyHistory,
    relationshipWithCancer: relationshipWithCancer as any,
    degreeOfRelationship: degreeOfRelationship as any,
    primarySite: primarySite as any,
    ageAtDiagnosis,
    dateOfDiagnosis,
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
