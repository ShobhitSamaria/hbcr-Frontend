# New Registration — Playwright Test Cases

Suite: `Frontend/e2e/new-registration.spec.ts`
Last run: 5 Sept 2026 — **chromium: 7/7 PASS · brave: 7/7 PASS** (headless)
Environment: frontend `http://localhost:5173` · backend `http://localhost:5050` (local dev; login `hospital1` / `HBCR@2024`)
Test patient: `RAMESH KUMAR SHARMA` (a fresh patient is created by each run — post-fix registrations locally verified as rows 10 & 11)

Each `test(...)` in the suite drives several scenarios below through the real UI and asserts the outcome; results are per scenario, not per test.

| TC ID  | Page   | Field / Feature                    | Test scenario                                          | Test data / input                             | Expected result                         | Actual result | Status |
| ------ | ------ | --------------------------------- | ------------------------------------------------------ | -------------------------------------------- | --------------------------------------- | ------------- | ------ |
| NR-001 | Page 1 | Mandatory validation              | Submit empty form                                      | Empty                                        | Blocked; alert lists only missing Page-1 fields | Same          | PASS   |
| NR-001a| Page 1 | Empty-form error accuracy         | No unrelated/invalid field flagged                     | Empty                                        | Only genuinely missing fields highlighted | Same         | PASS   |
| NR-002 | Page 1 | Date of Reporting                 | Future date                                            | A date > today                              | Reject                                   | Reject        | PASS   |
| NR-003 | Page 1 | Date of First Diagnosis           | Diagnosis earlier than reporting                       | 12/08/2026 vs 18/08/2026                     | Accept                                    | Accept        | PASS   |
| NR-004 | Page 1 | Date of First Diagnosis           | Diagnosis later than reporting / future                | 20/08/2026 (future)                          | Reject                                    | Reject        | PASS   |
| NR-005 | Page 1 | Aadhaar                           | Invalid length then valid                              | 11 digits → reject; 12 digits → accept      | 11 rejected, 12 accepted                 | Same          | PASS   |
| NR-005b| Page 1 | ABHA                              | Invalid then valid format                              | 13 digits → reject; 14 digits → accept      | 13 rejected, 14 accepted                 | Same          | PASS   |
| NR-006 | Page 1 | 6(a) Case Through = Other         | Conditional text mandatory                             | Other + empty → reject; Other + value → OK   | Empty rejected                           | Reject        | PASS   |
| NR-006b| Page 1 | 6(a) state clearing               | Switch Other → Self → Other                            | Toggle                                       | No stale mandatory state                 | Same          | PASS   |
| NR-006c| Page 1 | 16(a) Marital / 17(a) Education   | Other → conditional text mandatory                     | Other + empty → reject; fill → pass          | Empty rejected                           | Reject        | PASS   |
| NR-007 | Page 1 | Duration of Stay                 | 0 / negative / decimal / text                          | `0`, `-5`, `2.5`, `abc`                      | Reject (mandatory int range)            | Reject        | PASS   |
| NR-007b| Page 1 | Height / Weight                  | 0 / negative / decimal / text                          | `0`, `-1`, `170.5`, `abc`                    | Reject; positive int only               | Reject        | PASS   |
| NR-008 | Page 2 | Method of Diagnosis              | No method selected                                    | None checked                                 | Reject                                     | Reject        | PASS   |
| NR-008b| Page 2 | Microscopic conditional fields   | Microscopic selected + path fields filled              | Slides/date/site/morphology/laterality       | Accept (data persists)                   | Accept        | PASS   |
| NR-009 | Page 2 | Microscopic date vs diagnosis    | Diagnosis ≠ microscopic date is VALID                  | DX 12/08, report 18/08, path 15/08           | Accept — no “must match” rule            | Accept        | PASS   |
| NR-009b| Page 2 | Habits / Co-morbidities          | Yes + duration empty/0/negative/decimal                | empty, `0`, `-2`, `1.5`                      | Reject                                    | Reject        | PASS   |
| NR-010 | Page 3 | TNM staging                      | T / N / M required when TNM                            | Missing one of T/N/M → reject; full → pass   | Reject if partial                         | Reject        | PASS   |
| NR-011 | Page 3 | Treatment prior = Yes            | Treatment type + ≥1 modality required                  | Missing type/modality → reject; filled → OK  | Reject if missing                         | Reject        | PASS   |
| NR-011b| Page 3 | 30 Treatment at RI               | Type + modality selection                              | Filled                                        | Accept                                    | Accept        | PASS   |
| NR-012 | Page 3 | Contact Number                   | Invalid number                                        | `abc`, short                                | Reject (10-digit MOBILE_RE)              | Reject        | PASS   |
| NR-012b| Page 3 | 31 Person completing / 32 Date   | Required + valid name/date                            | Name + past date                             | Accept and **persisted to backend**        | Accept        | PASS   |
| NR-013 | All    | Complete registration            | Full valid patient through 3 pages                    | Ramesh Kumar Sharma, Jaipur PIN, etc.        | Success screen; registration created      | Success       | PASS   |
| NR-013b| All    | Generated numbers                | Registration/reference numbers displayed              | Success screen                               | Numbers shown correctly                   | Shown         | PASS   |
| NR-014 | All    | Persistence                      | Search registered patient in Patient Records          | Name search                                  | Patient found with entered data           | Found         | PASS   |
| NR-014b| All    | Console / network clean          | No JS errors, no unexpected 4xx/5xx                    | Whole flow                                   | No console errors                         | None          | PASS   |
| NR-015 | API    | Backend bypass — future date     | Direct POST with future reporting date                | `dateOfReporting: 2099-01-01`               | 422 with `dateOfReporting` detail         | 422           | PASS   |
| NR-015b| API    | Backend bypass — missing field   | Direct POST missing department name                   | `departmentName: ""`                         | 422                                          | 422           | PASS   |
| NR-015c| API    | Backend bypass — bad enum        | Direct POST invalid education enum                    | `education: "NOT_AN_ENUM"`                  | 422                                          | 422           | PASS   |
| NR-015d| API    | Backend bypass — auth cookie     | Direct API auths via httpOnly cookie + CSRF header    | Cookie + `X-Requested-With`                 | Authenticated requests succeed            | 201 / 422 as expected | PASS   |

