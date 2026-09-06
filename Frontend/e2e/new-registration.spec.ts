import { test, expect, type Page } from "@playwright/test";
import { login, goToNewRegistration } from "./helpers";

/**
 * New Registration — end-to-end functional suite.
 *
 * Covers: Page-1 mandatory validation, conditional "Other" text fields,
 * date rules (diagnosis earlier than reporting is VALID, future is not),
 * Aadhaar format, numeric/range rules, Page-2 method-of-diagnosis
 * conditionals (incl. Microscopic pathological fields), Page-3 staging /
 * treatment conditionals, one complete realistic registration submitted
 * end-to-end, and direct-API bypass checks against the running backend.
 *
 * Field labels match the `label` prop used as the input `name` attribute by
 * the Field/SelectField components.
 */

const PAST = "2026-08-18"; // reporting / completion date
const DIAG = "2026-08-12"; // first diagnosis — earlier than reporting (must be VALID)
const PATH_DATE = "2026-08-15"; // 21.3 pathology date (≠ diagnosis → must be VALID)
const DOB = "1985-06-15";

/* ── Helpers ─────────────────────────────────────────────────────────── */

async function fillField(page: Page, label: string, value: string) {
  const input = page.locator(`input[name="${label}"]`);
  await expect(input).toHaveCount(1, { timeout: 5000 });
  await input.fill(value);
}

async function selectContains(page: Page, fragment: string, option: string) {
  const sel = page.locator(`select[name*="${fragment}"]`);
  await expect(sel).toHaveCount(1, { timeout: 5000 });
  await sel.selectOption({ label: option });
}

async function clickRadio(page: Page, name: string, index: number) {
  const radio = page.locator(`input[type="radio"][name="${name}"]`).nth(index);
  await expect(radio).toBeVisible({ timeout: 5000 });
  await radio.click({ force: true });
}

async function checkSameAddress(page: Page) {
  // The checkbox lives inside the <label>, so clicking the label toggles it.
  await page
    .getByText("Residential Address is same as Permanent Address", { exact: true })
    .click({ force: true });
  await page.waitForTimeout(200);
}

/** Searchable District → PIN combos (Jaipur → 302001). */
async function pickDistrictPin(page: Page) {
  const district = page.locator('input[placeholder="Select district"]');
  await expect(district).toHaveCount(1, { timeout: 8000 });
  await district.click();
  await page.locator('input[placeholder="Type to search…"]').fill("Jaipur");
  await page.getByRole("button", { name: "Jaipur", exact: true }).click();
  const pin = page.locator('input[placeholder="Select pincode"]');
  await expect(pin).toBeEnabled({ timeout: 15000 });
  await pin.click();
  await page.locator('input[placeholder="Type to search…"]').fill("302001");
  await page.getByRole("button", { name: "302001", exact: true }).click();
}

/**
 * Fill Page 1 with valid data. `overrides` maps a label → { fill } to leave a
 * field empty or set an invalid value (e.g. { fill: "12" }).
 */
async function fillStep1Valid(
  page: Page,
  overrides: Record<string, { fill: string }> = {}
) {
  const of = (label: string) => overrides[label]?.fill;

  if (of("3(a). Department name") !== undefined) {
    // skip default when overridden to blank by the caller via "":
  }
  const text = (label: string, valid: string) => {
    const v = of(label);
    return v !== undefined ? v : valid;
  };

  await fillField(page, "3(a). Department name", text("3(a). Department name", "Oncology"));
  await fillField(page, "3(b). Unit number", text("3(b). Unit number", "Unit 01"));
  await fillField(page, "5. Date of reporting", text("5. Date of reporting", PAST));
  await selectContains(page, "Case Registered Through", of("caseThrough") ?? "Out Patient");
  await fillField(page, "8. Date of first diagnosis", text("8. Date of first diagnosis", DIAG));
  await fillField(page, "First Name", text("First Name", "RAMESH"));
  await fillField(page, "Middle Name", text("Middle Name", "KUMAR"));
  await fillField(page, "Last Name", text("Last Name", "SHARMA"));
  await fillField(page, "10. Date of Birth", text("10. Date of Birth", DOB));
  await selectContains(page, "Gender", of("gender") ?? "Male");
  await page
    .getByPlaceholder("Enter Aadhaar number (12 digits)")
    .fill(text("a). Aadhaar number", "123456789012"));
  await page
    .getByPlaceholder("Enter ABHA number (14 digits)")
    .fill(text("b). ABHA number", "12345678901234"));
  await fillField(page, "Father name", of("Father name") ?? "SURESH SHARMA");
  await fillField(page, "Father mobile number", of("Father mobile number") ?? "9876543210");
  // Urban address
  await clickRadio(page, "urban-rural", 0);
  await page.waitForTimeout(300);
  await checkSameAddress(page);
  await fillField(page, "Flat / House No.", "12 MG ROAD");
  await fillField(page, "Street / Road", "MG ROAD");
  await fillField(page, "City", "JAIPUR");
  await pickDistrictPin(page);
  await fillField(page, "Mobile number", "9876543210");
  await fillField(
    page,
    "Duration of Stay at the above address (in years)",
    text("Duration of Stay at the above address (in years)", "10")
  );
  await selectContains(page, "Marital status", of("marital") ?? "Married");
  await selectContains(page, "Education", of("education") ?? "Graduate and above");
  await fillField(page, "Height (cm)", text("Height (cm)", "175"));
  await fillField(page, "Weight (kg)", text("Weight (kg)", "72"));
}

