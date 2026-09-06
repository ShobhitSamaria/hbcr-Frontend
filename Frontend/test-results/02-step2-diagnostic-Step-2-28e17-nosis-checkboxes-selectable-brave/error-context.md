# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-step2-diagnostic.spec.ts >> Step 2 — Diagnostic Details >> TC-100: Method of Diagnosis checkboxes selectable
- Location: e2e/02-step2-diagnostic.spec.ts:14:3

# Error details

```
Error: Channel closed
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('label').filter({ hasText: 'Clinical Only' }).locator('input[type=checkbox]')

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { login, goToNewRegistration } from "./helpers";
  3   | 
  4   | /**
  5   |  * TC-100 to TC-110: Step 2 — Diagnostic Details
  6   |  */
  7   | test.describe("Step 2 — Diagnostic Details", () => {
  8   |   test.beforeEach(async ({ page }) => {
  9   |     await login(page);
  10  |     await goToNewRegistration(page);
  11  |   });
  12  | 
  13  |   // TC-100: Method of Diagnosis checkboxes
  14  |   test("TC-100: Method of Diagnosis checkboxes selectable", async ({ page }) => {
  15  |     // Check "Clinical Only" checkbox
  16  |     const clinicalOnly = page.locator("label").filter({ hasText: "Clinical Only" }).locator("input[type=checkbox]");
> 17  |     await clinicalOnly.click({ force: true });
      |                        ^ Error: locator.click: Target page, context or browser has been closed
  18  |     await expect(clinicalOnly).toBeChecked();
  19  | 
  20  |     // Uncheck it
  21  |     await clinicalOnly.click({ force: true });
  22  |     await expect(clinicalOnly).not.toBeChecked();
  23  |   });
  24  | 
  25  |   // TC-101: Microscopic checkbox
  26  |   test("TC-101: Microscopic checkbox toggles", async ({ page }) => {
  27  |     const micro = page.locator("label").filter({ hasText: "Microscopic" }).locator("input[type=checkbox]");
  28  |     await micro.click({ force: true });
  29  |     await expect(micro).toBeChecked();
  30  |   });
  31  | 
  32  |   // TC-102: Was microscopic confirmation done - Yes/No
  33  |   test("TC-102: Microscopic confirmation Yes/No toggle", async ({ page }) => {
  34  |     // Scroll to step 2 section
  35  |     const yesRadio = page.locator("input[type=radio][value=Yes]").first();
  36  |     if (await yesRadio.isVisible()) {
  37  |       await yesRadio.click({ force: true });
  38  |       await expect(yesRadio).toBeChecked();
  39  |     }
  40  |   });
  41  | 
  42  |   // TC-103: Date of First Diagnosis - valid past date allowed
  43  |   test("TC-103: Date of First Diagnosis accepts old date", async ({ page }) => {
  44  |     const dateInputs = page.locator('input[type="date"]');
  45  |     const count = await dateInputs.count();
  46  |     // Date of First Diagnosis should be one of the date inputs
  47  |     for (let i = 0; i < count; i++) {
  48  |       const input = dateInputs.nth(i);
  49  |       const label = await input.locator("..").locator("span").first().textContent();
  50  |       if (label?.includes("first diagnosis") || label?.includes("First Diagnosis")) {
  51  |         await input.fill("2020-01-15");
  52  |         await expect(input).toHaveValue("2020-01-15");
  53  |         break;
  54  |       }
  55  |     }
  56  |   });
  57  | 
  58  |   // TC-104: 21. Complete Pathological Diagnosis - visible when Microscopic checked
  59  |   test("TC-104: Pathological fields visible with Microscopic", async ({ page }) => {
  60  |     const micro = page.locator("label").filter({ hasText: "Microscopic" }).locator("input[type=checkbox]");
  61  |     await micro.click({ force: true });
  62  |     await expect(page.getByText(/pathological diagnosis/i).first()).toBeVisible();
  63  |   });
  64  | 
  65  |   // TC-105: 21.3 Date of Reporting (pathological)
  66  |   test("TC-105: Pathological Date of Reporting visible", async ({ page }) => {
  67  |     const micro = page.locator("label").filter({ hasText: "Microscopic" }).locator("input[type=checkbox]");
  68  |     await micro.click({ force: true });
  69  |     await expect(page.getByText(/21\.3.*date of reporting/i)).toBeVisible();
  70  |   });
  71  | 
  72  |   // TC-106: 25. Laterality required
  73  |   test("TC-106: Laterality required on submit", async ({ page }) => {
  74  |     const micro = page.locator("label").filter({ hasText: "Microscopic" }).locator("input[type=checkbox]");
  75  |     await micro.click({ force: true });
  76  |     await page.getByRole("button", { name: /save/i }).first().click();
  77  |     await expect(page.getByText(/laterality/i).first()).toBeVisible();
  78  |   });
  79  | 
  80  |   // TC-107: 26. Sequence
  81  |   test("TC-107: Sequence dropdown available", async ({ page }) => {
  82  |     const selects = page.locator("select");
  83  |     const count = await selects.count();
  84  |     let found = false;
  85  |     for (let i = 0; i < count; i++) {
  86  |       const options = await selects.nth(i).locator("option").allTextContents();
  87  |       if (options.some(o => o.includes("First primary"))) {
  88  |         found = true;
  89  |         await selects.nth(i).selectOption({ index: 1 });
  90  |         break;
  91  |       }
  92  |     }
  93  |     expect(found).toBe(true);
  94  |   });
  95  | 
  96  |   // TC-108: Familial Cancer - visible only for specific cancers
  97  |   test("TC-108: Familial Cancer visible for Breast cancer", async ({ page }) => {
  98  |     // First select Breast as primary site
  99  |     const primarySiteSelects = page.locator("select");
  100 |     const count = await primarySiteSelects.count();
  101 |     for (let i = 0; i < count; i++) {
  102 |       const options = await primarySiteSelects.nth(i).locator("option").allTextContents();
  103 |       if (options.some(o => o.includes("Breast"))) {
  104 |         await primarySiteSelects.nth(i).selectOption({ label: "Breast" });
  105 |         break;
  106 |       }
  107 |     }
  108 |     await expect(page.getByText(/familial cancer/i).first()).toBeVisible();
  109 |   });
  110 | 
  111 |   // TC-109: ICD-O-3 Coding field
  112 |   test("TC-109: ICD-O-3 Coding field present", async ({ page }) => {
  113 |     await expect(page.getByText(/ICD-O-3/i).first()).toBeVisible();
  114 |   });
  115 | 
  116 |   // TC-110: ICD-10 Site of Tumour field
  117 |   test("TC-110: ICD-10 Site of Tumour field present", async ({ page }) => {
```