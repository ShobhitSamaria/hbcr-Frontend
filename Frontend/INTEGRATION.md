# HBCR Frontend → Backend Integration

Status: **fully wired.** Every dashboard tile, the records page, and the
multi-step registration form now talk to the HBCR backend at
`http://localhost:5050`.

## How to run

In two terminals:

```bash
# 1) Start the backend (port 5050)
cd Backend
npm install        # only first time
npm run start      # or: npm run dev

# 2) Start the frontend (port 8080)
cd Frontend
# .env.local already points to the backend at :5050
npx vite           # or: pnpm dev
```

Open <http://localhost:8080>. CORS allows the dev origin.

## Architecture overview

```
Frontend (React)                        Backend (Express)              PostgreSQL
─────────────────────────────────────────  ────────────────────────  ────────────
Field/SelectField                ────────► /api/patients           ─► hbcr.patients
       └─ FormStateProvider     ────────► /api/patients/:id/side/*  ─► hbcr.patient_*
                                  ────────► /api/registrations     ─► hbcr.registrations
charts & lists (Dashboard,             ─► /api/dashboard/*         ─► *_aggregate
                  Records)            ─► /api/centres/hospitals/...
Registration orchestrator               ─►
       └─ handleSubmit() on "Submit"
                                                       pg_trgm + CHECK constraints
                                                       from prisma/raw_constraints.sql
```

## Files added / updated

| Path | Purpose |
| ---- | ------- |
| `client/lib/api.ts`                    | Typed fetch client + every endpoint |
| `client/lib/formState.tsx`             | Form-capture React context used to gather step 1/2/3 values without changing the existing UI |
| `client/lib/utils/hbcrForm.ts`        | Maps captured form values to HBCR payloads |
| `client/lib/index/utils/apiRows.ts`   | Adapts API shapes → the table rows the existing UI expects |
| `client/lib/index/utils/registrationSubmit.ts` | Pipeline that POSTs to the backend, mirroring the orchestrator's flow |
| `client/lib/index/components/FormFields.tsx`   | `Field`/`SelectField` now write to the form-state context (when provided), original behaviour preserved |
| `client/lib/index/components/registration/DiagnosticDetails.tsx` | Same mirroring — pure addition, no UI change |
| `client/lib/index/components/Dashboard.tsx`    | Live `/api/dashboard/*` + `/api/dashboard/recent` |
| `client/lib/index/components/Records.tsx`       | Live `/api/patients` with search + pagination |
| `client/lib/index/components/Charts.tsx`        | Live `/api/dashboard/monthly` + `/api/dashboard/case-overview` |
| `client/lib/index/components/Registration.tsx`  | Wraps content in `FormStateProvider`, POSTs on submit, keeps the original 3-step UI + success screen |
| `tests/integration-check.mjs`          | Node-based smoke that mirrors the orchestrator's full pipeline |
| `Backend/scripts/apply-raw-constraints.mjs` | Applies the CHECK + index + pg_trgm companion SQL |
| `Backend/tests/e2e.sh`                 | Bash equivalent of the same pipeline |
| `.env.local`                           | `VITE_API_BASE=http://localhost:5050/api` |

## Audit issues addressed

- **raw_constraints.sql safely applied** via `npm run constraints`.
  CHECK constraints for PIN / mobile / email / HBCR ID / conditional
  durations, plus the pg_trgm GIN index and partial index on
  `treatment_modality_details`, are now active in PostgreSQL.
- **Centre code field** still exists in the UI; its value is captured into
  the form state (the column itself is not on the schema; the audit flagged
  it as redundant because the centre already lives on `hospitals`).
- **Age / DOB** are stored as two nullable columns; the API accepts both
  being absent. The UI keeps offering both inputs unchanged.
- **Date handling** — the dates captured into form state are already in
  `YYYY-MM-DD` format and the API accepts ISO date strings.

## Status codes, validation, and error handling

- Successful reads: `200`, JSON envelope `{success: true, data, meta?}`.
- Successful writes: `201` (created) or `200` (updated).
- Validation errors: `422` with `details: { field, message }[]`.
- Not found / FK violations: `404` / `409`.
- Network or backend-down: surfaced as a small banner on the Dashboard,
  Records page, and registration error slot.

## Tests

```bash
# Backend API smoke (46 cases)
cd Backend
npm run reset && npm run seed
bash tests/smoke.sh          # PASS: 46 / FAIL: 0

# End-to-end (mirrors the frontend pipeline)
bash tests/e2e.sh            # 14 calls, reads back via GET

# Frontend pipeline (Node)
node tests/integration-check.mjs
```
