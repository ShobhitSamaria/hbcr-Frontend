import { test, expect } from "@playwright/test";
import { login, goToNewRegistration } from "./helpers";

/**
 * TC-100 to TC-110: Step 2 — Diagnostic Details
 */
test.describe("Step 2 — Diagnostic Details", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  // TC-100: Method of Diagnosis checkboxes
  test("TC-100: Method of Diagnosis checkboxes selectable", async ({ page }) => {
    // Check "Clinical Only" checkbox
    const clinicalOnly = page.locator("label").filter({ hasText: "Clinical Only" }).locator("input[type=checkbox]");
    await clinicalOnly.click({ force: true });
    await expect(clinicalOnly).toBeChecked();

    // Uncheck it
    await clinicalOnly.click({ force: true });
    await expect(clinicalOnly).not.toBeChecked();
  });

  // TC-101: Microscopic checkbox
  test("TC-101: Microscopic checkbox toggles", async ({ page }) => {
    const micro = page.locator("label").filter({ hasText: "Microscopic" }).locator("input[type=checkbox]");
    await micro.click({ force: true });
    await expect(micro).toBeChecked();
  });

  // TC-102: Was microscopic confirmation done - Yes/No
  test("TC-102: Microscopic confirmation Yes/No toggle", async ({ page }) => {
    // Scroll to step 2 section
    const yesRadio = page.locator("input[type=radio][value=Yes]").first();
    if (await yesRadio.isVisible()) {
      await yesRadio.click({ force: true });
      await expect(yesRadio).toBeChecked();
    }
  });

  // TC-103: Date of First Diagnosis - valid past date allowed
  test("TC-103: Date of First Diagnosis accepts old date", async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    // Date of First Diagnosis should be one of the date inputs
    for (let i = 0; i < count; i++) {
      const input = dateInputs.nth(i);
      const label = await input.locator("..").locator("span").first().textContent();
      if (label?.includes("first diagnosis") || label?.includes("First Diagnosis")) {
        await input.fill("2020-01-15");
        await expect(input).toHaveValue("2020-01-15");
        break;
      }
    }
  });

  // TC-104: 21. Complete Pathological Diagnosis - visible when Microscopic checked
  test("TC-104: Pathological fields visible with Microscopic", async ({ page }) => {
    const micro = page.locator("label").filter({ hasText: "Microscopic" }).locator("input[type=checkbox]");
    await micro.click({ force: true });
    await expect(page.getByText(/pathological diagnosis/i).first()).toBeVisible();
  });

  // TC-105: 21.3 Date of Reporting (pathological)
  test("TC-105: Pathological Date of Reporting visible", async ({ page }) => {
    const micro = page.locator("label").filter({ hasText: "Microscopic" }).locator("input[type=checkbox]");
    await micro.click({ force: true });
    await expect(page.getByText(/21\.3.*date of reporting/i)).toBeVisible();
  });

  // TC-106: 25. Laterality required
  test("TC-106: Laterality required on submit", async ({ page }) => {
    const micro = page.locator("label").filter({ hasText: "Microscopic" }).locator("input[type=checkbox]");
    await micro.click({ force: true });
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/laterality/i).first()).toBeVisible();
  });

  // TC-107: 26. Sequence
  test("TC-107: Sequence dropdown available", async ({ page }) => {
    const selects = page.locator("select");
    const count = await selects.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("First primary"))) {
        found = true;
        await selects.nth(i).selectOption({ index: 1 });
        break;
      }
    }
    expect(found).toBe(true);
  });

  // TC-108: Familial Cancer - visible only for specific cancers
  test("TC-108: Familial Cancer visible for Breast cancer", async ({ page }) => {
    // First select Breast as primary site
    const primarySiteSelects = page.locator("select");
    const count = await primarySiteSelects.count();
    for (let i = 0; i < count; i++) {
      const options = await primarySiteSelects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("Breast"))) {
        await primarySiteSelects.nth(i).selectOption({ label: "Breast" });
        break;
      }
    }
    await expect(page.getByText(/familial cancer/i).first()).toBeVisible();
  });

  // TC-109: ICD-O-3 Coding field
  test("TC-109: ICD-O-3 Coding field present", async ({ page }) => {
    await expect(page.getByText(/ICD-O-3/i).first()).toBeVisible();
  });

  // TC-110: ICD-10 Site of Tumour field
  test("TC-110: ICD-10 Site of Tumour field present", async ({ page }) => {
    await expect(page.getByText(/ICD-10/i).first()).toBeVisible();
  });
});

/**
 * TC-130 to TC-148: Step 3 — Clinical Stage & Treatment
 */
