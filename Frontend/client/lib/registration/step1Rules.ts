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
  maxLen,
  minLen,
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

export type Step1Values = {
  "1. Name of the Reporting Institution (RI)"?: string;
  "Centre code"?: string;
  "Reference Number"?: string;
  "Registration Number"?: string;
  "3(a). Department name"?: string;
  "3(b). Unit number"?: string;
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
  "17(a). Education (Other)"?: string;
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
  "Father mobile number"?: string;
  "Mother mobile number"?: string;
  "Spouse mobile number"?: string;
  "Son mobile number"?: string;
  "Daughter mobile number"?: string;
  "Other mobile number"?: string;
  "Duration of Stay at the above address (in years)"?: string;
  "19. Relationship to Cancer / Degree of Relationship"?: string;
  // 13. Unique Identification — radio values keyed by id-{label}
  "id-a). Aadhaar"?: string;
  "id-b). ABHA"?: string;
  "id-c). PAN Card"?: string;
  "id-d). Voter ID"?: string;
  "id-e). Passport"?: string;
  "id-f). AB-PMJAY"?: string;
  "id-g). Other"?: string;
  "a). Aadhaar number"?: string;
  "b). ABHA number"?: string;
  "c). PAN Card number"?: string;
  "d). Voter ID number"?: string;
  "e). Passport number"?: string;
  "f). AB-PMJAY number"?: string;
  "g). Other number"?: string;
  "g). Other name"?: string;
};

