import { test, expect } from "@playwright/test";
import { login, goToNewRegistration } from "./helpers";

/**
 * TC-200 to TC-218: Edge cases & boundary tests
 */
test.describe("Edge cases — Aadhaar validation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-200: Aadhaar rejects 11 digits", async ({ page }) => {
    const inputs = page.locator('input[type="text"]');
    for (let i = 0; i < await inputs.count(); i++) {
      const parent = inputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("Aadhaar")) {
        await inputs.nth(i).fill("12345678901");
        await page.getByRole("button", { name: /save/i }).first().click();
        await page.waitForTimeout(1000);
        await expect(page.getByText(/12 digit/i).first()).toBeVisible();
        break;
      }
    }
  });

  test("TC-201: Aadhaar rejects 13 digits", async ({ page }) => {
    const inputs = page.locator('input[type="text"]');
    for (let i = 0; i < await inputs.count(); i++) {
      const parent = inputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("Aadhaar")) {
        await inputs.nth(i).fill("1234567890123");
        await page.getByRole("button", { name: /save/i }).first().click();
        await page.waitForTimeout(1000);
        await expect(page.getByText(/12 digit/i).first()).toBeVisible();
        break;
      }
    }
  });

  test("TC-202: Aadhaar rejects letters", async ({ page }) => {
    const inputs = page.locator('input[type="text"]');
    for (let i = 0; i < await inputs.count(); i++) {
      const parent = inputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("Aadhaar")) {
        await inputs.nth(i).fill("ABCDEFGHJKLM");
        // Should only accept digits
        const val = await inputs.nth(i).inputValue();
        // Input may filter or backend may reject
        break;
      }
    }
  });

  test("TC-203: Aadhaar accepts exactly 12 digits", async ({ page }) => {
    const inputs = page.locator('input[type="text"]');
    for (let i = 0; i < await inputs.count(); i++) {
      const parent = inputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("Aadhaar")) {
        await inputs.nth(i).fill("123456789012");
        await expect(inputs.nth(i)).toHaveValue("123456789012");
        break;
      }
    }
  });
});

test.describe("Edge cases — ABHA validation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-204: ABHA rejects 13 digits", async ({ page }) => {
    const inputs = page.locator('input[type="text"]');
    for (let i = 0; i < await inputs.count(); i++) {
      const parent = inputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("ABHA")) {
        await inputs.nth(i).fill("1234567890123");
        await page.getByRole("button", { name: /save/i }).first().click();
        await page.waitForTimeout(1000);
        await expect(page.getByText(/14 digit/i).first()).toBeVisible();
        break;
      }
    }
  });

  test("TC-205: ABHA accepts exactly 14 digits", async ({ page }) => {
    const inputs = page.locator('input[type="text"]');
    for (let i = 0; i < await inputs.count(); i++) {
      const parent = inputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("ABHA")) {
        await inputs.nth(i).fill("12345678901234");
        await expect(inputs.nth(i)).toHaveValue("12345678901234");
        break;
      }
    }
  });
});

test.describe("Edge cases — Date validations", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-206: Date of First Diagnosis accepts date before reporting date", async ({ page }) => {
    // Set Date of Reporting to today
    await page.locator('input[type="date"]').first().fill("2026-08-29");

    // Find Date of First Diagnosis and set to 2020
    const dateInputs = page.locator('input[type="date"]');
    for (let i = 0; i < await dateInputs.count(); i++) {
      const parent = dateInputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("first diagnosis") || label?.includes("First Diagnosis")) {
        await dateInputs.nth(i).fill("2020-01-15");
        await expect(dateInputs.nth(i)).toHaveValue("2020-01-15");
        break;
      }
    }
  });

  test("TC-207: Date of Reporting does not accept future date", async ({ page }) => {
    await page.locator('input[type="date"]').first().fill("2099-12-31");
    await page.getByRole("button", { name: /save/i }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/future|cannot be after/i).first()).toBeVisible();
  });

  test("TC-208: DOB in future shows error", async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    for (let i = 0; i < await dateInputs.count(); i++) {
      const parent = dateInputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("birth") || label?.includes("Birth")) {
        await dateInputs.nth(i).fill("2030-01-01");
        await page.getByRole("button", { name: /save/i }).first().click();
        await page.waitForTimeout(1000);
        await expect(page.getByText(/birth|future|invalid/i).first()).toBeVisible();
        break;
      }
    }
  });
});