async function alertText(page: Page): Promise<string> {
  const alert = page.locator('[role="alert"]').last();
  await expect(alert).toBeVisible({ timeout: 8000 });
  return (await alert.innerText()).trim();
}

async function errorCount(page: Page): Promise<number> {
  return page.locator('[data-error="true"]').count();
}

async function expectSingleError(page: Page, message: RegExp) {
  await expect(page.locator('[data-error="true"]')).toHaveCount(1, { timeout: 8000 });
  await expect(page.getByText(message)).toBeVisible({ timeout: 5000 });
}

async function expectNoAlert(page: Page) {
  await expect(page.locator('[role="alert"]')).toHaveCount(0, { timeout: 5000 });
}

/** The main step heading (unique h3 with these classes). */
function mainHeading(page: Page) {
  return page.locator("h3.font-extrabold.text-lg");
}

/** Click "Save & continue" and wait until the step heading matches. */
async function advanceTo(page: Page, title: RegExp) {
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expect(mainHeading(page)).toHaveText(title, { timeout: 15000 });
}

/** Click "Previous" and wait until back on the given step heading. */
async function goBackTo(page: Page, title: RegExp) {
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(mainHeading(page)).toHaveText(title, { timeout: 10000 });
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE 1
   ═══════════════════════════════════════════════════════════════════════ */

test.describe("New Registration — Page 1", () => {
  test("NR-001: empty form is blocked — only Page-1 fields flagged, no advance", async ({
    page,
  }) => {
    await login(page);
    await goToNewRegistration(page);
    await page.getByRole("button", { name: "Save & continue" }).click();

    const text = await alertText(page);
    expect(text).toMatch(/please fix the highlighted fields/i);
    await expect(mainHeading(page)).toHaveText("Identifying information");
    expect(await errorCount(page)).toBeGreaterThan(10);
    expect(text).toMatch(/Department name/);
    expect(text).toMatch(/Unit number/);
    expect(text).toMatch(/Date of reporting/);
    expect(text).toMatch(/Date of first diagnosis/);
    expect(text).toMatch(/First Name/);
    expect(text).toMatch(/Date of Birth/);
    expect(text).toMatch(/Gender/);
    expect(text).toMatch(/Marital status/);
    expect(text).toMatch(/Education/);
    await expect(mainHeading(page)).not.toHaveText("Diagnostic details");
  });

  test("NR-003/004: diagnosis earlier than reporting is VALID; future diagnosis is rejected", async ({
    page,
  }) => {
    await login(page);
    await goToNewRegistration(page);

    await fillStep1Valid(page, { "8. Date of first diagnosis": { fill: "2099-01-01" } });
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expectSingleError(page, /future/i);

    await fillField(page, "8. Date of first diagnosis", DIAG);
    await advanceTo(page, /Diagnostic details/);
    await expectNoAlert(page);
  });

  test("NR-005: Aadhaar format enforced (11 digits rejected, 12 accepted)", async ({
    page,
  }) => {
    await login(page);
    await goToNewRegistration(page);

    await fillStep1Valid(page, { "a). Aadhaar number": { fill: "12345678901" } });
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expectSingleError(page, /Aadhaar must be exactly 12 digits/);

    await page.getByPlaceholder("Enter Aadhaar number (12 digits)").fill("123456789012");
    await advanceTo(page, /Diagnostic details/);
    await expectNoAlert(page);
  });

  test("NR-006: conditional 'Other' text fields are mandatory & state clears correctly", async ({
    page,
  }) => {
    await login(page);
    await goToNewRegistration(page);
    await fillStep1Valid(page);

    // 6 = Other → 6(a) appears and is mandatory
    await selectContains(page, "Case Registered Through", "Other");
    const otherInput = page.getByPlaceholder("Specify other case registered through");
    await expect(otherInput).toBeVisible();
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expectSingleError(page, /specify the case registered through \(Other\)/i);
    await otherInput.fill("CAMP");

    // switch away from Other → no stale requirement; form advances cleanly
    await selectContains(page, "Case Registered Through", "Out Patient");
    await advanceTo(page, /Diagnostic details/);
    await expectNoAlert(page);

    // values persisted across the step switch (Step 1 data survives)
    await goBackTo(page, /Identifying information/);
    await expect(page.locator('input[name="First Name"]')).toHaveValue("RAMESH");

    // 16 = Other → 16(a) mandatory
    await selectContains(page, "Marital status", "Other");
    await expect(page.locator('select[name*="Marital status"]')).toHaveValue("Other");
    await expect(page.getByPlaceholder("Specify other marital status")).toBeVisible();
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(mainHeading(page)).toHaveText("Identifying information", { timeout: 8000 });
    await expectSingleError(page, /specify the marital status \(Other\)/i);
    await page.getByPlaceholder("Specify other marital status").fill("DIVORCED");

    // 17 = Others (specify) → 17(a) mandatory
    await selectContains(page, "Education", "Others (specify)");
    await expect(page.locator('select[name*="Education"]')).toHaveValue("Others (specify)");
    await expect(page.getByPlaceholder("Specify education level")).toBeVisible();
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(mainHeading(page)).toHaveText("Identifying information", { timeout: 8000 });
    await expectSingleError(page, /specify the education level/i);
    await page.getByPlaceholder("Specify education level").fill("DIPLOMA");

    await advanceTo(page, /Diagnostic details/);
    await expectNoAlert(page);
  });

  test("NR-007: duration / height / weight reject negatives & zero", async ({
    page,
  }) => {
    await login(page);
    await goToNewRegistration(page);

    await fillStep1Valid(page, {
      "Duration of Stay at the above address (in years)": { fill: "-5" },
      "Height (cm)": { fill: "0" },
    });
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page.locator('[data-error="true"]')).toHaveCount(2, { timeout: 8000 });
    await expect(page.getByText(/Duration must be between 0 and 150 years/)).toBeVisible();
    await expect(page.getByText(/Height must be between 1 and 300 cm/)).toBeVisible();

    await fillField(page, "Duration of Stay at the above address (in years)", "10");
    await fillField(page, "Height (cm)", "175");
    await fillField(page, "Weight (kg)", "-1");
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expectSingleError(page, /Weight must be between 1 and 700 kg/);

    await fillField(page, "Weight (kg)", "72");
    await advanceTo(page, /Diagnostic details/);
    await expectNoAlert(page);
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   PAGE 2
   ═══════════════════════════════════════════════════════════════════════ */

test.describe("New Registration — Page 2", () => {
  test("NR-008/009: method-of-diagnosis conditionals + Microscopic fields", async ({
    page,
  }) => {
    await login(page);
    await goToNewRegistration(page);
    await fillStep1Valid(page);
    await advanceTo(page, /Diagnostic details/);

    // Blank Step 2 → blocked: at least one method + the later-date answer.
    // The banner lists the flagged KEYS (labels); per-field messages render
    // next to each control.
    await page.getByRole("button", { name: "Save & continue" }).click();
    const blankBanner = await alertText(page);
    expect(blankBanner).toMatch(/_diagnostic\.methods/); // no method chosen
    expect(blankBanner).toMatch(/_diagnostic\.microscopicLater/); // question unanswered
    await expect(page.getByText(/Longest duration of symptom is required/i)).toBeVisible();

    // Microscopic selected → pathological fields become mandatory
    await page
      .locator("label")
      .filter({ hasText: /^Microscopic$/ })
      .locator('input[type="checkbox"]')
      .click({ force: true });
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page.getByText(/Anatomical Site is required/i)).toBeVisible();

    // Fill everything Step-2 requires
    await fillField(page, "21. Longest duration of symptom for cancer (in months)", "6");
    await fillField(page, "21.1 Anatomical Site of Specimen / Biopsy / SMEAR", "UPPER OUTER QUADRANT");
    await fillField(page, "21.2 Pathology Slide No", "SL-8821");
    // 21.3 differs from first diagnosis (2026-08-12 vs 2026-08-15) → must stay VALID
    await fillField(page, "21.3 Date of Reporting", PATH_DATE);
    await fillField(page, "21.4 Primary Site of Tumour - Topography", "BREAST");
    await fillField(page, "21.5 Primary Histology / Morphology", "INFILTRATING DUCTAL CARCINOMA NST");
    await clickRadio(page, "microscopic-later", 1); // No
    await clickRadio(page, "laterality", 0); // Not a Paired Site

    await advanceTo(page, /Clinical stage & treatment/);
    await expectNoAlert(page);
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   PAGE 3 + full end-to-end submission + API-bypass
   ═══════════════════════════════════════════════════════════════════════ */

test.describe("New Registration — Page 3 & E2E submission", () => {
  test("NR-010…014: staging/treatment conditionals → complete registration + API bypass", async ({
    page,
    context,
  }) => {
    page.on("console", (m) => {
      if (m.text().startsWith("DBG")) console.log("PAGE:", m.text());
    });
    test.setTimeout(360_000);
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") pageErrors.push(`console: ${m.text()}`);
    });

    await login(page);
    await goToNewRegistration(page);

    // ── Step 1 ──
    await fillStep1Valid(page);
    await advanceTo(page, /Diagnostic details/);

    // ── Step 2 (Microscopic path) ──
    await page
      .locator("label")
      .filter({ hasText: /^Microscopic$/ })
      .locator('input[type="checkbox"]')
      .click({ force: true });
    await fillField(page, "21. Longest duration of symptom for cancer (in months)", "6");
    await fillField(page, "21.1 Anatomical Site of Specimen / Biopsy / SMEAR", "UPPER OUTER QUADRANT");
    await fillField(page, "21.2 Pathology Slide No", "SL-8821");
    await fillField(page, "21.3 Date of Reporting", PATH_DATE);
    await fillField(page, "21.4 Primary Site of Tumour - Topography", "BREAST");
    await fillField(page, "21.5 Primary Histology / Morphology", "INFILTRATING DUCTAL CARCINOMA NST");
    await clickRadio(page, "microscopic-later", 1);
    await clickRadio(page, "laterality", 0);
    await advanceTo(page, /Clinical stage & treatment/);

    // Capture the POST payloads for later API-bypass replay.
    const payloads: { patients: any[]; registrations: any[] } = {
      patients: [],
      registrations: [],
    };
    page.on("request", (req) => {
      if (req.method() !== "POST") return;
      const url = req.url();
      const body = req.postDataJSON() ?? {};
      if (/\/api\/patients$/.test(url)) payloads.patients.push(body);
      if (/\/api\/patients\/\d+\/registrations$/.test(url)) payloads.registrations.push(body);
    });

    // ── Page-3 blank submit is blocked with correct errors ──
    await page.getByRole("button", { name: "Submit registration" }).click();
    const blank = await alertText(page);
    expect(blank).toMatch(/please fix the highlighted fields/i);
    expect(blank).toMatch(/Clinical Extent of Disease/);
    expect(blank).toMatch(/Staging system/);
    expect(blank).toMatch(/Composite stage/);

    // ── Fill Page 3 ──
    await selectContains(page, "Clinical Extent of Disease", "Localized");
    // 28(a) TNM → T / N / M each required
    await selectContains(page, "Staging system", "TNM");
    await expect(page.locator('select[name="T"]')).toBeVisible();
    await page.locator('select[name="T"]').selectOption({ label: "T1" });
    await page.locator('select[name="N"]').selectOption({ label: "N0" });
    await page.locator('select[name="M"]').selectOption({ label: "M0" });
    await selectContains(page, "Composite stage", "IA");

    // 29. Treatment prior → Yes (default); type + ≥1 modality required
    await clickRadio(page, "29. Treatment Given Prior to Registration at RI / Outside RItype", 0); // Allopathic
    const surgery = page.locator('label:has-text("Surgery") input[type="checkbox"]');
    await surgery.nth(0).click({ force: true }); // 29 modalities

    // 30. Treatment at RI → mandatory type + ≥1 modality
    await clickRadio(page, "30. Treatment at RItype", 0); // Allopathic
    await surgery.nth(1).click({ force: true }); // 30 modalities

    await fillField(page, "31. Name of person completing form (IN CAPITALS)", "DR R K SHARMA");
    await fillField(page, "32. Date of completion of form", PAST);
    await fillField(page, "33. Contact Number", "9876543210");
    await fillField(page, "34. Designation", "REGISTRAR");

    // No field-level highlights remain after filling everything.
    await expect(page.locator('[data-error="true"]')).toHaveCount(0, { timeout: 5000 });

    // ── Submit → re-validates the whole form and, when clean, shows success ──
    page.on("response", async (r) => {
      if (r.url().includes("/registrations") && r.status() >= 400) {
        // eslint-disable-next-line no-console
        console.log(`API 4xx ${r.request().method()} ${r.url()} -> ${r.status()} ${(await r.text().catch(() => "")).slice(0, 2000)}`);
      }
    });
    await page.getByRole("button", { name: "Submit registration" }).click();
    await expect(page.getByText("Registration complete")).toBeVisible({ timeout: 30000 });

    expect(payloads.patients.length).toBeGreaterThanOrEqual(1);
    expect(payloads.registrations.length).toBeGreaterThanOrEqual(1);
    const patientPayload = payloads.patients[0];
    const regPayload = payloads.registrations[0];

    // ── Patient appears in Patient Records ──
    await page.getByRole("button", { name: "View patient records" }).click();
    await page.waitForTimeout(2000);
    await expect(
      page.locator("table tbody tr", { hasText: "RAMESH KUMAR SHARMA" }).first()
    ).toBeVisible({ timeout: 15000 });

    // ── Console errors must be benign ──
    const fatal = pageErrors.filter((e) =>
      /cannot|undefined|null|uncaught|is not a function|before initialization|invalid json|unexpected token/i.test(e)
    );
    expect(fatal).toEqual([]);
    // eslint-disable-next-line no-console
    console.log("Console/page errors observed:", JSON.stringify(pageErrors));

    // ── Direct-API bypass verification (no frontend in between) ──
    // Auth token lives in the httpOnly `hbcr_token` cookie (post
    // security-hardening), so `page.request` (shares the browser cookie
    // jar) authenticates via cookie + the CSRF header.
    const cookies = await context.cookies("http://localhost:5050/api");
    expect(cookies.find((c) => c.name === "hbcr_token")?.value).toBeTruthy();
    const base = "http://localhost:5050/api";
    const headers = {
      "X-Requested-With": "HBCR-SPA",
      "Content-Type": "application/json",
    };
    const api = page.request;

    // 1) Create a fresh patient so the registration belongs to this hospital.
    const patientRes = await api.post(`${base}/patients`, {
      headers,
      data: patientPayload,
    });
    expect(patientRes.status()).toBe(201);
    const patientBody = (await patientRes.json()) as {
      data?: { id: number };
    };
    const patientId = patientBody?.data?.id;
    expect(patientId).toBeGreaterThan(0);

    // 2) Same registration with a FUTURE reporting date must be rejected by the API.
    const futurePayload = { ...regPayload, dateOfReporting: "2099-01-01" };
    delete futurePayload.referenceNo;
    delete futurePayload.hbcrRegistrationNo;
    const r1 = await api.post(`${base}/patients/${patientId}/registrations`, {
      headers,
      data: futurePayload,
    });
    const b1 = (await r1.json()) as {
      error?: { message?: string; details?: { field: string }[] };
    };
    expect(r1.status()).toBe(422);
    expect(b1?.error?.details?.map((d) => d.field)).toContain("dateOfReporting");

    // 3) Registration missing a mandatory field (department name) must be rejected.
    const missingDept = { ...regPayload, departmentName: "" };
    delete missingDept.referenceNo;
    delete missingDept.hbcrRegistrationNo;
    const r2 = await api.post(`${base}/patients/${patientId}/registrations`, {
      headers,
      data: missingDept,
    });
    expect(r2.status()).toBe(422);

    // 4) Invalid enum (education) must be rejected.
    const badEnum = { ...regPayload, education: "NOT_AN_ENUM" };
    delete badEnum.referenceNo;
    delete badEnum.hbcrRegistrationNo;
    const r3 = await api.post(`${base}/patients/${patientId}/registrations`, {
      headers,
      data: badEnum,
    });
    expect(r3.status()).toBe(422);
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   Local helper used above
   ═══════════════════════════════════════════════════════════════════════ */

async function expectAlertMissing(page: Page, patterns: RegExp[]) {
  const text = await alertText(page);
  for (const p of patterns) expect(text, `alert should mention ${p}`).toMatch(p);
}