const step1Rules: RuleSet<Step1Values> = defineRules<Step1Values>({
  "1. Name of the Reporting Institution (RI)": [required(), minLen(2), maxLen(255)],
  "Reference Number": [],
  "Registration Number": [],
  "3(a). Department name": [required("Department name is required"), maxLen(128)],
  "3(b). Unit number": [required("Unit number is required"), maxLen(32)],
  "5. Date of reporting": [required(), isDate(), notFutureDate()],
  "6. Case Registered Through (Patient’s first reporting at RI)": [
    // The select starts with no option selected (placeholder "Select").
    // The user must explicitly pick one; reject the placeholder so an
    // untouched field is flagged.
    required("Please choose a case-through type"),
  ],
  "7. Type of referral": [
    required("Please choose a referral type"),
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
  "10. Date of Birth": [required("Date of birth is required"), isDate(), notFutureDate()],
  "11. Age": [required("Age is required"), isInt(), range(0, 130, "Age must be between 0 and 130")],
  "12. Gender": [required("Please select a gender")],
  "16. Marital status": [required("Please select a marital status")],
  "17. Education": [required("Please select an education level")],
  Occupation: [maxLen(128)],
  "Duration of Stay at the above address (in years)": [
    required("Duration of stay is required"),
    isInt(),
    range(0, 150, "Duration must be between 0 and 150 years"),
  ],
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
  "Flat / House No.": [required("Flat/House number is required"), maxLen(64)],
  "Street / Road": [required("Street/Road is required"), maxLen(255)],
  City: [required("City is required"), maxLen(64)],
  District: [required("District is required"), maxLen(64)],
  State: [required("State is required"), maxLen(64)],
  "PIN Code": [required("PIN code is required"), pattern(PIN_RE, "Enter a valid 6-digit Indian PIN code")],
  "Mobile number": [required("Mobile number is required"), pattern(MOBILE_RE, "Enter a valid 10-digit Indian mobile number")],
  "Email address": [pattern(EMAIL_RE, "Enter a valid email address")],
  "Father mobile number": [pattern(MOBILE_RE, "Enter a valid 10-digit mobile number")],
  "Mother mobile number": [pattern(MOBILE_RE, "Enter a valid 10-digit mobile number")],
  "Spouse mobile number": [pattern(MOBILE_RE, "Enter a valid 10-digit mobile number")],
  "Son mobile number": [pattern(MOBILE_RE, "Enter a valid 10-digit mobile number")],
  "Daughter mobile number": [pattern(MOBILE_RE, "Enter a valid 10-digit mobile number")],
  "Other mobile number": [pattern(MOBILE_RE, "Enter a valid 10-digit mobile number")],
  "Urban / Rural": [required("Please select Urban or Rural")],
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
    if (!regDate || String(regDate).trim() === "") {
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

  // 13. Unique Identification
  // Aadhaar and ABHA are always mandatory (direct input, no Yes/No toggle).
  const mandatoryIds: Array<{
    numLabel: string;
    pattern: RegExp;
    formatMsg: string;
  }> = [
    { numLabel: "a). Aadhaar number", pattern: /^[0-9]{12}$/, formatMsg: "Aadhaar must be exactly 12 digits" },
    { numLabel: "b). ABHA number", pattern: /^[0-9]{14}$/, formatMsg: "ABHA must be exactly 14 digits" },
  ];
  for (const { numLabel, pattern, formatMsg } of mandatoryIds) {
    const numVal = values[numLabel];
    if (numVal === undefined || numVal === null || String(numVal).trim() === "") {
      out[numLabel] = `${numLabel.replace(' number', '')} is required`;
    } else if (!pattern.test(String(numVal).trim())) {
      out[numLabel] = formatMsg;
    }
  }
  // Optional ID types — only required when Yes is selected via radio toggle.
  const optionalIds: Array<{
    label: string;
    numLabel: string;
    pattern?: RegExp;
    formatMsg?: string;
  }> = [
    { label: "c). PAN Card", numLabel: "c). PAN Card number", pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/, formatMsg: "PAN must be 5 uppercase letters + 4 digits + 1 uppercase letter" },
    { label: "d). Voter ID", numLabel: "d). Voter ID number", pattern: /^[A-Za-z0-9]{10}$/, formatMsg: "Voter ID must be exactly 10 alphanumeric characters" },
    { label: "e). Passport", numLabel: "e). Passport number", pattern: /^[A-Z][0-9]{7}$/, formatMsg: "Passport must be 1 uppercase letter + 7 digits" },
    { label: "f). AB-PMJAY", numLabel: "f). AB-PMJAY number", pattern: /^[A-Za-z0-9\-]+$/, formatMsg: "AB-PMJAY ID contains invalid characters" },
    { label: "g). Other", numLabel: "g). Other number" },
  ];
  for (const { label, numLabel, pattern, formatMsg } of optionalIds) {
    const idVal = values[`id-${label}`];
    if (idVal === undefined || idVal === null || String(idVal).trim() === "") {
      continue;
    }
    const numVal = values[numLabel];
    // g). Other does not require a number — the input is disabled
    if (label === "g). Other") continue;
    if (numVal === undefined || numVal === null || String(numVal).trim() === "") {
      out[numLabel] = `${label.replace('). ', '')} number is required when Yes is selected`;
    } else if (pattern && !pattern.test(String(numVal).trim())) {
      out[numLabel] = formatMsg ?? `Invalid format for ${label}`;
    }
    // g). Other does not require number or name — the inputs are disabled
  }

  // 13(b). Beneficiary of Health Scheme — if Yes, details required
  const healthScheme = values["13. Beneficiary of Health Scheme (RGHS / MAAYOGNA / CGHS)"];
  if (healthScheme === "Yes") {
    const details = values["13. Beneficiary of Health Scheme details"];
    if (!details || String(details).trim() === "") {
      out["13. Beneficiary of Health Scheme details"] = "Health scheme details are required when Yes is selected";
    }
  }

  // 17. Education — if "Others (specify)" is selected, the Other text must be filled
  if (values["17. Education"] === "Others (specify)") {
    const other = values["17(a). Education (Other)"];
    if (!other || String(other).trim() === "") {
      out["17(a). Education (Other)"] = "Please specify the education level";
    }
  }

  // 18(a/b). Habits & Co-Morbidities — if Yes, Duration is required
  const habitItems = ["Smoking", "Smokeless", "Betel Nut with Tobacco", "Betel Nut without Tobacco", "Alcohol"];
  const comorbidityItems = ["Tuberculosis", "Hypertension", "Diabetes", "Ischemic Heart Disease", "COPD / Asthma", "Stroke", "Depression", "Hepatitis B", "Hepatitis C", "NAFLD", "Chronic Kidney Disease", "HIV/AIDS", "Hypothyroidism", "Others"];
  for (const section of ["18(a). Habits", "18(b). Co-Morbidities"]) {
    const items = section === "18(a). Habits" ? habitItems : comorbidityItems;
    for (const item of items) {
      const answerKey = `${section}::${item}::answer`;
      const durationKey = `${section}::${item}::duration`;
      const answer = values[answerKey];
      if (answer === "Yes") {
        const dur = values[durationKey];
        if (dur === undefined || dur === null || String(dur).trim() === "") {
          out[durationKey] = "Duration (Months) is required when Yes is selected";
        }
      }
    }
  }

  return out;
}
