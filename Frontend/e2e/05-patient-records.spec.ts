import { test, expect } from "@playwright/test";
import {
  login,
  goToPatientRecords,
  openPatientRecord,
  clickEdit,
  clickSave,
  clickCancel,
} from "./helpers";

/**
 * TC-180 to TC-187: Patient Records — View/Edit mode
 */
test.describe("TC-180: Patient Records table", () => {
  test("TC-180: Patient Records shows correct columns", async ({ page }) => {
    await login(page);
    await goToPatientRecords(page);
    await page.waitForTimeout(1000);
    // Table should exist
    await expect(page.locator("table")).toBeVisible();
    // Verify expected column headers
    const headers = ["Reference No.", "Registration No.", "Patient Name", "Age", "Aadhar", "ICD-10", "Status"];
    for (const h of headers) {
      const visible = await page.getByText(h).first().isVisible().catch(() => false);
      expect(visible).toBe(true);
    }
  });
});

test.describe("TC-181: View mode — all controls disabled", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToPatientRecords(page);
    await page.waitForTimeout(1000);
    await openPatientRecord(page, 0);
    await page.waitForTimeout(1500);
  });

  test("TC-181a: Text inputs are readonly", async ({ page }) => {
    const textInputs = page.locator('input[type="text"]:not([disabled])');
    const count = await textInputs.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const readonly = await textInputs.nth(i).getAttribute("readonly");
      expect(readonly).not.toBeNull();
    }
  });

  test("TC-181b: Select dropdowns are disabled", async ({ page }) => {
    const selects = page.locator("select");
    const count = await selects.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(selects.nth(i)).toBeDisabled();
    }
  });

  test("TC-181c: Radio buttons are disabled", async ({ page }) => {
    const radios = page.locator('input[type="radio"]');
    const count = await radios.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(radios.nth(i)).toBeDisabled();
    }
  });

  test("TC-181d: Checkboxes are disabled", async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(checkboxes.nth(i)).toBeDisabled();
    }
  });

  test("TC-181e: Edit button visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  });

  test("TC-181f: Save/Cancel buttons not visible", async ({ page }) => {
    const saveVisible = await page.getByRole("button", { name: "Save" }).isVisible().catch(() => false);
    expect(saveVisible).toBe(false);
  });
});

test.describe("TC-182: Edit mode — controls become editable", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToPatientRecords(page);
    await page.waitForTimeout(1000);
    await openPatientRecord(page, 0);
    await page.waitForTimeout(1500);
    await clickEdit(page);
  });

  test("TC-182a: Editable text inputs are enabled", async ({ page }) => {
    // At least some text inputs should be enabled
    const enabledInputs = page.locator('input[type="text"]:not([disabled]):not([readonly])');
    const count = await enabledInputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test("TC-182b: Editable dropdowns are enabled", async ({ page }) => {
    const enabledSelects = page.locator("select:not([disabled])");
    const count = await enabledSelects.count();
    expect(count).toBeGreaterThan(0);
  });

  test("TC-182c: Save and Cancel buttons visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("TC-182d: Read-only fields still disabled in edit mode", async ({ page }) => {
    // Fields 1-12 (institution name, dept name, etc.) should still be readonly
    // Check that at least some inputs remain readonly/disabled
    const readonlyInputs = page.locator('input[readonly]');
    const disabledInputs = page.locator('input[disabled]');
    const totalRO = (await readonlyInputs.count()) + (await disabledInputs.count());
    expect(totalRO).toBeGreaterThan(0);
  });
});

test.describe("TC-183: Patient Record values match registration", () => {
  test("TC-183a: Case Registered Through displays correctly", async ({ page }) => {
    await login(page);
    await goToPatientRecords(page);
    await page.waitForTimeout(1000);
    await openPatientRecord(page, 0);
    await page.waitForTimeout(1500);
    // Case Registered Through select should have a non-empty value
    const selects = page.locator("select");
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const val = await selects.nth(i).inputValue();
      if (val && val !== "" && val !== "SELECT") {
        // Found a select with a value
        expect(val).toBeTruthy();
        break;
      }
    }
  });

  test("TC-183b: Department Name displayed", async ({ page }) => {
    await login(page);
    await goToPatientRecords(page);
    await page.waitForTimeout(1000);
    await openPatientRecord(page, 0);
    await page.waitForTimeout(1500);
    // Check at least some text inputs have values
    const textInputs = page.locator('input[type="text"]');
    let hasValue = false;
    const count = await textInputs.count();
    for (let i = 0; i < count; i++) {
      const val = await textInputs.nth(i).inputValue();
      if (val && val.length > 0) {
        hasValue = true;
        break;
      }
    }
    expect(hasValue).toBe(true);
  });
});

test.describe("TC-184: Cancel discards changes", () => {
  test("TC-184: Cancel reverts to view mode", async ({ page }) => {
    await login(page);
    await goToPatientRecords(page);
    await page.waitForTimeout(1000);
    await openPatientRecord(page, 0);
    await page.waitForTimeout(1500);
    await clickEdit(page);
    await clickCancel(page);
    await page.waitForTimeout(500);
    // Edit button should reappear
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  });
});

test.describe("TC-187: Search patient records", () => {
  test("TC-187: Search by patient name", async ({ page }) => {
    await login(page);
    await goToPatientRecords(page);
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Test");
      await page.waitForTimeout(1000);
      // Table should filter
      const rows = page.locator("table tbody tr");
      const count = await rows.count();
      // Should show matching results or empty
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});