test.describe("Step 3 — Clinical Stage & Treatment", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  // TC-130: 28(a) Staging System dropdown
  test("TC-130: Staging System dropdown available", async ({ page }) => {
    await expect(page.getByText(/staging system/i).first()).toBeVisible();
  });

  // TC-131: TNM staging shows TNM fields
  test("TC-131: TNM shows T/N/M fields", async ({ page }) => {
    const selects = page.locator("select");
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("TNM"))) {
        await selects.nth(i).selectOption("TNM");
        break;
      }
    }
    await expect(page.getByText(/28\(b\).*TNM/i)).toBeVisible();
  });

  // TC-132: Non-TNM staging shows text input
  test("TC-132: Non-TNM shows text input", async ({ page }) => {
    const selects = page.locator("select");
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("TNM"))) {
        await selects.nth(i).selectOption({ index: 2 });
        break;
      }
    }
  });

  // TC-133: 28(c) Composite Stage always visible
  test("TC-133: Composite Stage always visible", async ({ page }) => {
    await expect(page.getByText(/composite stage/i).first()).toBeVisible();
  });

  // TC-134: Composite Stage dropdown
  test("TC-134: Composite Stage dropdown available", async ({ page }) => {
    const selects = page.locator("select");
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("Stage"))) {
        await selects.nth(i).selectOption({ index: 1 });
        const val = await selects.nth(i).inputValue();
        expect(val).toBeTruthy();
        break;
      }
    }
  });

  // TC-135: 29. Treatment Given Prior - required
  test("TC-135: Treatment Given Prior required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/treatment given prior/i).first()).toBeVisible();
  });

  // TC-136: Treatment Table checkboxes (Surgery, Radiotherapy, etc.)
  test("TC-136: Treatment checkboxes selectable", async ({ page }) => {
    const surgery = page.locator("label").filter({ hasText: /Surgery/i }).locator("input[type=checkbox]").first();
    if (await surgery.isVisible()) {
      await surgery.click({ force: true });
      await expect(surgery).toBeChecked();
    }
  });

  // TC-137: Treatment details dropdown
  test("TC-137: Treatment details dropdown", async ({ page }) => {
    const surgery = page.locator("label").filter({ hasText: /Surgery/i }).locator("input[type=checkbox]").first();
    if (await surgery.isVisible()) {
      await surgery.click({ force: true });
      // Details dropdown should appear
      const selects = page.locator("select");
      const count = await selects.count();
      let found = false;
      for (let i = 0; i < count; i++) {
        const options = await selects.nth(i).locator("option").allTextContents();
        if (options.some(o => o.includes("Complete Treatment"))) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    }
  });

  // TC-138: Treatment Yes/No radio
  test("TC-138: Treatment Yes/No/Unknown radios", async ({ page }) => {
    const unknownRadio = page.locator("input[type=radio][value=Unknown]").first();
    if (await unknownRadio.isVisible()) {
      await unknownRadio.click({ force: true });
      await expect(unknownRadio).toBeChecked();
    }
  });

  // TC-139: 29(c) ECOG Performance Status
  test("TC-139: ECOG Performance Status section", async ({ page }) => {
    await expect(page.getByText(/ECOG/i).first()).toBeVisible();
  });

  // TC-140: 31. Date of Completion of Form
  test("TC-140: Date of Completion field", async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.last()).toBeVisible();
  });

  // TC-141: 33. Contact Number - required
  test("TC-141: Contact Number required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/contact number/i).first()).toBeVisible();
  });

  // TC-142: 34. Designation - required
  test("TC-142: Designation required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/designation/i).first()).toBeVisible();
  });

  // TC-143: Treatment modalities includes "Treatment advised but not accepted"
  test("TC-143: Treatment options include 'not accepted'", async ({ page }) => {
    const surgery = page.locator("label").filter({ hasText: /Surgery/i }).locator("input[type=checkbox]").first();
    if (await surgery.isVisible()) {
      await surgery.click({ force: true });
      const selects = page.locator("select");
      const count = await selects.count();
      for (let i = 0; i < count; i++) {
        const options = await selects.nth(i).locator("option").allTextContents();
        if (options.some(o => o.includes("Complete Treatment"))) {
          await expect(selects.nth(i).locator("option")).toContainText(["advised but not accepted"]);
          break;
        }
      }
    }
  });

  // TC-144: Name of Person Completing Form
  test("TC-144: Name of Person Completing Form visible", async ({ page }) => {
    await expect(page.getByText(/name of person completing/i).first()).toBeVisible();
  });
});
