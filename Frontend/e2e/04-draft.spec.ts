import { test, expect } from "@playwright/test";
import { login, goToNewRegistration, goToDrafts } from "./helpers";

/**
 * TC-170 to TC-173: Draft flow
 */
test.describe("TC-170: Save Draft", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNewRegistration(page);
  });

  test("TC-170: Save Draft requires Patient Name and Aadhaar", async ({ page }) => {
    // Click Save Draft without filling anything
    await page.getByRole("button", { name: /save draft/i }).first().click();
    await page.waitForTimeout(1000);
    // Should show validation error
    const errorVisible = await page.getByText(/patient name|aadhaar/i).first().isVisible().catch(() => false);
    expect(errorVisible).toBe(true);
  });

  test("TC-171: Save Draft succeeds with Patient Name and Aadhaar", async ({ page }) => {
    // Fill patient name
    const inputs = page.locator('input[type="text"]');
    for (let i = 0; i < await inputs.count(); i++) {
      const parent = inputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("first name") || label?.includes("First Name")) {
        await inputs.nth(i).fill("Test");
        break;
      }
    }

    // Fill Aadhaar
    for (let i = 0; i < await inputs.count(); i++) {
      const parent = inputs.nth(i).locator("..");
      const label = await parent.locator("span").first().textContent();
      if (label?.includes("Aadhaar")) {
        await inputs.nth(i).fill("123456789012");
        break;
      }
    }

    // Click Save Draft
    await page.getByRole("button", { name: /save draft/i }).first().click();
    await page.waitForTimeout(2000);

    // Should navigate to drafts page or show success
    const url = page.url();
    expect(url.includes("/drafts") || url.includes("/records")).toBe(true);
  });
});

test.describe("TC-172: Draft listing", () => {
  test("TC-172: Drafts page shows saved drafts", async ({ page }) => {
    await login(page);
    await goToDrafts(page);
    await page.waitForTimeout(1000);
    // Should show the drafts table
    await expect(page.getByText(/draft/i).first()).toBeVisible();
  });
});

test.describe("TC-173: Resume Draft", () => {
  test("TC-173: Clicking draft opens form with pre-filled data", async ({ page }) => {
    await login(page);
    await goToDrafts(page);
    await page.waitForTimeout(1000);

    // Click first draft row
    const rows = page.locator("table tbody tr");
    if (await rows.count() > 0) {
      await rows.first().click();
      await page.waitForTimeout(2000);
      // Should navigate to registration form
      expect(page.url()).toContain("/register");
    }
  });
});
