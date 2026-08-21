/**
 * Step 1 — Identifying & Administrative Details validation rules.
 *
 * Field labels MUST match the strings used as keys in the form-state
 * context (i.e. the `label` prop on every <Field> / <SelectField>).
 * Backend parity: see prisma/schema.prisma + src/validators/*.ts.
 */
import {
  after,
  defineRules,
  isDate,
  isInt,
  isOneOf,
  maxLen,
  minLen,
  notEquals,
  notFutureDate,
  pattern,
  range,
  required,
  validateRecord,
  type RuleSet,
} from "@/lib/validation";

const PIN_RE = /^[1-9][0-9]{5}$/;
const MOBILE_RE = /^[6-9][0-9]{9}$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const REFERRAL_OPTIONS = [
  "Self",
  "Other Hospital/Health Facility",
  "Screen Detected Referral",
  "Unknown",
];

export type Step1Values = {
  "1. Name of the Reporting Institution (RI)"?: string;
  "Centre code"?: string;
  "Reference Number"?: string;
  "Registration Number"?: string;
  "3(a). Department name"?: string;
  "3(b). Unit number"?: string;
  "4. Hospital Registration Number (MRD / CR / Unique ID)"?: string;
  "4. Hospital registration number"?: string;
  "5. Date of reporting"?: string;
  "6. Case Registered Through (Patient’s first reporting at RI)"?: string;
  "7. Type of referral"?: string;
  "7(a). Name of Facility."?: string;
  "7(b). Hospital / LAB / N.H."?: string;
  "7(c). City"?: string;
  "7(d). District"?: string;
  "7(e). Pincode"?: string;
  "7(f). Date of Registration"?: string;
  "8. Date of first diagnosis"?: string;
  "First Name"?: string;
  "Middle Name"?: string;
  "Last Name"?: string;
  "10. Date of Birth"?: string;
  "11. Age"?: string;
  "12. Gender"?: string;
  "16. Marital status"?: string;
  "17. Education"?: string;
  Occupation?: string;
  "Height (cm)"?: string;
  "Weight (kg)"?: string;
  "Urban / Rural"?: string;
  "Ward No."?: string;
  "Flat / House No."?: string;
  "Street / Road"?: string;
  City?: string;
  District?: string;
  State?: string;
  "PIN Code"?: string;
  "Mobile number"?: string;
  "Email address"?: string;
  "13. Beneficiary of Health Scheme (RGHS / MAAYOGNA / CGHS)"?: string;
  "13. Beneficiary of Health Scheme details"?: string;
  "19. Relationship to Cancer / Degree of Relationship"?: string;
};

const step1Rules: RuleSet<Step1Values> = defineRules<Step1Values>({
  "1. Name of the Reporting Institution (RI)": [required(), minLen(2), maxLen(255)],
  "Reference Number": [],
  "Registration Number": [],
  "3(a). Department name": [maxLen(128)],
  "3(b). Unit number": [maxLen(32)],
  "4. Hospital registration number": [maxLen(64)],
  "5. Date of reporting": [required(), isDate(), notFutureDate()],
  "6. Case Registered Through (Patient’s first reporting at RI)": [
    // The select starts with no option selected (placeholder "Select").
    // The user must explicitly pick one; reject the placeholder so an
    // untouched field is flagged.
    required("Please choose a case-through type"),
    notEquals(["Select"], "Please choose a case-through type"),
  ],
  "7. Type of referral": [
    required("Please choose a referral type"),
    isOneOf(REFERRAL_OPTIONS, "Please choose a referral type"),
  ],
  "7(a). Name of Facility.": [maxLen(255)],
  "7(b). Hospital / LAB / N.H.": [maxLen(255)],
  "7(c). City": [maxLen(64)],
  "7(d). District": [maxLen(64)],
  "7(e). Pincode": [pattern(PIN_RE, "Enter a valid 6-digit Indian PIN code")],
  "7(f). Date of Registration": [isDate(), notFutureDate()],
  "8. Date of first diagnosis": [required(), isDate()],
  "First Name": [
    required("Please enter the patient's first name"),
    minLen(2),
    maxLen(100),
  ],
  "Middle Name": [maxLen(100)],
  "Last Name": [maxLen(100)],
  "10. Date of Birth": [isDate(), notFutureDate()],
  "11. Age": [isInt(), range(0, 130, "Age must be between 0 and 130")],
  "12. Gender": [required("Please select a gender")],
  "16. Marital status": [required("Please select a marital status")],
  "17. Education": [required("Please select an education level")],
  Occupation: [maxLen(128)],
  "Height (cm)": [
    required("Height is required"),
    isInt(),
    range(0, 300, "Height must be between 0 and 300 cm"),
  ],
  "Weight (kg)": [
    required("Weight is required"),
    isInt(),
    range(0, 700, "Weight must be between 0 and 700 kg"),
  ],
  "Ward No.": [maxLen(32)],
  "Flat / House No.": [maxLen(64)],
  "Street / Road": [maxLen(255)],
  City: [maxLen(64)],
  District: [maxLen(64)],
  State: [maxLen(64)],
  "PIN Code": [pattern(PIN_RE, "Enter a valid 6-digit Indian PIN code")],
  "Mobile number": [pattern(MOBILE_RE, "Enter a valid 10-digit Indian mobile number")],
  "Email address": [pattern(EMAIL_RE, "Enter a valid email address")],
  "19. Relationship to Cancer / Degree of Relationship": [
    required("Please choose Yes / No / Unknown"),
  ],
});

/**
 * Validates Step 1 including conditional and cross-field rules.
 * Returns a label -> first error message map.
 */
export function validateStep1(values: Record<string, unknown>): Record<string, string> {
  const out = validateRecord(step1Rules, values);

  // 4. Hospital registration number: if a number is entered, a type must
  // be chosen (the dropdown's placeholder is not a real option).
  const hrNo = values["4. Hospital registration number"];
  const hrType = values["4. Hospital Registration Number (MRD / CR / Unique ID)"];
  if (
    hrNo !== undefined &&
    hrNo !== null &&
    String(hrNo).trim() !== "" &&
    (!hrType || hrType === "")
  ) {
    out["4. Hospital Registration Number (MRD / CR / Unique ID)"] =
      "Please select a registration number type";
  }

  // 7. Referral conditional sub-fields
  if (values["7. Type of referral"] === "Other Hospital/Health Facility") {
    const requiredIf = (label: string, msg: string) => {
      const v = values[label];
      if (v === undefined || v === null || String(v).trim() === "") {
        out[label] = msg;
      }
    };
    requiredIf("7(a). Name of Facility.", "Facility name is required");
    requiredIf("7(b). Hospital / LAB / N.H.", "Facility hospital/lab is required");
    requiredIf("7(c). City", "Facility city is required");
    requiredIf("7(d). District", "Facility district is required");
    const regDate = values["7(f). Date of Registration"];
    if (!regDate) {
      out["7(f). Date of Registration"] = "Facility registration date is required";
    }
  }

  // Cross-field: 7(f). Date of Registration on or after 5. Date of reporting
  if (values["7. Type of referral"] === "Other Hospital/Health Facility") {
    const afterMsg = after(
      "5. Date of reporting",
      "Registration date must be on or after the reporting date",
    )(values["7(f). Date of Registration"], values);
    if (afterMsg) out["7(f). Date of Registration"] = afterMsg;
  }

  return out;
}
