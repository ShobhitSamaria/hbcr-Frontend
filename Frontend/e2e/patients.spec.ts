/**
 * ═══════════════════════════════════════════════════════════════
 *  PATIENT REGISTRATION — Single Session Test Suite
 * ═══════════════════════════════════════════════════════════════
 *
 *  Architecture:
 *    1. Open Brave browser ONCE
 *    2. Login ONCE
 *    3. Create multiple patient records sequentially in SAME session
 *    4. Each patient = one test scenario
 *    5. After all patients: verify in Patient Records
 *    6. Verify View/Edit mode
 *    7. Close browser
 *
 *  Run:  cd Frontend && npx playwright test e2e/patients.spec.ts
 *  Watch: cd Frontend && npx playwright test e2e/patients.spec.ts --headed
 * ═══════════════════════════════════════════════════════════════
 */

import { test, expect } from "@playwright/test";
import {
  login,
  goToNewRegistration,
  goToPatientRecords,
  fillField,
  fillFieldByPlaceholder,
  selectDropdown,
  clickRadio,
  selectUrbanRural,
  selectIdYes,
  fillOtherId,
  fillAddress,
  saveAndContinue,
  submitRegistration,
  openPatientRecord,
  clickEdit,
} from "./helpers";

/* ──────────────────────────────────────────────
   Patient data types
   ────────────────────────────────────────────── */

interface Step1Data {
  department?: string;
  unitNumber?: string;
  dateOfReporting?: string;
  caseRegisteredThrough?: string;
  caseRegisteredThroughOther?: string;
  typeOfReferral?: string;
  referralFacility?: string;
  referralHospital?: string;
  referralCity?: string;
  referralDistrict?: string;
  referralPincode?: string;
  referralDate?: string;
  dateOfFirstDiagnosis?: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth: string;
  gender: string;
  aadhaar: string;
  abha: string;
  panCard?: { enabled: boolean; number?: string };
  voterId?: { enabled: boolean; number?: string };
  passport?: { enabled: boolean; number?: string };
  abpmjay?: { enabled: boolean; number?: string };
  otherId?: { enabled: boolean; name?: string; number?: string };
  fatherName?: string;
  fatherMobile?: string;
  motherName?: string;
  spouseName?: string;
  urbanRural: "Urban" | "Rural";
  houseNo?: string;
  wardNo?: string;
  street?: string;
  city?: string;
  durationOfStay: string;
  mobile?: string;
  email?: string;
  maritalStatus: string;
  education: string;
  occupation?: string;
}

interface Step2Data {
  clinicalOnly?: boolean;
  microscopic?: boolean;
  longestSymptomDuration?: string;
  pathologicalSite?: string;
  pathologySlideNo?: string;
  primarySiteTopography?: string;
  primaryHistology?: string;
  grade?: string;
  laterality?: string;
}

interface Step3Data {
  clinicalExtent?: string;
  stagingSystem?: string;
  tnmT?: string;
  tnmN?: string;
  tnmM?: string;
  compositeStage?: string;
  treatmentPrior?: string;
  surgeryDone?: boolean;
  radiotherapyDone?: boolean;
  chemotherapyDone?: boolean;
  nameOfPersonCompletingForm: string;
  contactNumber?: string;
  designation?: string;
}

/* ──────────────────────────────────────────────
   6 Patient Test Scenarios
   ────────────────────────────────────────────── */

