#!/usr/bin/env node
/**
 * Frontend integration check. Simulates the Registration orchestrator's full
 * submission pipeline by walking through the api.ts surface exactly like
 * Registration.tsx does on "Submit registration".
 *
 * Run with: BASE_URL=http://localhost:5050 node tests/integration-check.mjs
 */
// Hit the running backend directly (`npm run start` should be in 5050).
const BASE = process.env.BASE_URL || "http://localhost:5050/api";

async function call(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.success) {
    throw new Error(
      `${init.method ?? "GET"} ${path} -> ${res.status}: ${
        body?.error?.message ?? "(no body)"
      }`,
    );
  }
  return body.data;
}

const HBCR_ID = `HBCR-2024-${Math.floor(Math.random() * 9000 + 1000)}`;

console.log("HBCR_ID =", HBCR_ID);

// 1. Pick a hospital (orchestrator does this too)
const hospitals = await call("/hospitals");
console.log("hospitals =", hospitals.map((h) => h.name));
const hospitalId = hospitals[0].id;

// 2. Create patient
const patient = await call("/patients", {
  method: "POST",
  body: JSON.stringify({
    fullName: "Frontend Integration Patient",
    age: 35,
    gender: "FEMALE",
    dateOfBirth: "1989-04-12",
  }),
});
console.log("patient id =", patient.id);

// 3. Side tables
await call(`/patients/${patient.id}/side/addresses`, {
  method: "POST",
  body: JSON.stringify({
    addressType: "RESIDENTIAL",
    city: "New Delhi",
    state: "Delhi",
    pinCode: "110001",
    mobileNumber: "9876543210",
    email: "e2e@example.com",
  }),
});
await call(`/patients/${patient.id}/side/relatives`, {
  method: "POST",
  body: JSON.stringify({
    relationship: "FATHER",
    name: "R Sharma",
    mobileNumber: "9876543211",
  }),
});
await call(`/patients/${patient.id}/side/habits`, {
  method: "POST",
  body: JSON.stringify({
    habit: "SMOKING",
    answer: "YES",
    durationMonths: 24,
  }),
});

// 4. Registration
const reg = await call(`/patients/${patient.id}/registrations`, {
  method: "POST",
  body: JSON.stringify({
    hbcrRegistrationNo: HBCR_ID,
    hospitalId,
    departmentName: "Oncology",
    dateOfReporting: "2024-08-01",
    caseRegisteredThrough: "OUT_PATIENT",
    referralType: "SELF",
    dateOfFirstDiagnosis: "2024-07-25",
    anthropometricHeightCm: 165,
    anthropometricWeightKg: 72,
    maritalStatus: "MARRIED",
    education: "GRADUATE_AND_ABOVE",
    status: "ACTIVE",
  }),
});
console.log("registration id =", reg.id);

// 5. Step 2 pathology + family history
await call(`/registrations/${reg.id}/pathological-diagnosis`, {
  method: "POST",
  body: JSON.stringify({
    icdoTopography: "C50.9",
    icdoMorphology: "8500/3",
    icd10Site: "C50",
    laterality: "PAIRED_SITE",
    pairedLaterality: "LEFT",
    sequence: "ONE_PRIMARY",
  }),
});
await call(`/registrations/${reg.id}/family-history`, {
  method: "POST",
  body: JSON.stringify({
    familyHistory: "YES",
    relationshipWithCancer: "SAME_CANCER",
    degreeOfRelationship: "FIRST_DEGREE",
    primarySite: "BREAST",
  }),
});

// 6. Step 3 treatments
const t1 = await call(`/registrations/${reg.id}/treatments`, {
  method: "POST",
  body: JSON.stringify({
    treatmentStage: "PRIOR_REGISTRATION",
    treatmentGivenChoice: "YES",
    treatmentType: "ALLOPATHIC",
    stagingSystem: "TNM",
    tnmT: "T2",
    tnmN: "N1",
    tnmM: "M0",
    compositeStage: "IIB",
    ecogStatus: "KNOWN",
    ecogGrade: "GRADE_1",
    targetedTherapyType: "NOT_GIVEN",
  }),
});
console.log("treatment id =", t1.id);

// 7. Dashboard reflects the new patient
const stats = await call("/dashboard/stats");
console.log("stats =", stats);

// 8. Roundtrip: read the record back
const readBack = await call(`/registrations/${reg.id}`);
console.log("pathology =", readBack.pathologicalDiagnosis?.icdoTopography);
console.log("familyHistory =", readBack.familialCancerHistory?.familyHistory);
console.log("treatments =", readBack.treatments?.length);

console.log("✅ Frontend integration check PASSED");
