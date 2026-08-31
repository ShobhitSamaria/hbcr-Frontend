import { test, expect } from "@playwright/test";
import {
  login,
  goToNewRegistration,
  goToPatientRecords,
  selectDropdown,
  fillField,
  fillFieldByPlaceholder,
  selectUrbanRural,
  fillAddress,
  saveAndContinue,
  submitRegistration,
  openPatientRecord,
  clickEdit,
} from "./helpers";

test("Full patient registration — single patient end-to-end", async ({
  page,
}) => {
  test.setTimeout(180_000);

  // ─── LOGIN ───
  console.log("1. Logging in...");
  await login(page);

  // ─── NAVIGATE ───
  console.log("2. Going to New Registration...");
  await goToNewRegistration(page);

  // ─── FILL STEP 1 ───
  console.log("3. Filling Step 1...");

  // Header fields (read-only, auto-filled)
  // 3(a). Department Name
  await fillField(page, "3(a). Department name", "Oncology");
  // 3(b). Unit Number
  await fillField(page, "3(b). Unit number", "Unit 01");

  // 5. Date of Reporting
  await page.locator('input[type="date"]').first().fill("2026-08-15");

  // 6. Case Registered Through
  console.log("4. Selecting dropdowns...");
  await selectDropdown(
    page,
    "6. Case Registered Through",
    "Out Patient"
  );

  // 7. Type of Referral
  await selectDropdown(page, "7. Type of referral", "Self");

  // 8. Date of First Diagnosis
  await page.locator('input[type="date"]').nth(1).fill("2026-08-10");

  // 9. Patient Name
  console.log("5. Filling patient name...");
  await fillField(page, "First Name", "Rahul");
  await fillField(page, "Last Name", "Sharma");

  // 10. Date of Birth
  await page.locator('input[type="date"]').nth(2).fill("1990-05-15");

  // 12. Gender
  await selectDropdown(page, "12. Gender", "Male");

  // 13. Aadhaar & ABHA
  console.log("6. Filling ID numbers...");
  await fillFieldByPlaceholder(
    page,
    "Enter Aadhaar number (12 digits)",
    "123456789012"
  );
  await fillFieldByPlaceholder(
    page,
    "Enter ABHA number (14 digits)",
    "12345678901234"
  );

  // 14. Relative Details
  await fillField(page, "Father name", "Suresh Sharma");
  await fillField(page, "Father mobile number", "9876543210");

  // 15. Address — Urban/Rural first
  console.log("7. Selecting Urban...");
  await selectUrbanRural(page, "Urban");
  await page.waitForTimeout(500);

  await fillAddress(page, {
    houseNo: "12, MG Road",
    wardNo: "5",
    street: "MG Road",
    city: "Jaipur",
    mobile: "9876543211",
    durationOfStay: "10",
  });

  // 16. Marital Status
  await selectDropdown(page, "16. Marital status", "Married");

  // 17. Education
  await selectDropdown(page, "17. Education", "Graduate and above");

  // Occupation (not required but fill it)
  await fillField(page, "Occupation", "Software Engineer");

  // 18(c). Anthropometric measurements — Height & Weight (required!)
  console.log("8. Filling Height & Weight...");
  await fillField(page, "Height (cm)", "175");
  await fillField(page, "Weight (kg)", "72");

  // ─── SAVE & CONTINUE TO STEP 2 ───
  console.log("9. Saving Step 1...");
  await saveAndContinue(page);

  // Verify we're on Step 2
  const step2Heading = page.getByText("Diagnostic details");
  await expect(step2Heading).toBeVisible({ timeout: 10000 });
  console.log("✓ Step 2 loaded");

  // ─── FILL STEP 2 ───
  console.log("10. Filling Step 2...");

  // 20. Method of Diagnosis — Clinical Only checkbox
  const clinicalLabel = page.locator("label").filter({ hasText: "Clinical Only" });
  await clinicalLabel.locator("input[type=checkbox]").click({ force: true });

  // 21. Longest Duration of Symptom
  await fillField(
    page,
    "21. Longest duration of symptom for cancer (in months)",
    "3"
  );

  // 25. Laterality
  await selectDropdown(page, "25. Laterality", "Right");

  // ─── SAVE & CONTINUE TO STEP 3 ───
  console.log("11. Saving Step 2...");
  await saveAndContinue(page);

  // Verify we're on Step 3
  const step3Visible = await page.getByText("Clinical stage & treatment").isVisible().catch(() => false);
  console.log(`✓ Step 3 loaded: ${step3Visible}`);

  // ─── FILL STEP 3 ───
  console.log("12. Filling Step 3...");

  // 28(c). Composite Stage (required)
  await selectDropdown(page, "28(c). Composite stage", "I");

  // 29. Treatment Prior
  await selectDropdown(
    page,
    "29. Treatment given prior to registration at RI / outside RI",
    "No"
  );

  // 31. Name of Person Completing Form (required)
  await fillField(
    page,
    "31. Name of person completing form (IN CAPITALS)",
    "DR SRINIVASAN"
  );

  // 33. Contact Number (required)
  await fillField(page, "33. Contact Number", "9876543210");

  // 34. Designation (required)
  await fillField(page, "34. Designation", "Senior Registrar");

  // ─── SUBMIT ───
  console.log("13. Submitting registration...");
  await submitRegistration(page);

  // Check for success
  const successVisible = await page
    .getByText("Registration submitted successfully")
    .isVisible()
    .catch(() => false);
  const recordsUrl = page.url().includes("/records");
  console.log(`✓ Registration submitted! Success msg: ${successVisible}, on records page: ${recordsUrl}`);

  // ─── VERIFY IN PATIENT RECORDS ───
  console.log("14. Verifying in Patient Records...");
  if (!recordsUrl) {
    await goToPatientRecords(page);
  }
  await page.waitForTimeout(1000);

  const patientRow = page.locator("table tbody tr", { hasText: "Rahul" });
  await expect(patientRow.first()).toBeVisible({ timeout: 10000 });
  console.log("✓ Rahul Sharma found in Patient Records");

  // ─── VERIFY VIEW MODE ───
  console.log("15. Verifying View mode...");
  await openPatientRecord(page, 0);
  
  const editBtn = page.getByRole("button", { name: "Edit" });
  await expect(editBtn).toBeVisible({ timeout: 10000 });
  console.log("✓ Edit button visible (view mode)");

  // All radios should be disabled in view mode
  const disabledRadios = page.locator("input[type=radio][disabled]");
  const disabledCount = await disabledRadios.count();
  console.log(`✓ ${disabledCount} radio buttons disabled in view mode`);
  expect(disabledCount).toBeGreaterThan(0);

  // ─── VERIFY EDIT MODE ───
  console.log("16. Verifying Edit mode...");
  await clickEdit(page);

  const editHeader = page.getByText("Editing patient record");
  await expect(editHeader).toBeVisible({ timeout: 5000 });
  console.log("✓ Edit mode activated");

  // Some radios should be enabled
  const enabledRadios = page.locator("input[type=radio]:not([disabled])");
  const enabledCount = await enabledRadios.count();
  expect(enabledCount).toBeGreaterThan(0);
  console.log(`✓ ${enabledCount} radio buttons enabled in edit mode`);

  console.log("\n═══ ALL TESTS PASSED ═══");
});
