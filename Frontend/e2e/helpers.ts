import { type Page, type Locator, expect } from "@playwright/test";

/* ═══════════════════════════════════════════════════════
   SESSION HELPERS — Login, Navigation, Browser Lifecycle
   ═══════════════════════════════════════════════════════ */

/** Login once and stay logged in for the entire session */
export async function login(
  page: Page,
  username = "hospital1",
  password = "HBCR@2024"
) {
  await page.goto("/");
  await page.getByPlaceholder("hospital1").fill(username);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/", { timeout: 10000 });
  await expect(page.getByText("Registry overview")).toBeVisible({
    timeout: 15000,
  });
}

/* ═══════════════════════════════════════════════════════
   NAVIGATION — Reuse same session, no re-login
   ═══════════════════════════════════════════════════════ */

export async function goToNewRegistration(page: Page) {
  await page.getByRole("button", { name: "Form" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "New Registration" }).click();
  await page.waitForURL("**/register", { timeout: 10000 });
  // Wait for form to fully render — use heading role to avoid strict mode
  await expect(
    page.getByRole("heading", { name: "Identifying information" })
  ).toBeVisible({ timeout: 10000 });
}

export async function goToPatientRecords(page: Page) {
  await page.getByRole("button", { name: "Form" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Patient Records" }).click();
  await page.waitForURL("**/records", { timeout: 10000 });
  await page.waitForTimeout(1000);
}

export async function goToDashboard(page: Page) {
  await page.getByRole("button", { name: "Dashboard" }).click();
  await page.waitForTimeout(1000);
}

/* ═══════════════════════════════════════════════════════
   FORM FILL HELPERS — Robust field interaction
   ═══════════════════════════════════════════════════════ */

/**
 * Fill a Field component by its label text.
 * The Field component renders: <div><span>LabelText</span><input name={label} /></div>
 * We use the name attribute on the input which is set to the label text.
 */
export async function fillField(
  page: Page,
  labelText: string,
  value: string
) {
  // Try name attribute first (most reliable)
  const byName = page.locator(`input[name="${labelText}"]`);
  if ((await byName.count()) > 0 && (await byName.isVisible().catch(() => false))) {
    await byName.click();
    await byName.fill(value);
    return;
  }
  // Fallback: find by visible text and navigate up to find the input
  const container = page.getByText(labelText, { exact: true }).locator("..").locator("..");
  const input = container.locator("input").first();
  await input.click();
  await input.fill(value);
}

/** Fill a field by its placeholder text */
export async function fillFieldByPlaceholder(
  page: Page,
  placeholder: string,
  value: string
) {
  const input = page.getByPlaceholder(placeholder);
  await input.click();
  await input.fill(value);
}

/**
 * Select an option from a SelectField dropdown by its name attribute.
 * SelectField renders <select name={label}> so we use the label as the name.
 */
export async function selectDropdown(
  page: Page,
  labelText: string,
  option: string
) {
  // Use getByLabel which handles special characters in labels gracefully
  const select = page.getByLabel(labelText, { exact: false });
  await select.selectOption(option);
}

/** Click a radio button by name attribute and index (0=first, 1=second/Yes) */
export async function clickRadio(
  page: Page,
  name: string,
  index: number
) {
  const radio = page.locator(`input[type=radio][name="${name}"]`).nth(index);
  await radio.click({ force: true });
  await page.waitForTimeout(200);
}

/** Click Urban or Rural radio */
export async function selectUrbanRural(page: Page, type: "Urban" | "Rural") {
  const index = type === "Urban" ? 0 : 1;
  await clickRadio(page, "urban-rural", index);
}

/** Click Yes for an ID type (index 1 = Yes) */
export async function selectIdYes(page: Page, idLabel: string) {
  await clickRadio(page, `id-${idLabel}`, 1);
}

/** Fill the Other ID name/type and number fields */
export async function fillOtherId(page: Page, name: string, number: string) {
  const nameInput = page.getByPlaceholder(
    "Enter identification name/type (e.g. Card Name)"
  );
  await nameInput.click();
  await nameInput.fill(name);
  await page.waitForTimeout(100);

  const numInput = page.getByPlaceholder("Enter identification number");
  await numInput.click();
  await numInput.fill(number);
}

/** Fill address fields after Urban/Rural is selected */
export async function fillAddress(
  page: Page,
  data: {
    houseNo?: string;
    wardNo?: string;
    street?: string;
    city?: string;
    mobile?: string;
    email?: string;
    durationOfStay?: string;
  }
) {
  if (data.houseNo) await fillField(page, "Flat / House No.", data.houseNo);
  if (data.wardNo) await fillField(page, "Ward No.", data.wardNo);
  if (data.street) await fillField(page, "Street / Road", data.street);
  if (data.city) await fillField(page, "City", data.city);
  if (data.mobile) await fillField(page, "Mobile number", data.mobile);
  if (data.email) await fillField(page, "Email address", data.email);
  if (data.durationOfStay) {
    await fillField(
      page,
      "Duration of Stay at the above address (in years)",
      data.durationOfStay
    );
  }
}

/* ═══════════════════════════════════════════════════════
   STEP COMPLETION HELPERS
   ═══════════════════════════════════════════════════════ */

/** Click "Save & continue" to advance to next step */
export async function saveAndContinue(page: Page) {
  await page.getByRole("button", { name: "Save & continue" }).click();
  await page.waitForTimeout(2000);
}

/** Submit the final registration on Step 3 */
export async function submitRegistration(page: Page) {
  const submitBtn = page.getByRole("button", { name: /save|submit/i }).first();
  await submitBtn.click();
  await page.waitForTimeout(3000);
}

/* ═══════════════════════════════════════════════════════
   PATIENT RECORD HELPERS
   ═══════════════════════════════════════════════════════ */

export async function openPatientRecord(page: Page, rowIndex = 0) {
  const rows = page.locator("table tbody tr");
  await rows.nth(rowIndex).click();
  await page.waitForTimeout(2000);
}

export async function clickEdit(page: Page) {
  await page.getByRole("button", { name: "Edit" }).click();
  await page.waitForTimeout(500);
}

export async function clickSave(page: Page) {
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(1000);
}