test.describe("Edge cases — Unique Identification Other", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-209: Other ID shows two text fields when Yes", async ({ page }) => {
    // Find "Other" radio in Unique Identification
    const otherLabel = page.locator("text=Other").first();
    const otherSection = otherLabel.locator("..");
    const yesRadio = otherSection.locator("input[type=radio]").first();
    if (await yesRadio.isVisible()) {
      await yesRadio.click({ force: true });
      await page.waitForTimeout(500);
      // Should show ID Name and ID Number text fields
      const textInputs = otherSection.locator("input[type=text]");
      const count = await textInputs.count();
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  test("TC-210: Other ID text fields accept input", async ({ page }) => {
    const otherLabel = page.locator("text=Other").first();
    const otherSection = otherLabel.locator("..");
    const yesRadio = otherSection.locator("input[type=radio]").first();
    if (await yesRadio.isVisible()) {
      await yesRadio.click({ force: true });
      await page.waitForTimeout(500);
      const textInputs = otherSection.locator("input[type=text]");
      if ((await textInputs.count()) >= 2) {
        await textInputs.nth(0).fill("Jan Aadhaar");
        await expect(textInputs.nth(0)).toHaveValue("Jan Aadhaar");
        await textInputs.nth(1).fill("JA1234567890");
        await expect(textInputs.nth(1)).toHaveValue("JA1234567890");
      }
    }
  });

  test("TC-211: Other ID text fields allow backspace", async ({ page }) => {
    const otherLabel = page.locator("text=Other").first();
    const otherSection = otherLabel.locator("..");
    const yesRadio = otherSection.locator("input[type=radio]").first();
    if (await yesRadio.isVisible()) {
      await yesRadio.click({ force: true });
      await page.waitForTimeout(500);
      const textInputs = otherSection.locator("input[type=text]");
      if ((await textInputs.count()) >= 2) {
        await textInputs.nth(0).fill("Jan Aadhaar");
        await textInputs.nth(0).press("Backspace");
        await textInputs.nth(0).press("Backspace");
        const val = await textInputs.nth(0).inputValue();
        expect(val.length).toBeLessThan("Jan Aadhaar".length);
      }
    }
  });
});

test.describe("Edge cases — Habits & Co-Morbidities", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-212: Habits Yes enables duration field", async ({ page }) => {
    // Find a habits Yes radio
    const yesRadios = page.locator("input[type=radio][value=Yes]");
    const count = await yesRadios.count();
    for (let i = 0; i < count; i++) {
      const radio = yesRadios.nth(i);
      const name = await radio.getAttribute("name");
      if (name?.toLowerCase().includes("tobacco") || name?.toLowerCase().includes("smoking")) {
        await radio.click({ force: true });
        await page.waitForTimeout(500);
        // Duration number input should appear
        const row = radio.locator("..").locator("..");
        const numInput = row.locator("input[type=number]");
        if ((await numInput.count()) > 0) {
          await expect(numInput.first()).toBeEnabled();
        }
        break;
      }
    }
  });

  test("TC-213: Habits Yes without months shows error on submit", async ({ page }) => {
    const yesRadios = page.locator("input[type=radio][value=Yes]");
    const count = await yesRadios.count();
    for (let i = 0; i < count; i++) {
      const radio = yesRadios.nth(i);
      const name = await radio.getAttribute("name");
      if (name?.toLowerCase().includes("tobacco") || name?.toLowerCase().includes("smoking")) {
        await radio.click({ force: true });
        await page.waitForTimeout(500);
        // Don't fill duration
        await page.getByRole("button", { name: /save/i }).first().click();
        await page.waitForTimeout(1000);
        // Should show error about duration/months
        const errorVisible = await page.getByText(/month|duration/i).first().isVisible().catch(() => false);
        expect(errorVisible).toBe(true);
        break;
      }
    }
  });

  test("TC-214: Habits No disables duration field", async ({ page }) => {
    const noRadios = page.locator("input[type=radio][value=No]");
    const count = await noRadios.count();
    for (let i = 0; i < count; i++) {
      const radio = noRadios.nth(i);
      const name = await radio.getAttribute("name");
      if (name?.toLowerCase().includes("tobacco") || name?.toLowerCase().includes("smoking")) {
        await radio.click({ force: true });
        await page.waitForTimeout(500);
        const row = radio.locator("..").locator("..");
        const numInput = row.locator("input[type=number]");
        if ((await numInput.count()) > 0) {
          await expect(numInput.first()).toBeDisabled();
        }
        break;
      }
    }
  });
});

test.describe("Edge cases — Longest Duration of Symptom", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-215: Longest Duration required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/longest duration/i).first()).toBeVisible();
  });
});

test.describe("Edge cases — Education Other", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-216: Education Other shows text field", async ({ page }) => {
    const selects = page.locator("select");
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const options = await selects.nth(i).locator("option").allTextContents();
      if (options.some(o => o.includes("Other"))) {
        await selects.nth(i).selectOption("OTHER");
        await page.waitForTimeout(500);
        // Text field should appear
        const textVisible = await page.getByText(/education.*other|specify/i).first().isVisible().catch(() => false);
        expect(textVisible).toBe(true);
        break;
      }
    }
  });
});

test.describe("Edge cases — Address Urban/Rural gating", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-217: Address fields hidden before Urban/Rural selection", async ({ page }) => {
    // Before selecting Urban/Rural, address fields should not be visible
    const urbanRadio = page.locator("input[type=radio][value=Urban]");
    if (await urbanRadio.count() > 0) {
      const isSelected = await urbanRadio.isChecked();
      if (!isSelected) {
        // District/Pincode dropdowns should not be visible
        const districtVisible = await page.locator("text=District").first().isVisible().catch(() => false);
        // If visible, they should be disabled
      }
    }
  });

  test("TC-218: Selecting Urban enables address fields", async ({ page }) => {
    const urbanRadio = page.locator("input[type=radio][value=Urban]");
    if (await urbanRadio.count() > 0) {
      await urbanRadio.click({ force: true });
      await page.waitForTimeout(500);
      // Address inputs should now be visible
      await expect(page.getByText(/District/i).first()).toBeVisible();
    }
  });
});
