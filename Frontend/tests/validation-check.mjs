#!/usr/bin/env node
/**
 * Frontend validation tests. Exercises the step 1 / 2 / 3 rule sets
 * against representative values to confirm:
 *   - Empty values produce the expected required-field errors.
 *   - Conditional / cross-field rules fire.
 *   - Pattern rules reject malformed PIN / mobile / email / hbcr-no.
 *   - A clean payload produces zero errors.
 *
 * The validators are written in TypeScript, so we transpile-on-the-fly
 * using esbuild (already a project dep via vite). This keeps the test
 * runner dependency-free and ensures we are testing the same code the
 * app actually runs.
 */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const entry = resolve(__dirname, "_validationEntry.ts");

const out = await build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2020",
  write: false,
  sourcemap: false,
  logLevel: "silent",
});

const code = out.outputFiles[0].text;
const blob = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const mod = await import(blob);

const { validateStep1 } = mod;
const { validateStep2 } = mod;
const { validateStep3 } = mod;

let pass = 0;
let fail = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail += 1;
    failures.push({ name, error: e.message });
    console.log(`  ✗ ${name}\n      ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function hasError(errors, label) {
  return Object.prototype.hasOwnProperty.call(errors, label);
}

function noError(errors, label) {
  if (hasError(errors, label)) {
    throw new Error(`Expected NO error on "${label}", got: ${errors[label]}`);
  }
}

// ---------------------------------------------------------------------------
// Step 1
// ---------------------------------------------------------------------------
console.log("Step 1");

check("empty form yields required errors on all mandatory fields", () => {
  const errs = validateStep1({});
  assert(hasError(errs, "1. Name of the Reporting Institution (RI)"), "RI required");
  assert(hasError(errs, "5. Date of reporting"), "Date of reporting required");
  assert(hasError(errs, "8. Date of first diagnosis"), "Date of first diagnosis required");
  assert(hasError(errs, "9. Full name"), "Full name required");
  assert(hasError(errs, "12. Gender"), "Gender required");
  assert(hasError(errs, "16. Marital status"), "Marital status required");
  assert(hasError(errs, "17. Education"), "Education required");
  assert(hasError(errs, "Height (cm)"), "Height required");
  assert(hasError(errs, "Weight (kg)"), "Weight required");
  assert(
    hasError(
      errs,
      "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)",
    ),
    "Family history required",
  );
});

check("blank string treated as missing for required fields", () => {
  const errs = validateStep1({
    "1. Name of the Reporting Institution (RI)": "   ",
    "9. Full name": "",
  });
  assert(hasError(errs, "1. Name of the Reporting Institution (RI)"), "RI blank must error");
  assert(hasError(errs, "9. Full name"), "Full name blank must error");
});

check("HBCR registration number pattern enforced", () => {
  const errs = validateStep1({
    "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)":
      "BAD-FORMAT",
  });
  assert(
    hasError(
      errs,
      "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)",
    ),
    "Bad hbcr number should error",
  );
});

check("HBCR registration number accepts HBCR-2024-0185", () => {
  const errs = validateStep1({
    "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)":
      "HBCR",
  });
  noError(
    errs,
    "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)",
  );
});

check("future date-of-birth rejected", () => {
  const errs = validateStep1({ "11. Date of Birth": "2999-01-01" });
  assert(hasError(errs, "11. Date of Birth"), "Future DOB must error");
});

check("age out of range rejected", () => {
  const errs = validateStep1({ "10. Age": "999" });
  assert(hasError(errs, "10. Age"), "Age out of range must error");
});

check("invalid PIN code rejected", () => {
  const errs = validateStep1({ "PIN Code": "0123" });
  assert(hasError(errs, "PIN Code"), "Bad PIN must error");
  const errs2 = validateStep1({ "PIN Code": "110001" });
  noError(errs2, "PIN Code");
});

check("invalid mobile rejected", () => {
  const errs = validateStep1({ "Mobile number": "12345" });
  assert(hasError(errs, "Mobile number"), "Bad mobile must error");
});

check("invalid email rejected", () => {
  const errs = validateStep1({ "Email address": "not-an-email" });
  assert(hasError(errs, "Email address"), "Bad email must error");
});

check("referral conditional sub-fields required when 'Other Hospital'", () => {
  const errs = validateStep1({ "7. Type of referral": "Other Hospital/Health Facility" });
  assert(hasError(errs, "7(a). Name of Facility."), "Facility name required");
  assert(hasError(errs, "7(b). City"), "Facility city required");
  assert(hasError(errs, "7(c). District"), "Facility district required");
  assert(hasError(errs, "7(d). Hospital / LAB / N.H."), "Facility hospital required");
  assert(hasError(errs, "7(e). Date of Registration"), "Facility date required");
});

check("referral conditional sub-fields NOT required when 'Self'", () => {
  const errs = validateStep1({ "7. Type of referral": "Self" });
  noError(errs, "7(a). Name of Facility.");
  noError(errs, "7(b). City");
  noError(errs, "7(c). District");
  noError(errs, "7(d). Hospital / LAB / N.H.");
  noError(errs, "7(e). Date of Registration");
});

check("date of first diagnosis cannot precede date of reporting", () => {
  const errs = validateStep1({
    "5. Date of reporting": "2024-07-10",
    "8. Date of first diagnosis": "2024-07-01",
  });
  assert(hasError(errs, "8. Date of first diagnosis"), "DX before report must error");
});

check("date of first diagnosis on or after reporting is OK", () => {
  const errs = validateStep1({
    "5. Date of reporting": "2024-07-01",
    "8. Date of first diagnosis": "2024-07-10",
  });
  noError(errs, "8. Date of first diagnosis");
});

check("referral registration date before reporting date rejected", () => {
  const errs = validateStep1({
    "5. Date of reporting": "2024-07-10",
    "7. Type of referral": "Other Hospital/Health Facility",
    "7(e). Date of Registration": "2024-07-01",
  });
  assert(hasError(errs, "7(e). Date of Registration"), "Earlier reg date must error");
});

check("fully populated step 1 produces no errors", () => {
  const errs = validateStep1({
    "1. Name of the Reporting Institution (RI)": "AIIMS New Delhi",
    "2. HBCR Registration Number ( First 2 digits are for year of registration and the next 5 digits for actual registration number)":
      "HBCR-2024-0185",
    "3(a). Department name": "Oncology",
    "3(b). Unit number": "Unit 4",
    "4. Hospital registration number (MRD No / CR No./Unique Hospital Identification Number)": "MRD-1",
    "5. Date of reporting": "2024-07-01",
    "6. Case Registered Through (Patient’s first reporting at RI)": "In Patient Elective",
    "7. Type of referral": "Self",
    "8. Date of first diagnosis": "2024-07-02",
    "9. Full name": "Jane Doe",
    "10. Age": "42",
    "11. Date of Birth": "1982-01-15",
    "12. Gender": "Female",
    "16. Marital status": "Married",
    "17. Education": "Graduate and above",
    "Height (cm)": "160",
    "Weight (kg)": "62",
    "Flat / House No.": "12B",
    "Street / Road": "Main",
    "City": "Delhi",
    "District": "South",
    "State": "Delhi",
    "PIN Code": "110001",
    "Mobile number": "9876543210",
    "Email address": "jane@example.com",
    "19. History of Familial Cancer (for cancers of breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas)":
      "No",
  });
  const unexpected = Object.keys(errs);
  if (unexpected.length > 0) {
    throw new Error("Expected no errors, got: " + JSON.stringify(unexpected.map((k) => [k, errs[k]])));
  }
});

// ---------------------------------------------------------------------------
// Step 2
// ---------------------------------------------------------------------------
console.log("Step 2");

check("no diagnostic method selected => error", () => {
  const errs = validateStep2({});
  assert(hasError(errs, "_diagnostic.methods"), "Methods required");
});

check("clinical only without date => error", () => {
  const errs = validateStep2({ "_diagnostic.methods": ["Clinical Only"] });
  assert(hasError(errs, "_diagnostic.clinicalDate"), "Clinical date required");
});

check("clinical only with date => no error", () => {
  const errs = validateStep2({
    "_diagnostic.methods": ["Clinical Only"],
    "_diagnostic.clinicalDate": "2024-07-01",
  });
  noError(errs, "_diagnostic.clinicalDate");
  noError(errs, "_diagnostic.methods");
});

check("laterality required", () => {
  const errs = validateStep2({});
  assert(hasError(errs, "25. Laterality"), "Laterality required");
});

check("ICD-O-3 and ICD-10 required", () => {
  const errs = validateStep2({});
  assert(hasError(errs, "23(a). Primary Site of Tumour - Topography"), "Topo required");
  assert(hasError(errs, "23(b). Primary Histology - Morphology"), "Morph required");
  assert(hasError(errs, "24. Site of Tumour (ICD-10)"), "ICD10 required");
  assert(hasError(errs, "26. Sequence"), "Sequence required");
});

check("fully populated step 2 produces no errors", () => {
  const errs = validateStep2({
    "_diagnostic.methods": ["Microscopic"],
    "21. Longest duration of symptom for cancer (in months)": "3",
    "22(a). Anatomical site": "Upper outer quadrant",
    "22(b). Pathology slide number": "S-1",
    "22(c). Primary tumor site": "Breast",
    "22(d). Morphology": "Ductal",
    "23(a). Primary Site of Tumour - Topography": "C50.4",
    "23(b). Primary Histology - Morphology": "8500/3",
    "23(c). Secondary Site of Tumour": "",
    "23(d). Morphology of Metastasis": "",
    "24. Site of Tumour (ICD-10)": "C50",
    "25. Laterality": "Paired Site",
    "26. Sequence": "One Primary Only",
  });
  const unexpected = Object.keys(errs);
  if (unexpected.length > 0) {
    throw new Error("Expected no errors, got: " + JSON.stringify(unexpected));
  }
});

// ---------------------------------------------------------------------------
// Step 3
// ---------------------------------------------------------------------------
console.log("Step 3");

check("empty step 3 yields required errors", () => {
  const errs = validateStep3({});
  assert(hasError(errs, "Clinical Extent of Disease Before Cancer Directed Treatment"), "Extent required");
  assert(hasError(errs, "28(a). Staging system"), "Staging required");
  assert(hasError(errs, "31. Name of person completing form (IN CAPITALS)"), "Form-completed-by required");
  assert(hasError(errs, "32. Date of completion of form"), "Form-completion-date required");
});

check("targeted-therapy 'Others' requires specify", () => {
  const errs = validateStep3({
    "30(b). Types of targeted therapy": "Others (Specify)",
  });
  assert(hasError(errs, "Specify targeted therapy"), "Specify required when Others");
});

check("targeted-therapy non-Others does not require specify", () => {
  const errs = validateStep3({
    "30(b). Types of targeted therapy": "Not Given",
  });
  noError(errs, "Specify targeted therapy");
});

check("fully populated step 3 produces no errors", () => {
  const errs = validateStep3({
    "Clinical Extent of Disease Before Cancer Directed Treatment": "Localized",
    "28(a). Staging system": "TNM",
    T: "T2",
    N: "N1",
    M: "M0",
    "28(c). Composite stage": "IIB",
    "30(b). Types of targeted therapy": "Not Given",
    "31. Name of person completing form (IN CAPITALS)": "DR. A. SRINIVASAN",
    "32. Date of completion of form": "2024-07-15",
  });
  const unexpected = Object.keys(errs);
  if (unexpected.length > 0) {
    throw new Error("Expected no errors, got: " + JSON.stringify(unexpected));
  }
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("");
console.log("=================");
console.log(`  PASS: ${pass}`);
console.log(`  FAIL: ${fail}`);
if (fail > 0) {
  console.log("");
  console.log("Failures:");
  for (const f of failures) console.log("  -", f.name, "::", f.error);
  process.exit(1);
}
process.exit(0);
