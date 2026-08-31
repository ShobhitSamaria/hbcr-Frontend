import { test, expect } from "@playwright/test";
import { login, goToNewRegistration, selectDropdown, fillField, fillFieldByPlaceholder, selectUrbanRural, fillAddress, saveAndContinue } from "./helpers";

test("Step 1 → Step 2 transition", async ({ page }) => {
  test.setTimeout(120_000);

  await login(page);
  await goToNewRegistration(page);

  // Fill all required Step 1 fields
  await fillField(page, "3(a). Department name", "Oncology");
  await fillField(page, "3(b). Unit number", "Unit 01");
  await page.locator('input[type="date"]').first().fill("2026-08-15");
  await selectDropdown(page, "6. Case Registered Through", "Out Patient");
  await selectDropdown(page, "7. Type of referral", "Self");
  await page.locator('input[type="date"]').nth(1).fill("2026-08-10");
  await fillField(page, "First Name", "Rahul");
  await fillField(page, "Last Name", "Sharma");
  await page.locator('input[type="date"]').nth(2).fill("1990-05-15");
  await selectDropdown(page, "12. Gender", "Male");
  await fillFieldByPlaceholder(page, "Enter Aadhaar number (12 digits)", "123456789012");
  await fillFieldByPlaceholder(page, "Enter ABHA number (14 digits)", "12345678901234");
  await fillField(page, "Father name", "Suresh Sharma");
  await selectUrbanRural(page, "Urban");
  await page.waitForTimeout(500);
  await fillAddress(page, { houseNo: "12 MG Road", wardNo: "5", street: "MG Road", city: "Jaipur", mobile: "9876543211", durationOfStay: "10" });
  await selectDropdown(page, "16. Marital status", "Married");
  await selectDropdown(page, "17. Education", "Graduate and above");
  await fillField(page, "Height (cm)", "175");
  await fillField(page, "Weight (kg)", "72");

  // Click Save & Continue
  console.log("Clicking Save & Continue...");
  await page.getByRole("button", { name: "Save & continue" }).click();
  await page.waitForTimeout(3000);

  // Check what's on the page now
  const url = page.url();
  console.log("URL:", url);
  
  // Check for errors
  const alerts = await page.locator("[role=alert]").allTextContents();
  console.log("Alerts:", alerts);
  
  // Check h3 headings
  const headings = await page.locator("h3").allInnerTexts();
  console.log("Headings:", headings);
  
  // Check if Step 2 content is visible
  const diagnostic = await page.getByText("Diagnostic details").isVisible().catch(() => false);
  console.log("Diagnostic details visible:", diagnostic);
  
  // Check console errors
  const consoleErrors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  await page.waitForTimeout(1000);
  console.log("Console errors:", consoleErrors);
  
  // Now try to find Clinical Only checkbox
  if (diagnostic) {
    console.log("Looking for Clinical Only checkbox...");
    // Try different selectors
    const checkbox1 = page.locator("label").filter({ hasText: "Clinical Only" });
    console.log("Clinical Only labels:", await checkbox1.count());
    
    const checkbox2 = page.getByText("Clinical Only", { exact: false });
    console.log("Clinical Only texts:", await checkbox2.count());
    
    // Try to click via text
    try {
      await page.getByText("Clinical Only", { exact: true }).click({ timeout: 5000 });
      console.log("✓ Clicked 'Clinical Only' text!");
    } catch (e) {
      console.log("Failed to click Clinical Only text:", (e as Error).message?.substring(0, 100));
    }
  }
  
  console.log("Test complete!");
});