const patients: Array<{
  name: string;
  desc: string;
  step1: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
}> = [
  {
    name: "Rahul Kumar Sharma",
    desc: "Happy path: Urban, Self referral, Clinical Only",
    step1: {
      department: "Oncology",
      unitNumber: "Unit 01",
      dateOfReporting: "2026-08-15",
      caseRegisteredThrough: "Out Patient",
      typeOfReferral: "Self",
      dateOfFirstDiagnosis: "2026-08-10",
      firstName: "Rahul",
      middleName: "Kumar",
      lastName: "Sharma",
      dateOfBirth: "1990-05-15",
      gender: "Male",
      aadhaar: "123456789012",
      abha: "12345678901234",
      fatherName: "Suresh Sharma",
      fatherMobile: "9876543210",
      motherName: "Sunita Sharma",
      spouseName: "Priya Sharma",
      urbanRural: "Urban",
      houseNo: "12, MG Road",
      wardNo: "5",
      street: "MG Road",
      city: "Jaipur",
      durationOfStay: "10",
      mobile: "9876543211",
      email: "rahul.sharma@test.com",
      maritalStatus: "Married",
      education: "Graduate and above",
      occupation: "Software Engineer",
    },
    step2: {
      clinicalOnly: true,
      longestSymptomDuration: "3",
      laterality: "Right",
    },
    step3: {
      clinicalExtent: "Localised",
      compositeStage: "I",
      treatmentPrior: "No",
      surgeryDone: true,
      nameOfPersonCompletingForm: "Dr. A. Srinivasan",
      contactNumber: "9876543210",
      designation: "Senior Registrar",
    },
  },
  {
    name: "Sita Devi Meena",
    desc: "Rural, Other Hospital referral, Habits=Yes",
    step1: {
      department: "Surgery",
      unitNumber: "Unit 02",
      dateOfReporting: "2026-08-20",
      caseRegisteredThrough: "In Patient Elective",
      typeOfReferral: "Other Hospital/Health Facility",
      referralFacility: "PHC Kishangarh",
      referralHospital: "District Hospital",
      referralCity: "Kishangarh",
      referralDistrict: "Ajmer",
      referralPincode: "305801",
      referralDate: "2026-08-18",
      dateOfFirstDiagnosis: "2026-08-05",
      firstName: "Sita",
      middleName: "Devi",
      lastName: "Meena",
      dateOfBirth: "1975-03-20",
      gender: "Female",
      aadhaar: "987654321098",
      abha: "98765432109876",
      fatherName: "Ram Singh Meena",
      fatherMobile: "9123456789",
      urbanRural: "Rural",
      houseNo: "House 45",
      wardNo: "3",
      street: "Main Road",
      city: "Kishangarh",
      durationOfStay: "25",
      mobile: "9123456780",
      maritalStatus: "Married",
      education: "Primary",
      occupation: "Farmer",
    },
    step2: {
      clinicalOnly: true,
      longestSymptomDuration: "6",
      laterality: "Left",
    },
    step3: {
      clinicalExtent: "Locally Advanced",
      compositeStage: "III",
      treatmentPrior: "No",
      radiotherapyDone: true,
      nameOfPersonCompletingForm: "Dr. B. Singh",
      contactNumber: "9123456780",
      designation: "Resident Doctor",
    },
  },
  {
    name: "Amit Patel",
    desc: "PAN Card=Yes, Microscopic, Urban",
    step1: {
      department: "Pathology",
      unitNumber: "Unit 03",
      dateOfReporting: "2026-08-22",
      caseRegisteredThrough: "Out Patient",
      typeOfReferral: "Screen Detected Referral",
      dateOfFirstDiagnosis: "2026-08-20",
      firstName: "Amit",
      lastName: "Patel",
      dateOfBirth: "1985-07-10",
      gender: "Male",
      aadhaar: "112233445566",
      abha: "11223344556677",
      panCard: { enabled: true, number: "ABCDE1234F" },
      fatherName: "Ramesh Patel",
      urbanRural: "Urban",
      houseNo: "78, Civil Lines",
      wardNo: "10",
      street: "Station Road",
      city: "Ahmedabad",
      durationOfStay: "15",
      mobile: "9988776655",
      email: "amit.patel@test.com",
      maritalStatus: "Single",
      education: "Technical-after matric",
      occupation: "Teacher",
    },
    step2: {
      microscopic: true,
      longestSymptomDuration: "2",
      pathologicalSite: "Right Breast",
      pathologySlideNo: "SL-2026-001",
      primarySiteTopography: "Breast",
      primaryHistology: "Invasive ductal carcinoma",
      grade: "Grade II",
      laterality: "Right",
    },
    step3: {
      stagingSystem: "TNM",
      tnmT: "T2",
      tnmN: "N1",
      tnmM: "M0",
      compositeStage: "IIB",
      treatmentPrior: "No",
      surgeryDone: true,
      chemotherapyDone: true,
      nameOfPersonCompletingForm: "Dr. C. Mehta",
      contactNumber: "9988776655",
      designation: "Consultant",
    },
  },
  {
    name: "Test Unknown Patient",
    desc: "Voter ID, Gender=Other, minimal Unknowns",
    step1: {
      department: "Oncology",
      unitNumber: "Unit 01",
      dateOfReporting: "2026-08-25",
      caseRegisteredThrough: "Unknown",
      typeOfReferral: "Unknown",
      dateOfFirstDiagnosis: "2026-08-25",
      firstName: "Test",
      middleName: "Unknown",
      lastName: "Patient",
      dateOfBirth: "1995-01-01",
      gender: "Other",
      aadhaar: "223344556677",
      abha: "22334455667788",
      voterId: { enabled: true, number: "ABC1234567" },
      urbanRural: "Urban",
      houseNo: "1",
      wardNo: "1",
      street: "Test Street",
      city: "Test City",
      durationOfStay: "1",
      maritalStatus: "Unknown",
      education: "Unknown",
    },
    step2: {
      clinicalOnly: true,
      longestSymptomDuration: "1",
      laterality: "Bilateral",
    },
    step3: {
      clinicalExtent: "Metastatic",
      compositeStage: "IV",
      treatmentPrior: "No",
      nameOfPersonCompletingForm: "Dr. D. Verma",
      contactNumber: "9876543212",
      designation: "Registrar",
    },
  },
  {
    name: "Fatima Khan",
    desc: "Passport, AB-PMJAY, Rural, complex referral",
    step1: {
      department: "Medical Oncology",
      unitNumber: "Unit 04",
      dateOfReporting: "2026-08-28",
      caseRegisteredThrough: "In Patient Emergency",
      typeOfReferral: "Other Hospital/Health Facility",
      referralFacility: "Apollo Hospital",
      referralHospital: "Apollo Cancer Centre",
      referralCity: "Chennai",
      referralDistrict: "Chennai",
      referralPincode: "600006",
      referralDate: "2026-08-26",
      dateOfFirstDiagnosis: "2026-08-25",
      firstName: "Fatima",
      lastName: "Khan",
      dateOfBirth: "1980-12-05",
      gender: "Female",
      aadhaar: "334455667788",
      abha: "33445566778899",
      passport: { enabled: true, number: "A1234567" },
      abpmjay: { enabled: true, number: "ABPMJAY-12345" },
      fatherName: "Mohammed Khan",
      fatherMobile: "9876543213",
      motherName: "Ayesha Khan",
      spouseName: "Omar Khan",
      urbanRural: "Rural",
      houseNo: "H.No 23",
      wardNo: "7",
      street: "Village Road",
      city: "Kishangarh",
      durationOfStay: "20",
      mobile: "9876543215",
      maritalStatus: "Married",
      education: "Graduate and above",
      occupation: "Doctor",
    },
    step2: {
      clinicalOnly: true,
      longestSymptomDuration: "4",
      laterality: "Left",
    },
    step3: {
      clinicalExtent: "Locally Advanced",
      compositeStage: "IIIA",
      treatmentPrior: "Yes",
      nameOfPersonCompletingForm: "Dr. E. Rajan",
      contactNumber: "9876543215",
      designation: "Professor",
    },
  },
  {
    name: "Ravi Kumar Other",
    desc: "Other ID, Education Other, Case Other",
    step1: {
      department: "Radiotherapy",
      unitNumber: "Unit 05",
      dateOfReporting: "2026-08-29",
      caseRegisteredThrough: "Other",
      caseRegisteredThroughOther: "Workplace Screening Camp",
      typeOfReferral: "Self",
      dateOfFirstDiagnosis: "2026-08-28",
      firstName: "Ravi",
      lastName: "Kumar",
      dateOfBirth: "1992-06-15",
      gender: "Male",
      aadhaar: "445566778899",
      abha: "44556677889900",
      otherId: { enabled: true, name: "Jan Aadhaar", number: "JAN-1234567890" },
      fatherName: "Brijesh Kumar",
      motherName: "Geeta Kumar",
      urbanRural: "Urban",
      houseNo: "101",
      wardNo: "15",
      street: "Industrial Area",
      city: "Jaipur",
      durationOfStay: "8",
      mobile: "9876543216",
      email: "ravi.kumar@test.com",
      maritalStatus: "Other",
      education: "Others (specify)",
      occupation: "Factory Worker",
    },
    step2: {
      clinicalOnly: true,
      longestSymptomDuration: "2",
      laterality: "Right",
    },
    step3: {
      compositeStage: "II",
      treatmentPrior: "No",
      surgeryDone: true,
      nameOfPersonCompletingForm: "Dr. F. Gupta",
      contactNumber: "9876543216",
      designation: "Junior Resident",
    },
  },
];