## Defects found during this run and fixed

| # | Severity | Where | Defect | Fix |
| - | -------- | ----- | ------ | --- |
| D1 | High | `step1Rules.ts` | Conditional trigger for 6(a)/16(a) Other compared against a straight apostrophe (`Patient's`) while the form key/label uses the curly apostrophe (`Patient’s`) — so the “Other → 6(a) mandatory” rule never fired and empty conditional values advanced. | Match the exact key character (curly apostrophe). NR-006 now rejects empty Other. |
| D2 | **Critical** | `hbcrForm.ts` → registration POST | `extractRegistration` never sent `anthropometricHeightCm`/`anthropometricWeightKg` or `formCompletedBy`/`formCompletionDate`. UI showed them filled, backend `required()` 422'd, errors mapped back to labels 31/32 — the exact production “Save & Next: fields filled but flagged” symptom. | Map `Height (cm)`/`Weight (kg)` → numeric `anthropometric*`, and fields 31/32 → `formCompletedBy`/`formCompletionDate`. |
| D3 | **Critical** | `hbcrForm.ts` → pathology POST | `laterality` sent as `NOT_A_PAIRED_SITE` (naive transform) but backend enum is `NOT_PAIRED_SITE`; `sequence` likewise mismatched; `25(a)` paired laterality never sent. The whole Step-2 microscopic/pathology upsert 422'd and was silently swallowed → pathology data never stored. | Explicit UI→enum maps for Laterality, PairedLaterality and Sequence (same pattern as existing `GRADE_ENUM`). Post-fix rows verified in DB (`laterality: NOT_PAIRED_SITE`, slides/date persisted). |
| D4 | Low | `playwright.config.ts` | Both projects were hard-coded `headless: false`, forcing a visible browser. | Honor `HEADLESS=1` so the suite can run headless in CI. |

## Notes / environment

- Backend rate limiters (200 req / 15 min global, 10 logins / 15 min) are **in-memory**; repeated suite runs in a short window hit 429s (“Too many requests”). Restart the backend to reset. Not an application defect.
- Brave autocomplete dropdown for District/Pincode occasionally stalls under headless automation; the identical flow passes deterministically on chromium. Harness timing quirk, not app code.
