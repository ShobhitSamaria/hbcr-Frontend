/**
 * Map backend validation / API errors back to UI field labels.
 *
 * The backend validator keys fields by their request-body name (often
 * camelCase like `hbcrRegistrationNo` or `pinCode`). The UI uses verbose
 * label strings as form-state keys. This module bridges the two.
 *
 * Add new entries here whenever the frontend and backend grow new
 * overlapping fields. The fallback is to surface the error as a
 * top-level form error (no field highlight).
 */

export type BackendFieldError = { field?: string; message: string };

/** camelCase / snake_case backend key -> UI label. */
const BACKEND_TO_UI: Record<string, string> = {
  fullName: "First Name",
  age: "11. Age",
  dateOfBirth: "10. Date of Birth",
  gender: "12. Gender",
  hbcrRegistrationNo:
    "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)",
  hospitalId: "1. Name of the Reporting Institution (RI)",
  departmentName: "3(a). Department name",
  unitNumber: "3(b). Unit number",
  hospitalRegistrationNo: "4. Hospital registration number",
  hospitalRegistrationNoType: "4. Hospital Registration Number (MRD / CR / Unique ID)",
  dateOfReporting: "5. Date of reporting",
  caseRegisteredThrough: "6. Case Registered Through (Patient’s first reporting at RI)",
  referralType: "7. Type of referral",
  referralFacilityName: "7(a). Name of Facility.",
  referralFacilityHospitalLabNh: "7(b). Hospital / LAB / N.H.",
  referralFacilityCity: "7(c). City",
  referralFacilityDistrict: "7(d). District",
  referralFacilityPincode: "7(e). Pincode",
  referralFacilityRegDate: "7(f). Date of Registration",
  dateOfFirstDiagnosis: "8. Date of first diagnosis",
  microscopicConfirmationLater: "20. Method of diagnosis",
  maritalStatus: "16. Marital status",
  education: "17. Education",
  occupation: "Occupation",
  status: "Registration status",
  formCompletedBy: "31. Name of person completing form (IN CAPITALS)",
  formCompletionDate: "32. Date of completion of form",
  remarks: "Remarks",
  // Side tables
  addressType: "Flat / House No.",
  urbanRural: "Urban / Rural",
  wardNo: "Ward No.",
  pinCode: "PIN Code",
  mobileNumber: "Mobile number",
  email: "Email address",
  idType: "13. Unique identification",
  healthSchemeBeneficiary: "13. Beneficiary of Health Scheme (RGHS / MAAYOGNA / CGHS)",
  healthSchemeDetails: "13. Beneficiary of Health Scheme details",
  number: "13. Unique identification",
  relationship: "14. Relative details",
  name: "First Name",
  habit: "18(a). Habits",
  comorbidity: "18(b). Co-Morbidities",
  answer: "18(a). Habits",
  durationMonths: "18(a). Habits",
  // Pathology
  icdoTopography: "23.1 Code",
  topographySite: "23.1 Site",
  icdoMorphology: "23.2 Code",
  histologyMorphology: "23.2 Morphology",
  morphologyGrade: "23.2 Grade",
  secondarySite: "23.3 Site",
  secondarySiteCode: "23.3 Code",
  metastasisMorphology: "23.4 Morphology",
  metastasisMorphologyCode: "23.4 Code",
  metastasisMorphologyGrade: "23.4 Grade",
  icd10Site: "24. Site of Tumour (ICD-10)",
  pathologyDateOfReporting: "22.3 Date of Reporting",
  laterality: "25. Laterality",
  pairedLaterality: "25. Laterality",
  sequence: "26. Sequence",
  // Family history
  familyHistory:
    "19. Relationship to Cancer / Degree of Relationship",
  relationshipWithCancer:
    "19. Relationship to Cancer / Degree of Relationship",
  degreeOfRelationship:
    "19. Relationship to Cancer / Degree of Relationship",
  primarySite:
    "19. Relationship to Cancer / Degree of Relationship",
  ageAtDiagnosis:
    "19. Relationship to Cancer / Degree of Relationship",
  dateOfDiagnosis:
    "19. Relationship to Cancer / Degree of Relationship",
};

function mapBackendFieldToLabel(backendField: string | undefined): string | null {
  if (!backendField) return null;
  return BACKEND_TO_UI[backendField] ?? null;
}

export function mapValidationDetailsToErrors(
  details: BackendFieldError[] | undefined,
): Record<string, string> {
  if (!Array.isArray(details)) return {};
  const out: Record<string, string> = {};
  for (const d of details) {
    const label = mapBackendFieldToLabel(d.field);
    if (label) out[label] = d.message;
  }
  return out;
}