/* ═══════════════════════════════════════════════════════
   MAIN TEST — One browser, one login, all patients
   ═══════════════════════════════════════════════════════ */

test("Patient Registration: all 6 patients in single session", async ({
  page,
}) => {
  test.setTimeout(600_000); // 10 minutes for all 6 patients

  // ─── LOGIN ONCE ───
  await login(page);

  // ─── REGISTER EACH PATIENT SEQUENTIALLY ───
  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    console.log(
      `\n━━━ Patient ${i + 1}/${patients.length}: ${p.name} ━━━`
    );

    // Navigate to new registration
    await goToNewRegistration(page);

    // Fill Step 1
    await fillStep1(page, p.step1);
    await saveAndContinue(page);

    // Fill Step 2
    if (p.step2) await fillStep2(page, p.step2);
    await saveAndContinue(page);

    // Fill Step 3
    if (p.step3) await fillStep3(page, p.step3);

    // Submit
    await submitRegistration(page);
    console.log(`✓ ${p.name} submitted`);
  }

  // ─── VERIFY ALL PATIENTS IN PATIENT RECORDS ───
  console.log("\n━━━ Verifying Patient Records ━━━");
  await goToPatientRecords(page);

  for (const p of patients) {
    const firstName = p.name.split(" ")[0];
    const row = page.locator("table tbody tr", { hasText: firstName });
    await expect(row.first()).toBeVisible({ timeout: 10000 });
    console.log(`✓ ${p.name} found in Patient Records`);
  }

  // ─── VERIFY VIEW MODE IS READ-ONLY ───
  console.log("\n━━━ Verifying View Mode ━━━");
  await openPatientRecord(page, 0);

  const editBtn = page.getByRole("button", { name: "Edit" });
  await expect(editBtn).toBeVisible();
  console.log("✓ Edit button visible (view mode)");

  // ─── VERIFY EDIT MODE ENABLES FIELDS ───
  await clickEdit(page);
  await expect(page.getByText("Editing patient record")).toBeVisible();
  console.log("✓ Edit mode active");

  const enabledRadios = page.locator("input[type=radio]:not([disabled])");
  const count = await enabledRadios.count();
  expect(count).toBeGreaterThan(0);
  console.log(`✓ ${count} radio buttons enabled in edit mode`);

  console.log("\n═══ ALL TESTS PASSED ═══");
});

