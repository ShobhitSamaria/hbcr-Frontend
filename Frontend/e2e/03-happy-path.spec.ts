import { test, expect } from "@playwright/test";
import { login, goToNewRegistration } from "./helpers";

/**
 * TC-160: Happy-path end-to-end registration
 * Fill ALL fields across Step 1, Step 2, Step 3 and submit
 */
test.describe("TC-160: Complete registration happy path", () => {
  test("fill all fields and submit successfully", async ({ page }) => {
    // --- Step 1: Identifying Information ---
    await login(page);
    await goToNewRegistration(page);

    // 3(a) Department Name
    const deptInput = page.locator('input[type="text"]').nth(1);
    await deptInput.fill("Oncology");

    // 3(b) Unit Number
    const unitInput = page.locator('input[type="text"]').nth(2);
    await unitInput.fill("Unit 04");

    // 5. Date of Reporting
    await page.locator('input[type="date"]').first().fill("2026-08-29");

    // 6. Case Registered Through → Out Patient
    const selects = page.locator("select");
    const count1 = await selects.count();
    for (let i = 0; i < count1; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("Out Patient"))) {
        await selects.nth(i).selectOption({ label: "Out Patient" });
        break;
      }
    }

    // 7. Type of Referral
    for (let i = 0; i < count1; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("Screen Detected"))) {
        await selects.nth(i).selectOption({ index: 1 });
        break;
      }
    }

    // 8. Date of First Diagnosis
    const dateInputs = page.locator('input[type="date"]');
    for (let i = 0; i < await dateInputs.count(); i++) {
      const parent = dateInputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("first diagnosis") || label?.includes("First Diagnosis")) {
        await dateInputs.nth(i).fill("2026-08-01");
        break;
      }
    }

    // 9. Sex → Male
    const sexSelect = page.locator("select").filter({ hasText: /select/i });
    for (let i = 0; i < count1; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o === "Male" || o === "Female")) {
        await selects.nth(i).selectOption({ index: 1 });
        break;
      }
    }

    // 10. Date of Birth
    for (let i = 0; i < await dateInputs.count(); i++) {
      const parent = dateInputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("birth") || label?.includes("Birth")) {
        await dateInputs.nth(i).fill("1985-06-15");
        break;
      }
    }

    // 11. Age (auto-calculated or manual)
    // 12. First Name
    const nameInputs = page.locator('input[type="text"]');
    for (let i = 0; i < await nameInputs.count(); i++) {
      const parent = nameInputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("first name") || label?.includes("First Name")) {
        await nameInputs.nth(i).fill("Raj");
        break;
      }
    }

    // 13. Aadhaar Number
    for (let i = 0; i < await nameInputs.count(); i++) {
      const parent = nameInputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("Aadhaar")) {
        await nameInputs.nth(i).fill("123456789012");
        break;
      }
    }

    // 13. ABHA Number
    for (let i = 0; i < await nameInputs.count(); i++) {
      const parent = nameInputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("ABHA")) {
        await nameInputs.nth(i).fill("12345678901234");
        break;
      }
    }

    // 14. Relative → Father
    for (let i = 0; i < count1; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("Father"))) {
        await selects.nth(i).selectOption({ label: "Father" });
        break;
      }
    }

    // 15. Address → Urban + District + Pincode
    const urbanRadio = page.locator("input[type=radio][value=Urban]");
    if (await urbanRadio.count() > 0) {
      await urbanRadio.click({ force: true });
    }

    // 16. Duration of Stay
    for (let i = 0; i < await nameInputs.count(); i++) {
      const parent = nameInputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("duration") || label?.includes("Duration")) {
        await nameInputs.nth(i).fill("5");
        break;
      }
    }

    // 17. Education
    for (let i = 0; i < count1; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("Graduate") || o.includes("Graduation"))) {
        await selects.nth(i).selectOption({ index: 1 });
        break;
      }
    }

    // 18(a). Habits → Tobacco Smoking No
    const habitsNo = page.locator("input[type=radio][name*='Tobacco Smoking'][value=No]");
    if (await habitsNo.count() > 0) {
      await habitsNo.click({ force: true });
    }

    // 18(b). Co-Morbidities → Diabetes No
    const comorNo = page.locator("input[type=radio][name*='Diabetes'][value=No]");
    if (await comorNo.count() > 0) {
      await comorNo.click({ force: true });
    }

    // Click Save & Continue to move to Step 2
    await page.getByRole("button", { name: /save.*continue/i }).first().click();
    await page.waitForTimeout(2000);

    // --- Step 2: Diagnostic Details ---
    // 20. Method of Diagnosis → Clinical Only
    const clinicalOnly = page.locator("label").filter({ hasText: "Clinical Only" }).locator("input[type=checkbox]");
    if (await clinicalOnly.isVisible()) {
      await clinicalOnly.click({ force: true });
    }

    // 25. Laterality
    for (let i = 0; i < count1; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("Right"))) {
        await selects.nth(i).selectOption({ label: "Right" });
        break;
      }
    }

    // Click Save & Continue to move to Step 3
    await page.getByRole("button", { name: /save.*continue/i }).first().click();
    await page.waitForTimeout(2000);

    // --- Step 3: Clinical Stage & Treatment ---
    // 28(a) Staging System → TNM
    for (let i = 0; i < count1; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("TNM"))) {
        await selects.nth(i).selectOption("TNM");
        break;
      }
    }

    // 28(c) Composite Stage
    for (let i = 0; i < count1; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("Stage I"))) {
        await selects.nth(i).selectOption({ index: 1 });
        break;
      }
    }

    // 29. Treatment Given Prior
    for (let i = 0; i < count1; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("No prior treatment") || o.includes("None"))) {
        await selects.nth(i).selectOption({ index: 1 });
        break;
      }
    }

    // 33. Contact Number
    for (let i = 0; i < await nameInputs.count(); i++) {
      const parent = nameInputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("Contact Number") || label?.includes("contact number")) {
        await nameInputs.nth(i).fill("9876543210");
        break;
      }
    }

    // 34. Designation
    for (let i = 0; i < await nameInputs.count(); i++) {
      const parent = nameInputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("Designation") || label?.includes("designation")) {
        await nameInputs.nth(i).fill("Doctor");
        break;
      }
    }

    // Final Submit
    await page.getByRole("button", { name: /submit/i }).first().click();
    await page.waitForTimeout(3000);

    // Verify success (redirect or success message)
    const url = page.url();
    expect(url.includes("/records") || url.includes("/dashboard")).toBe(true);
  });
});
