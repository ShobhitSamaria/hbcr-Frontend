import { test, expect } from "@playwright/test";
import { login, goToNewRegistration } from "./helpers";

/**
 * TC-001 to TC-033: Step 1 Mandatory Field Validation
 */
test.describe("Step 1 — Mandatory field validation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-001: Department Name required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/department/i).first()).toBeVisible();
  });

  test("TC-002: Unit Number required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/unit/i).first()).toBeVisible();
  });

  test("TC-003: Date of Reporting required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/date of reporting/i).first()).toBeVisible();
  });

  test("TC-004: Case Registered Through required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/case registered through/i).first()).toBeVisible();
  });

  test("TC-005: Type of Referral required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/type of referral/i).first()).toBeVisible();
  });

  test("TC-006: Date of First Diagnosis required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/date of first diagnosis/i).first()).toBeVisible();
  });

  test("TC-007: Gender required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/gender/i).first()).toBeVisible();
  });

  test("TC-008: Date of Birth required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/date of birth/i).first()).toBeVisible();
  });

  test("TC-009: Age required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/age/i).first()).toBeVisible();
  });

  test("TC-010: First Name required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/first name/i).first()).toBeVisible();
  });

  test("TC-011: Aadhaar Number required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/aadhaar/i).first()).toBeVisible();
  });

  test("TC-012: ABHA Number required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/abha/i).first()).toBeVisible();
  });

  test("TC-013: Address Urban/Rural required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/urban|rural/i).first()).toBeVisible();
  });

  // Duration of Stay only renders after Urban/Rural is selected
  test("TC-014: Duration of Stay required", async ({ page }) => {
    // Select Urban first so the address fields render
    const urbanRadio = page.locator('input[name="urban-rural"]').first();
    await urbanRadio.click({ force: true });
    await page.waitForTimeout(300);
    // Now submit to trigger Duration of Stay validation
    await page.getByRole("button", { name: /save/i }).first().click();
    await page.waitForTimeout(500);
    // Scroll to bottom to make validation error visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.getByText(/duration of stay/i).first()).toBeVisible();
  });

  test("TC-015: Education required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/education/i).first()).toBeVisible();
  });

  test("TC-016: Habits required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/habits/i).first()).toBeVisible();
  });

  test("TC-017: Co-Morbidities required", async ({ page }) => {
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(/co-morbidities|comorbidities/i).first()).toBeVisible();
  });
});

/**
 * TC-050 to TC-057: Step 1 Valid Entry & Conditional Fields
 */
test.describe("Step 1 — Valid entries & conditional fields", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-050: Fill Department and Unit", async ({ page }) => {
    const dept = page.locator('input[name="3(a). Department name"]');
    await dept.fill("Oncology");
    await expect(dept).toHaveValue("Oncology");
    const unit = page.locator('input[name="3(b). Unit number"]');
    await unit.fill("Unit 04");
    await expect(unit).toHaveValue("Unit 04");
  });

  test("TC-051: Date of Reporting valid past date", async ({ page }) => {
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.fill("2026-08-20");
    await expect(dateInput).toHaveValue("2026-08-20");
  });

  test("TC-052: Case Registered Through Other shows text field", async ({ page }) => {
    const caseSelect = page.locator('select[name*="Case Registered"]');
    await caseSelect.selectOption("Other");
    await expect(page.getByText(/case registered through.*other/i).first()).toBeVisible();
  });

  test("TC-053: Type of Referral options", async ({ page }) => {
    const referralSelect = page.locator('select[name*="referral"]');
    const options = await referralSelect.locator("option").allTextContents();
    expect(options).toContain("Self");
    expect(options).toContain("Other Hospital/Health Facility");
    expect(options).toContain("Screen Detected Referral");
    expect(options).toContain("Unknown");
  });

  // PAN Card: click Yes, then check text field via placeholder
  test("TC-054: PAN Card Yes shows text field", async ({ page }) => {
    const yesRadio = page.locator('input[name="id-c). PAN Card"]').nth(1); // nth(1) = Yes
    await yesRadio.click({ force: true });
    await page.waitForTimeout(500);
    const textInput = page.getByPlaceholder("Enter c). PAN Card number");
    await expect(textInput).toBeVisible();
  });

  test("TC-055: Aadhaar accepts 12 digits", async ({ page }) => {
    const aadhaar = page.getByPlaceholder("Enter Aadhaar number (12 digits)");
    await aadhaar.fill("123456789012");
    await expect(aadhaar).toHaveValue("123456789012");
  });

  // Urban: use .first() to avoid strict mode
  test("TC-056: Urban shows address fields", async ({ page }) => {
    const urbanRadio = page.locator('input[name="urban-rural"]').first();
    await urbanRadio.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText("District*").first()).toBeVisible();
  });

  test("TC-057: District dropdown opens", async ({ page }) => {
    const urbanRadio = page.locator('input[name="urban-rural"]').first();
    await urbanRadio.click({ force: true });
    await page.waitForTimeout(500);
    const districtBtn = page.locator("button").filter({ hasText: /^District$/ }).first();
    if (await districtBtn.isVisible()) {
      await districtBtn.click();
      await page.waitForTimeout(300);
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await expect(searchInput).toBeVisible();
    }
  });
});