/* ═══════════════════════════════════════════════════════
   STEP FILL FUNCTIONS
   ═══════════════════════════════════════════════════════ */

async function fillStep1(page: any, data: Step1Data) {
  // 3(a). Department Name
  if (data.department)
    await fillField(page, "3(a). Department name", data.department);

  // 3(b). Unit Number
  if (data.unitNumber)
    await fillField(page, "3(b). Unit number", data.unitNumber);

  // 5. Date of Reporting
  if (data.dateOfReporting) {
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.fill(data.dateOfReporting);
  }

  // 6. Case Registered Through
  if (data.caseRegisteredThrough) {
    await selectDropdown(
      page,
      "6. Case Registered Through (Patient's first reporting at RI)",
      data.caseRegisteredThrough
    );
  }

  // 6(a). Other
  if (data.caseRegisteredThroughOther) {
    await page.waitForTimeout(300);
    await fillField(
      page,
      "6(a). Case Registered Through (Other)",
      data.caseRegisteredThroughOther
    );
  }

  // 7. Type of Referral
  if (data.typeOfReferral) {
    await selectDropdown(page, "7. Type of referral", data.typeOfReferral);
  }

  // 7(a)-7(f). Referral details
  if (data.typeOfReferral === "Other Hospital/Health Facility") {
    await page.waitForTimeout(300);
    if (data.referralFacility)
      await fillField(page, "7(a). Name of Facility.", data.referralFacility);
    if (data.referralHospital)
      await fillField(page, "7(b). Hospital / LAB / N.H.", data.referralHospital);
    if (data.referralCity)
      await fillField(page, "7(c). City", data.referralCity);
    if (data.referralDistrict)
      await fillField(page, "7(d). District", data.referralDistrict);
    if (data.referralPincode)
      await fillField(page, "7(e). Pincode", data.referralPincode);
  }

  // 8. Date of First Diagnosis
  if (data.dateOfFirstDiagnosis) {
    const dates = page.locator('input[type="date"]');
    const count = await dates.count();
    if (count >= 2) await dates.nth(1).fill(data.dateOfFirstDiagnosis);
  }

  // 9. Patient Name
  await fillField(page, "First Name", data.firstName);
  if (data.middleName)
    await fillField(page, "Middle Name", data.middleName);
  if (data.lastName) await fillField(page, "Last Name", data.lastName);

  // 10. Date of Birth
  const dobInput = page.locator('input[type="date"]').nth(2);
  await dobInput.fill(data.dateOfBirth);

  // 12. Gender
  await selectDropdown(page, "12. Gender", data.gender);

  // 13. Aadhaar & ABHA (direct input)
  await fillFieldByPlaceholder(page, "Enter Aadhaar number (12 digits)", data.aadhaar);
  await fillFieldByPlaceholder(page, "Enter ABHA number (14 digits)", data.abha);

  // PAN Card
  if (data.panCard?.enabled) {
    await selectIdYes(page, "c). PAN Card");
    await page.waitForTimeout(300);
    if (data.panCard.number) {
      const input = page.getByPlaceholder("Enter c). PAN Card number");
      await input.click();
      await input.fill(data.panCard.number);
    }
  }

  // Voter ID
  if (data.voterId?.enabled) {
    await selectIdYes(page, "d). Voter ID");
    await page.waitForTimeout(300);
    if (data.voterId.number) {
      const input = page.getByPlaceholder("Enter d). Voter ID number");
      await input.click();
      await input.fill(data.voterId.number);
    }
  }

  // Passport
  if (data.passport?.enabled) {
    await selectIdYes(page, "e). Passport");
    await page.waitForTimeout(300);
    if (data.passport.number) {
      const input = page.getByPlaceholder("Enter e). Passport number");
      await input.click();
      await input.fill(data.passport.number);
    }
  }

  // AB-PMJAY
  if (data.abpmjay?.enabled) {
    await selectIdYes(page, "f). AB-PMJAY");
    await page.waitForTimeout(300);
    if (data.abpmjay.number) {
      const input = page.getByPlaceholder("Enter f). AB-PMJAY number");
      await input.click();
      await input.fill(data.abpmjay.number);
    }
  }

  // Other ID
  if (data.otherId?.enabled) {
    await selectIdYes(page, "g). Other");
    await page.waitForTimeout(300);
    if (data.otherId.name && data.otherId.number) {
      await fillOtherId(page, data.otherId.name, data.otherId.number);
    }
  }

  // 14. Relative Details
  if (data.fatherName) await fillField(page, "Father name", data.fatherName);
  if (data.fatherMobile)
    await fillField(page, "Father mobile number", data.fatherMobile);
  if (data.motherName) await fillField(page, "Mother name", data.motherName);
  if (data.spouseName) await fillField(page, "Spouse name", data.spouseName);

  // 15. Address — Urban/Rural
  await selectUrbanRural(page, data.urbanRural);
  await page.waitForTimeout(500);

  await fillAddress(page, {
    houseNo: data.houseNo,
    wardNo: data.wardNo,
    street: data.street,
    city: data.city,
    mobile: data.mobile,
    email: data.email,
    durationOfStay: data.durationOfStay,
  });

  // 16. Marital Status
  if (data.maritalStatus)
    await selectDropdown(page, "16. Marital status", data.maritalStatus);

  // 17. Education
  if (data.education)
    await selectDropdown(page, "17. Education", data.education);

  // Occupation
  if (data.occupation)
    await fillField(page, "Occupation", data.occupation);
}

