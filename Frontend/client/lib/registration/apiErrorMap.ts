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
  fullName: "9. Full name",
  age: "10. Age",
  dateOfBirth: "11. Date of Birth",
  gender: "12. Gender",
  hbcrRegistrationNo:
    "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)",
  hospitalId: "1. Name of the Reporting Institution (RI)",
  departmentName: "3(a). Department name",
  unitNumber: "3(b). Unit number",
  hospitalRegistrationNo: "4. Hospital registration number (MRD No / CR No./Unique Hospital Identification Number)",
  dateOfReporting: "5. Date of reporting",
  caseRegisteredThrough: "6. Case Registered Through (Patient’s first reporting at RI)",
  referralType: "7. Type of referral",
  referralFacilityName: "7(a). Name of Facility.",
  referralFacilityCity: "7(b). City",
  referralFacilityDistrict: "7(c). District",
  referralFacilityHospitalLabNh: "7(d). Hospital / LAB / N.H.",
  referralFacilityRegDate: "7(e). Date of Registration",
  dateOfFirstDiagnosis: "8. Date of first diagnosis",
  maritalStatus: "16. Marital status",
  education: "17. Education",
  status: "Registration status",
  formCompletedBy: "31. Name of person completing form (IN CAPITALS)",
  formCompletionDate: "32. Date of completion of form",
  // Side tables
  addressType: "Flat / House No.",
  pinCode: "PIN Code",
  mobileNumber: "Mobile number",
  email: "Email address",
  idType: "13. Unique identification",
  number: "13. Unique identification",
  relationship: "14. Relative details",
  name: "9. Full name",
  habit: "18(a). Habits",
  comorbidity: "18(b). Co-Morbidities",
  answer: "18(a). Habits",
  durationMonths: "18(a). Habits",
  // Pathology
  icdoTopography: "23(a). Primary Site of Tumour - Topography",
  icdoMorphology: "23(b). Primary Histology - Morphology",
  icd10Site: "24. Site of Tumour (ICD-10)",
  laterality: "25. Laterality",
  pairedLaterality: "25. Laterality",
  sequence: "26. Sequence",
  // Family history
  familyHistory:
    "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)",
  relationshipWithCancer:
    "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)",
  degreeOfRelationship:
    "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)",
  primarySite:
    "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)",
  ageAtDiagnosis:
    "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)",
  dateOfDiagnosis:
    "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)",
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
