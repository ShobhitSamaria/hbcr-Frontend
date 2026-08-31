# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: step2-debug.spec.ts >> Debug Step 2 loading
- Location: e2e/step2-debug.spec.ts:4:1

# Error details

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

# Test source

```ts
  1  | import { test } from "@playwright/test";
  2  | import { login, goToNewRegistration, fillField, fillFieldByPlaceholder, selectDropdown, selectUrbanRural, fillAddress } from "./helpers";
  3  | 
  4  | test("Debug Step 2 loading", async ({ page }) => {
  5  |   test.setTimeout(120_000);
  6  |   await login(page);
  7  |   await goToNewRegistration(page);
  8  | 
  9  |   await fillField(page, "3(a). Department name", "Oncology");
  10 |   await fillField(page, "3(b). Unit number", "Unit 01");
  11 |   await page.locator('input[type="date"]').first().fill("2026-08-15");
  12 |   await selectDropdown(page, "6. Case Registered Through", "Out Patient");
  13 |   await selectDropdown(page, "7. Type of referral", "Self");
  14 |   await page.locator('input[type="date"]').nth(1).fill("2026-08-10");
  15 |   await fillField(page, "First Name", "Test");
  16 |   await fillField(page, "Last Name", "Patient");
  17 |   await page.locator('input[type="date"]').nth(2).fill("1990-05-15");
  18 |   await selectDropdown(page, "12. Gender", "Male");
  19 |   await fillFieldByPlaceholder(page, "Enter Aadhaar number (12 digits)", "123456789012");
  20 |   await selectUrbanRural(page, "Urban");
  21 |   await page.waitForTimeout(500);
  22 |   await fillAddress(page, { houseNo: "12", wardNo: "1", street: "Main", city: "Jaipur", durationOfStay: "5" });
  23 |   await selectDropdown(page, "16. Marital status", "Married");
  24 |   await selectDropdown(page, "17. Education", "Graduate and above");
  25 |   await fillField(page, "Height (cm)", "170");
  26 |   await fillField(page, "Weight (kg)", "70");
  27 | 
  28 |   // Click Save & continue
  29 |   await page.getByRole("button", { name: "Save & continue" }).click();
> 30 |   await page.waitForTimeout(3000);
     |              ^ Error: page.waitForTimeout: Target page, context or browser has been closed
  31 | 
  32 |   // Check for validation errors
  33 |   const errors = page.locator('[class*="error"], [class*="Error"], .text-red, [style*="color: red"], [style*="color:red"]');
  34 |   const errorCount = await errors.count();
  35 |   console.log("Error elements found:", errorCount);
  36 |   for (let i = 0; i < errorCount; i++) {
  37 |     const text = await errors.nth(i).textContent().catch(() => "");
  38 |     if (text && text.trim()) console.log(`  Error ${i}: "${text.trim().substring(0, 200)}"`);
  39 |   }
  40 | 
  41 |   // Check for any visible error text
  42 |   const bodyText = await page.locator("main").textContent();
  43 |   console.log("Contains 'required':", bodyText?.includes("required"));
  44 |   console.log("Contains 'Please fix':", bodyText?.includes("Please fix"));
  45 |   console.log("Contains 'highlighted':", bodyText?.includes("highlighted"));
  46 |   console.log("Contains 'error':", bodyText?.toLowerCase().includes("error"));
  47 | 
  48 |   // Look for validation summary
  49 |   const allText = await page.locator("body").textContent();
  50 |   if (allText?.includes("Please fix")) {
  51 |     const idx = allText.indexOf("Please fix");
  52 |     console.log("Validation msg:", allText.substring(idx, idx + 300));
  53 |   }
  54 | });
  55 | 
```