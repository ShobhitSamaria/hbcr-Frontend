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
  "Screen Detected",
  "Unknown",
];

export type Step1Values = {
  "1. Name of the Reporting Institution (RI)"?: string;
  "Centre code"?: string;
  "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)"?: string;
  "3(a). Department name"?: string;
  "3(b). Unit number"?: string;
  "4. Hospital registration number (MRD No / CR No./Unique Hospital Identification Number)"?: string;
  "5. Date of reporting"?: string;
  "6. Case Registered Through (Patient’s first reporting at RI)"?: string;
  "7. Type of referral"?: string;
  "7(a). Name of Facility."?: string;
  "7(b). City"?: string;
  "7(c). District"?: string;
  "7(d). Hospital / LAB / N.H."?: string;
  "7(e). Date of Registration"?: string;
  "8. Date of first diagnosis"?: string;
  "9. Full name"?: string;
  "10. Age"?: string;
  "11. Date of Birth"?: string;
  "12. Gender"?: string;
  "16. Marital status"?: string;
  "17. Education"?: string;
  "Height (cm)"?: string;
  "Weight (kg)"?: string;
  "Flat / House No."?: string;
  "Street / Road"?: string;
  City?: string;
  District?: string;
  State?: string;
  "PIN Code"?: string;
  "Mobile number"?: string;
  "Email address"?: string;
  "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)"?: string;
};

const step1Rules: RuleSet<Step1Values> = defineRules<Step1Values>({
  "1. Name of the Reporting Institution (RI)": [required(), minLen(2), maxLen(255)],
  "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)": [
    required(),
    pattern(/^HBCR-\d{4}-\d{4,5}$/, "Format must be HBCR-YYYY-NNNN (4–5 digits)"),
  ],
  "3(a). Department name": [maxLen(128)],
  "3(b). Unit number": [maxLen(32)],
  "4. Hospital registration number (MRD No / CR No./Unique Hospital Identification Number)": [
    maxLen(64),
  ],
  "5. Date of reporting": [required(), isDate(), notFutureDate()],
  "6. Case Registered Through (Patient’s first reporting at RI)": [
    // The select always has a default option pre-selected ("Out Patient"),
    // so we only enforce a non-empty value here. The four real values
    // are all valid backend enum members.
    required("Please choose a case-through type"),
  ],
  "7. Type of referral": [
    required("Please choose a referral type"),
    isOneOf(REFERRAL_OPTIONS, "Please choose a referral type"),
  ],
  "7(a). Name of Facility.": [maxLen(255)],
  "7(b). City": [maxLen(64)],
  "7(c). District": [maxLen(64)],
  "7(d). Hospital / LAB / N.H.": [maxLen(255)],
  "7(e). Date of Registration": [isDate(), notFutureDate()],
  "8. Date of first diagnosis": [required(), isDate(), notFutureDate()],
  "9. Full name": [required(), minLen(2), maxLen(255)],
  "10. Age": [isInt(), range(0, 130, "Age must be between 0 and 130")],
  "11. Date of Birth": [isDate(), notFutureDate()],
  "12. Gender": [
    // First option is the literal "Select gender" placeholder. Reject it
    // without listing every real value, since the user can pick "Male" /
    // "Female" / "Other" directly.
    required("Please select a gender"),
    notEquals(["Select gender"], "Please select a gender"),
  ],
  "16. Marital status": [
    // First option is the literal "Select status" placeholder. We must
    // reject it as "not yet chosen" without re-listing every real value.
    required("Please select a marital status"),
    notEquals(["Select status"], "Please select a marital status"),
  ],
  "17. Education": [required("Please select an education level")],
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
  "Flat / House No.": [maxLen(64)],
  "Street / Road": [maxLen(255)],
  City: [maxLen(64)],
  District: [maxLen(64)],
  State: [maxLen(64)],
  "PIN Code": [pattern(PIN_RE, "Enter a valid 6-digit Indian PIN code")],
  "Mobile number": [pattern(MOBILE_RE, "Enter a valid 10-digit Indian mobile number")],
  "Email address": [pattern(EMAIL_RE, "Enter a valid email address")],
  "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)": [
    required("Please choose Yes / No / Unknown"),
  ],
});

/**
 * Validates Step 1 including conditional and cross-field rules.
 * Returns a label -> first error message map.
 */
export function validateStep1(values: Record<string, unknown>): Record<string, string> {
  const out = validateRecord(step1Rules, values);

  // 7. Referral conditional sub-fields
  if (values["7. Type of referral"] === "Other Hospital/Health Facility") {
    const requiredIf = (label: string, msg: string) => {
      const v = values[label];
      if (v === undefined || v === null || String(v).trim() === "") {
        out[label] = msg;
      }
    };
    requiredIf("7(a). Name of Facility.", "Facility name is required");
    requiredIf("7(b). City", "Facility city is required");
    requiredIf("7(c). District", "Facility district is required");
    requiredIf("7(d). Hospital / LAB / N.H.", "Facility hospital/lab is required");
    const regDate = values["7(e). Date of Registration"];
    if (!regDate) {
      out["7(e). Date of Registration"] = "Facility registration date is required";
    }
  }

  // Cross-field: 8. Date of first diagnosis >= 5. Date of reporting
  const dx = values["8. Date of first diagnosis"];
  const rep = values["5. Date of reporting"];
  if (
    typeof dx === "string" &&
    typeof rep === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dx) &&
    /^\d{4}-\d{2}-\d{2}$/.test(rep)
  ) {
    if (new Date(dx + "T00:00:00Z").getTime() < new Date(rep + "T00:00:00Z").getTime()) {
      out["8. Date of first diagnosis"] =
        "Date of first diagnosis cannot be before date of reporting";
    }
  }

  // Cross-field: 7(e). Date of Registration on or after 5. Date of reporting
  if (values["7. Type of referral"] === "Other Hospital/Health Facility") {
    const afterMsg = after(
      "5. Date of reporting",
      "Registration date must be on or after the reporting date",
    )(values["7(e). Date of Registration"], values);
    if (afterMsg) out["7(e). Date of Registration"] = afterMsg;
  }

  return out;
}
