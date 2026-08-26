#!/usr/bin/env node
/**
 * End-to-end manual test of all 3 registration steps.
 *
 *   1. Validates each step's values through the same rules the UI uses.
 *   2. Submits a real registration to the live backend (npm run start).
 *   3. Confirms backend 422 responses are mapped back to UI fields.
 *
 * Run with: BASE_URL=http://localhost:5050 node tests/registration-e2e.mjs
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
const blob = `data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString("base64")}`;
const { validateStep1, validateStep2, validateStep3 } = await import(blob);

const BASE = process.env.BASE_URL || "http://localhost:5050/api";

// Data routes are protected now, so sign in first and attach the token.
const AUTH = {
  username: process.env.AUTH_USERNAME || "hospital1",
  password: process.env.AUTH_PASSWORD || "HBCR@2024",
};

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(AUTH),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.data?.token) {
    throw new Error(`Login failed: ${res.status} ${body?.error?.message ?? "(no body)"}`);
  }
  return body.data.token;
}

const TOKEN = await login();

async function call(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${TOKEN}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

let pass = 0;
let fail = 0;

function ok(msg) { pass += 1; console.log(`  ✓ ${msg}`); }
function bad(msg, e) {
  fail += 1;
  console.log(`  ✗ ${msg}`);
  if (e) console.log(`      ${e}`);
}
function section(title) { console.log(`\n${title}`); }

async function test(name, fn) {
  try { await fn(); ok(name); }
  catch (e) { bad(name, e?.message ?? e); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ---------------------------------------------------------------------------
section("Live backend reachable");
await test("GET /api/health responds", async () => {
  const r = await call("/health");
  assert(r.status === 200 && r.body?.success === true, `status=${r.status}`);
});

const hospitals = (await call("/hospitals")).body.data;
assert(hospitals && hospitals.length > 0, "no hospitals seeded");
const hospitalId = hospitals[0].id;
ok(`picked hospital id=${hospitalId} (${hospitals[0].name})`);

// ---------------------------------------------------------------------------
section("Step 1 — empty form blocks navigation");
await test("validateStep1 on empty form returns errors", () => {
  const errs = validateStep1({});
  const must = [
    "1. Name of the Reporting Institution (RI)",
    "5. Date of reporting",
    "8. Date of first diagnosis",
    "First Name",
    "12. Gender",
    "16. Marital status",
    "17. Education",
    "Height (cm)",
    "Weight (kg)",
  ];
  for (const k of must) {
    if (!errs[k]) throw new Error(`Missing error on ${k}`);
  }
});

await test("'Other Hospital' referral without sub-fields errors", () => {
  const errs = validateStep1({ "7. Type of referral": "Other Hospital/Health Facility" });
  if (!errs["7(a). Name of Facility."]) throw new Error("expected facility name error");
  if (!errs["7(c). City"]) throw new Error("expected facility city error");
});

await test("'Self' referral with no other fields passes the referral branch", () => {
  const errs = validateStep1({ "7. Type of referral": "Self" });
  if (errs["7(a). Name of Facility."]) throw new Error("Self should not require facility name");
});

await test("DX before reporting date errors", () => {
  const errs = validateStep1({
    "5. Date of reporting": "2024-07-10",
    "8. Date of first diagnosis": "2024-07-01",
  });
  if (!errs["8. Date of first diagnosis"]) throw new Error("expected cross-field DX-before-report error");
});

// ---------------------------------------------------------------------------
section("Step 2 — diagnostic + coding rules");
await test("no diagnostic method => error (now required)", () => {
  const errs = validateStep2({});
  if (!errs["_diagnostic.methods"]) throw new Error("methods should be required now");
});

await test("Clinical Only without date => error", () => {
  const errs = validateStep2({ "_diagnostic.methods": ["Clinical Only"], "_diagnostic.microscopicLater": "Yes" });
  if (!errs["_diagnostic.clinicalDate"]) throw new Error("expected clinical date error");
});

await test("laterality missing => error (now required)", () => {
  const errs = validateStep2({});
  if (!errs["25. Laterality"]) throw new Error("laterality should be required now");
});

await test("ICD-O-3 codes missing => no errors (optional for now)", () => {
  const errs = validateStep2({});
  if (errs["23.1 Code"]) throw new Error("topography code should be optional: " + errs["23.1 Code"]);
  if (errs["23.2 Code"]) throw new Error("morphology code should be optional: " + errs["23.2 Code"]);
  if (errs["26. Sequence"]) throw new Error("sequence should be optional: " + errs["26. Sequence"]);
});

// ---------------------------------------------------------------------------
section("Step 3 — clinical treatment rules");
await test("empty step 3 => required errors", () => {
  const errs = validateStep3({});
  if (!errs["28(c). Composite stage"]) throw new Error("expected composite stage error");
  if (!errs["29. Treatment Given Prior to Registration at RI / Outside RI"]) throw new Error("expected treatment given error");
  if (!errs["31. Name of person completing form (IN CAPITALS)"]) throw new Error("expected form-completed-by error");
  if (!errs["32. Date of completion of form"]) throw new Error("expected form-completion-date error");
  if (!errs["33. Contact Number"]) throw new Error("expected contact number error");
  if (!errs["34. Designation"]) throw new Error("expected designation error");
});

await test("Others (Specify) targeted therapy => error", () => {
  const errs = validateStep3({ "30(b). Types of targeted therapy": "Others (Specify)" });
  if (!errs["Specify targeted therapy"]) throw new Error("expected specify error");
});

// ---------------------------------------------------------------------------
section("Live backend: a clean step-1 payload can be POSTed");
const HBCR_ID = `HBCR-2024-${String(Math.floor(Math.random() * 9000) + 1000)}`;
let patientId = 0;
let registrationId = 0;

await test("POST /api/patients with full payload → 201", async () => {
  const r = await call("/patients", {
    method: "POST",
    body: JSON.stringify({
      fullName: "Validation E2E Patient",
      age: 42,
      dateOfBirth: "1982-01-15",
      gender: "FEMALE",
    }),
  });
  assert(r.status === 201, `expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
  patientId = r.body.data.id;
  assert(patientId > 0, "missing patient id");
});

await test("POST /api/patients with bad gender → 422 (backend rejects)", async () => {
  const r = await call("/patients", {
    method: "POST",
    body: JSON.stringify({ fullName: "Bad", gender: "ALIEN" }),
  });
  assert(r.status === 422, `expected 422 got ${r.status}`);
  assert(Array.isArray(r.body?.error?.details), "expected details array");
});

await test("POST addresses with bad PIN → 422", async () => {
  const r = await call(`/patients/${patientId}/side/addresses`, {
    method: "POST",
    body: JSON.stringify({ addressType: "RESIDENTIAL", pinCode: "BAD" }),
  });
  assert(r.status === 422, `expected 422 got ${r.status}`);
});

await test("POST registration with bad hbcr no → 422", async () => {
  const r = await call(`/patients/${patientId}/registrations`, {
    method: "POST",
    body: JSON.stringify({
      hbcrRegistrationNo: "NOT-HBCR",
      hospitalId,
    }),
  });
  assert(r.status === 422, `expected 422 got ${r.status}`);
  assert(Array.isArray(r.body?.error?.details), "expected details array");
});

await test("POST registration with valid HBCR id → 201", async () => {
  const r = await call(`/patients/${patientId}/registrations`, {
    method: "POST",
    body: JSON.stringify({
      hbcrRegistrationNo: HBCR_ID,
      hospitalId,
      departmentName: "Oncology",
      unitNumber: "Unit 4",
      dateOfReporting: "2024-07-01",
      dateOfFirstDiagnosis: "2024-07-05",
      referralType: "SELF",
      maritalStatus: "MARRIED",
      education: "GRADUATE_AND_ABOVE",
    }),
  });
  assert(r.status === 201, `expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
  registrationId = r.body.data.id;
  assert(registrationId > 0, "missing registration id");
});

await test("POST pathological-diagnosis → 201", async () => {
  const r = await call(`/registrations/${registrationId}/pathological-diagnosis`, {
    method: "POST",
    body: JSON.stringify({
      icdoTopography: "C50.4",
      icdoMorphology: "8500/3",
      icd10Site: "C50",
      laterality: "PAIRED_SITE",
      pairedLaterality: "LEFT",
      sequence: "ONE_PRIMARY",
    }),
  });
  assert(r.status === 201, `expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
});

await test("POST family-history → 201", async () => {
  const r = await call(`/registrations/${registrationId}/family-history`, {
    method: "POST",
    body: JSON.stringify({ familyHistory: "NO" }),
  });
  assert(r.status === 201, `expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
});

await test("POST diagnostic-method → 201", async () => {
  const r = await call(`/registrations/${registrationId}/diagnostic-methods`, {
    method: "POST",
    body: JSON.stringify({ method: "MICROSCOPIC" }),
  });
  assert(r.status === 201, `expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
});

await test("POST treatment → 201", async () => {
  const r = await call(`/registrations/${registrationId}/treatments`, {
    method: "POST",
    body: JSON.stringify({
      treatmentStage: "AT_RI",
      treatmentGivenChoice: "YES",
      treatmentType: "ALLOPATHIC",
    }),
  });
  assert(r.status === 201, `expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
});

await test("Cleanup: DELETE registration cascade", async () => {
  const r = await call(`/registrations/${registrationId}`, { method: "DELETE" });
  assert(r.status === 204, `expected 204 got ${r.status}`);
});

await test("Cleanup: DELETE patient", async () => {
  const r = await call(`/patients/${patientId}`, { method: "DELETE" });
  assert(r.status === 204, `expected 204 got ${r.status}`);
});

// ---------------------------------------------------------------------------
section("Mapping: backend 422 details → UI label keys");
await test("apiErrorMap translates known backend fields to UI labels", async () => {
  const mod = await import(
    `data:text/javascript;base64,${Buffer.from(
      (
        await build({
          entryPoints: [resolve(__dirname, "../client/lib/registration/apiErrorMap.ts")],
          bundle: true,
          format: "esm",
          platform: "node",
          target: "es2020",
          write: false,
          sourcemap: false,
          logLevel: "silent",
        })
      ).outputFiles[0].text,
    ).toString("base64")}`
  );
  const mapped = mod.mapValidationDetailsToErrors([
    { field: "hbcrRegistrationNo", message: "Format must be HBCR-YYYY-NNNN" },
    { field: "pinCode", message: "Enter a valid 6-digit Indian PIN code" },
    { field: "icdoTopography", message: "ICD-O-3 topography is required" },
  ]);
  const keys = Object.keys(mapped);
  if (!keys.some((k) => k.startsWith("2. HBCR Registration Number"))) {
    throw new Error("hbcrRegistrationNo not mapped");
  }
  if (keys.includes("PIN Code") === false) throw new Error("pinCode not mapped");
  if (keys.includes("23.1 Code") === false) {
    throw new Error("icdoTopography not mapped");
  }
});

await test("unknown backend field maps to nothing (no UI label to highlight)", async () => {
  const mod = await import(
    `data:text/javascript;base64,${Buffer.from(
      (
        await build({
          entryPoints: [resolve(__dirname, "../client/lib/registration/apiErrorMap.ts")],
          bundle: true,
          format: "esm",
          platform: "node",
          target: "es2020",
          write: false,
          sourcemap: false,
          logLevel: "silent",
        })
      ).outputFiles[0].text,
    ).toString("base64")}`
  );
  const mapped = mod.mapValidationDetailsToErrors([{ field: "someMadeUpField", message: "X" }]);
  assert(Object.keys(mapped).length === 0, "unknown field should not map");
});

// ---------------------------------------------------------------------------
console.log("");
console.log("=================");
console.log(`  PASS: ${pass}`);
console.log(`  FAIL: ${fail}`);
if (fail > 0) process.exit(1);
process.exit(0);