async function fillStep2(page: any, data: Step2Data) {
  // 20. Method of Diagnosis checkboxes
  if (data.clinicalOnly) {
    const label = page.locator("label").filter({ hasText: "Clinical Only" });
    await label.locator("input[type=checkbox]").click({ force: true });
  }
  if (data.microscopic) {
    const label = page.locator("label").filter({ hasText: "Microscopic" });
    await label.locator("input[type=checkbox]").click({ force: true });
    await page.waitForTimeout(300);
  }

  // 21. Longest Duration of Symptom
  if (data.longestSymptomDuration) {
    await fillField(
      page,
      "21. Longest duration of symptom for cancer (in months)",
      data.longestSymptomDuration
    );
  }

  // 21.x Pathological fields
  if (data.microscopic) {
    if (data.pathologicalSite)
      await fillField(page, "21.1 Anatomical Site of Specimen / Biopsy / SMEAR", data.pathologicalSite);
    if (data.pathologySlideNo)
      await fillField(page, "21.2 Pathology Slide No", data.pathologySlideNo);
    if (data.primarySiteTopography)
      await fillField(page, "21.4 Primary Site of Tumour - Topography", data.primarySiteTopography);
    if (data.primaryHistology)
      await fillField(page, "21.5 Primary Histology / Morphology", data.primaryHistology);
    if (data.grade) await selectDropdown(page, "Grade", data.grade);
  }

  // 25. Laterality
  if (data.laterality)
    await selectDropdown(page, "25. Laterality", data.laterality);
}

