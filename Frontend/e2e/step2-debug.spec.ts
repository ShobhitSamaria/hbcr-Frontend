import { test } from "@playwright/test";
import { login, goToNewRegistration, fillField, fillFieldByPlaceholder, selectDropdown, selectUrbanRural, fillAddress } from "./helpers";

test("Debug Step 2 loading", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  await goToNewRegistration(page);

  await fillField(page, "3(a). Department name", "Oncology");
  await fillField(page, "3(b). Unit number", "Unit 01");
  await page.locator('input[type="date"]').first().fill("2026-08-15");
  await selectDropdown(page, "6. Case Registered Through", "Out Patient");
  await selectDropdown(page, "7. Type of referral", "Self");
  await page.locator('input[type="date"]').nth(1).fill("2026-08-10");
  await fillField(page, "First Name", "Test");
  await fillField(page, "Last Name", "Patient");
  await page.locator('input[type="date"]').nth(2).fill("1990-05-15");
  await selectDropdown(page, "12. Gender", "Male");
  await fillFieldByPlaceholder(page, "Enter Aadhaar number (12 digits)", "123456789012");
  await selectUrbanRural(page, "Urban");
  await page.waitForTimeout(500);
  await fillAddress(page, { houseNo: "12", wardNo: "1", street: "Main", city: "Jaipur", durationOfStay: "5" });
  await selectDropdown(page, "16. Marital status", "Married");
  await selectDropdown(page, "17. Education", "Graduate and above");
  await fillField(page, "Height (cm)", "170");
  await fillField(page, "Weight (kg)", "70");

  // Click Save & continue
  await page.getByRole("button", { name: "Save & continue" }).click();
  await page.waitForTimeout(3000);

  // Check for validation errors
  const errors = page.locator('[class*="error"], [class*="Error"], .text-red, [style*="color: red"], [style*="color:red"]');
  const errorCount = await errors.count();
  console.log("Error elements found:", errorCount);
  for (let i = 0; i < errorCount; i++) {
    const text = await errors.nth(i).textContent().catch(() => "");
    if (text && text.trim()) console.log(`  Error ${i}: "${text.trim().substring(0, 200)}"`);
  }

  // Check for any visible error text
  const bodyText = await page.locator("main").textContent();
  console.log("Contains 'required':", bodyText?.includes("required"));
  console.log("Contains 'Please fix':", bodyText?.includes("Please fix"));
  console.log("Contains 'highlighted':", bodyText?.includes("highlighted"));
  console.log("Contains 'error':", bodyText?.toLowerCase().includes("error"));

  // Look for validation summary
  const allText = await page.locator("body").textContent();
  if (allText?.includes("Please fix")) {
    const idx = allText.indexOf("Please fix");
    console.log("Validation msg:", allText.substring(idx, idx + 300));
  }
});
