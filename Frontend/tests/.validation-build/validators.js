// client/lib/validation.ts
var required = (message = "Required") => (v) => {
  if (v === void 0 || v === null) return message;
  if (typeof v === "string" && v.trim() === "") return message;
  if (Array.isArray(v) && v.length === 0) return message;
  return null;
};
var minLen = (n, message) => (v) => {
  if (v === void 0 || v === null || v === "") return null;
  if (typeof v !== "string" || v.trim().length < n)
    return message ?? `Must be at least ${n} characters`;
  return null;
};
var maxLen = (n, message) => (v) => {
  if (v === void 0 || v === null || v === "") return null;
  if (typeof v !== "string" || v.length > n)
    return message ?? `Must be at most ${n} characters`;
  return null;
};
var isInt = (message = "Must be a whole number") => (v) => {
  if (v === void 0 || v === null || v === "") return null;
  const s = String(v);
  if (!/^-?\d+$/.test(s.trim())) return message;
  return null;
};
var range = (min, max, message) => (v) => {
  if (v === void 0 || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return message ?? `Must be between ${min} and ${max}`;
  if (n < min || n > max) return message ?? `Must be between ${min} and ${max}`;
  return null;
};
var pattern = (re, message) => (v) => {
  if (v === void 0 || v === null || v === "") return null;
  if (typeof v !== "string" || !re.test(v.trim())) return message;
  return null;
};
var notEquals = (bad, message = "Please select a value") => (v) => {
  if (v === void 0 || v === null || v === "") return null;
  const banned = Array.isArray(bad) ? bad : [bad];
  if (banned.includes(String(v))) return message;
  return null;
};
var isDate = (message = "Enter a valid date") => (v) => {
  if (v === void 0 || v === null || v === "") return null;
  if (typeof v !== "string") return message;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return message;
  const d = /* @__PURE__ */ new Date(v + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return message;
  return null;
};
var notFutureDate = (message = "Date cannot be in the future") => (v) => {
  if (v === void 0 || v === null || v === "") return null;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return null;
  const d = /* @__PURE__ */ new Date(v + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  const today = /* @__PURE__ */ new Date();
  today.setUTCHours(23, 59, 59, 999);
  if (d.getTime() > today.getTime()) return message;
  return null;
};
var after = (otherField, message = "Date must be on or after the related date") => (v, all) => {
  if (v === void 0 || v === null || v === "") return null;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return null;
  const other = all[otherField];
  if (typeof other !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(other.trim())) return null;
  const a = (/* @__PURE__ */ new Date(v + "T00:00:00Z")).getTime();
  const b = (/* @__PURE__ */ new Date(other.trim() + "T00:00:00Z")).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  if (a < b) return message;
  return null;
};
function validateRecord(rules, values) {
  const errors = {};
  for (const key of Object.keys(rules)) {
    const fieldRules = rules[key];
    if (!fieldRules) continue;
    const value = values[key];
    for (const r of fieldRules) {
      const msg = r(value, values);
      if (msg) {
        errors[key] = msg;
        break;
      }
    }
  }
  return errors;
}
function defineRules(rules) {
  return rules;
}

// client/lib/registration/step1Rules.ts
var PIN_RE = /^[1-9][0-9]{5}$/;
var MOBILE_RE = /^[6-9][0-9]{9}$/;
var EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
var REFERRAL_OPTIONS = [
  "Self",
  "Other Hospital/Health Facility",
  "Screen Detected",
  "Unknown"
];
var CASE_THROUGH_PLACEHOLDER = "Out Patient";
var GENDER_OPTIONS = ["Male", "Female", "Other"];
var MARITAL_OPTIONS = ["Married", "Single", "Widowed", "Divorced"];
var step1Rules = defineRules({
  "1. Name of the Reporting Institution (RI)": [required(), minLen(2), maxLen(255)],
  "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)": [
    required(),
    pattern(/^HBCR-\d{4}-\d{4,5}$/, "Format must be HBCR-YYYY-NNNN (4\u20135 digits)")
  ],
  "3(a). Department name": [maxLen(128)],
  "3(b). Unit number": [maxLen(32)],
  "4. Hospital registration number (MRD No / CR No./Unique Hospital Identification Number)": [
    maxLen(64)
  ],
  "5. Date of reporting": [required(), isDate(), notFutureDate()],
  "6. Case Registered Through (Patient\u2019s first reporting at RI)": [
    required("Please choose a case-through type"),
    notEquals([CASE_THROUGH_PLACEHOLDER], "Please choose a case-through type")
  ],
  "7. Type of referral": [
    required("Please choose a referral type"),
    notEquals(REFERRAL_OPTIONS, "Please choose a referral type")
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
    required("Please select a gender"),
    notEquals(["Select gender"], "Please select a gender"),
    notEquals(GENDER_OPTIONS, "Please select a gender")
  ],
  "16. Marital status": [
    required("Please select a marital status"),
    notEquals(["Select status"], "Please select a marital status"),
    notEquals(MARITAL_OPTIONS, "Please select a marital status")
  ],
  "17. Education": [required("Please select an education level")],
  "Height (cm)": [
    required("Height is required"),
    isInt(),
    range(0, 300, "Height must be between 0 and 300 cm")
  ],
  "Weight (kg)": [
    required("Weight is required"),
    isInt(),
    range(0, 700, "Weight must be between 0 and 700 kg")
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
    required("Please choose Yes / No / Unknown")
  ]
});
function validateStep1(values) {
  const out = validateRecord(step1Rules, values);
  if (values["7. Type of referral"] === "Other Hospital/Health Facility") {
    const requiredIf = (label, msg) => {
      const v = values[label];
      if (v === void 0 || v === null || String(v).trim() === "") {
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
  const dx = values["8. Date of first diagnosis"];
  const rep = values["5. Date of reporting"];
  if (typeof dx === "string" && typeof rep === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dx) && /^\d{4}-\d{2}-\d{2}$/.test(rep)) {
    if ((/* @__PURE__ */ new Date(dx + "T00:00:00Z")).getTime() < (/* @__PURE__ */ new Date(rep + "T00:00:00Z")).getTime()) {
      out["8. Date of first diagnosis"] = "Date of first diagnosis cannot be before date of reporting";
    }
  }
  if (values["7. Type of referral"] === "Other Hospital/Health Facility") {
    const afterMsg = after(
      "5. Date of reporting",
      "Registration date must be on or after the reporting date"
    )(values["7(e). Date of Registration"], values);
    if (afterMsg) out["7(e). Date of Registration"] = afterMsg;
  }
  return out;
}
export {
  step1Rules,
  validateStep1
};