async function fillStep3(page: any, data: Step3Data) {
  // Clinical Extent
  if (data.clinicalExtent)
    await selectDropdown(page, "Clinical Extent of Disease Before Cancer Directed Treatment", data.clinicalExtent);

  // 28(a). Staging System
  if (data.stagingSystem) {
    await selectDropdown(page, "28(a). Staging system", data.stagingSystem);
    await page.waitForTimeout(300);
  }

  // TNM fields
  if (data.stagingSystem === "TNM") {
    if (data.tnmT) await selectDropdown(page, "T", data.tnmT);
    if (data.tnmN) await selectDropdown(page, "N", data.tnmN);
    if (data.tnmM) await selectDropdown(page, "M", data.tnmM);
  }

  // 28(c). Composite Stage
  if (data.compositeStage)
    await selectDropdown(page, "28(c). Composite stage", data.compositeStage);

  // Treatment checkboxes
  if (data.surgeryDone) {
    const label = page.locator("label").filter({ hasText: "Surgery" });
    await label.locator("input[type=checkbox]").click({ force: true });
  }
  if (data.radiotherapyDone) {
    const label = page.locator("label").filter({ hasText: "Radiotherapy" });
    await label.locator("input[type=checkbox]").click({ force: true });
  }
  if (data.chemotherapyDone) {
    const label = page.locator("label").filter({ hasText: "Chemotherapy" });
    await label.locator("input[type=checkbox]").click({ force: true });
  }

  // 31. Name of Person Completing Form
  await fillField(page, "31. Name of person completing form (IN CAPITALS)", data.nameOfPersonCompletingForm);

  // 33. Contact Number
  if (data.contactNumber)
    await fillField(page, "33. Contact Number", data.contactNumber);

  // 34. Designation
  if (data.designation)
    await fillField(page, "34. Designation", data.designation);
}
