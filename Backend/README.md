# HBCR Backend (Express + Prisma + PostgreSQL)

The complete REST API for the HBCR Cancer Registry. Built on top of the
existing `prisma/schema.prisma`.

## Quick start

```bash
cd Backend
npm install             # @prisma/adapter-pg, pg, tsx already declared
npm run seed            # optional - sample hospitals/centres/patients/registrations
npm run start           # tsx src/server.ts  (default port 5050)
```

Smoke tests (after the server is up and the DB is seeded):

```bash
./tests/smoke.sh        # 46/46 cases - covers every endpoint
```

## Configuration

All settings come from `Backend/.env` (already present):

| Variable        | Default                                                       | Notes                       |
| --------------- | ------------------------------------------------------------- | --------------------------- |
| `DATABASE_URL`  | `postgresql://shobhitsamaria@localhost:5432/hbcr_db`          | Used by the Prisma driver   |
| `PORT`          | `5050`                                                        | Avoid 5000 (macOS AirPlay)  |
| `NODE_ENV`      | `development`                                                 |                             |
| `CORS_ORIGIN`   | `*`                                                           | Comma-separated allow-list  |

## Architecture

```
Backend/
+-- prisma/
|   +-- schema.prisma          # 16 models, 30 PG enums (unchanged)
|   +-- raw_constraints.sql    # CHECK constraints, pg_trgm, partial index (optional)
|   +-- seed.ts                # sample centres, hospitals, patients, registrations
|   +-- reset_seed.ts          # wipe patient/registration tables
|   +-- migrations/init.sql    # prisma-generated initial migration
+-- src/
|   +-- server.ts              # entry
|   +-- app.ts                 # express app factory
|   +-- config/index.js        # env config
|   +-- db/prisma.ts           # PrismaClient + driver adapter (pg)
|   +-- middleware/
|   |   +-- asyncHandler.ts    # wraps async controllers
|   |   +-- errorHandler.ts    # uniform JSON error envelope, Prisma error mapping
|   |   +-- notFoundHandler.ts # 404 fallback
|   |   +-- validate.ts        # generic per-route validator
|   +-- utils/
|   |   +-- httpError.ts       # HttpError + parseIdParam
|   |   +-- pagination.ts      # parsePagination + buildMeta
|   |   +-- response.ts        # ok() / created() / noContent() / fail()
|   +-- validators/            # tiny in-process validators (no extra deps)
|   |   +-- common.ts
|   |   +-- patient.validator.ts
|   |   +-- patientId.validator.ts
|   |   +-- address.validator.ts
|   |   +-- relative.validator.ts
|   |   +-- habit.validator.ts
|   |   +-- comorbidity.validator.ts
|   |   +-- familyHistory.validator.ts
|   |   +-- registration.validator.ts
|   |   +-- diagnostic.validator.ts
|   |   +-- pathology.validator.ts
|   |   +-- treatment.validator.ts
|   +-- services/              # business logic (one file per resource)
|   +-- controllers/           # request/response wrappers
|   +-- routes/                # Express routers (one per resource group)
+-- tests/
    +-- smoke.sh               # 46 end-to-end API tests
```

## REST API surface

All routes are prefixed with `/api`. Responses use the uniform envelope:

- Success: `{ "success": true, "message": "...", "data": ..., "meta": ... }`
- Error:   `{ "success": false, "error": { "message", "status", "details" } }`

### Health

| Method | Path                    | Purpose                             |
| ------ | ----------------------- | ----------------------------------- |
| GET    | `/api/health`           | Ping / metadata                     |
| GET    | `/api/health/live`      | Liveness                            |
| GET    | `/api/health/ready`     | DB round-trip check                 |

### Reference (look-ups)

| Method | Path                          |
| ------ | ----------------------------- |
| GET    | `/api/centres`                |
| GET    | `/api/hospitals`              |
| GET    | `/api/users`                  |

### Dashboard

| Method | Path                              |
| ------ | --------------------------------- |
| GET    | `/api/dashboard/stats`            |
| GET    | `/api/dashboard/monthly?months=6` |
| GET    | `/api/dashboard/case-overview`   |
| GET    | `/api/dashboard/recent?limit=5`   |

### Patients (CRUD + side tables)

| Method | Path                                            | Notes            |
| ------ | ----------------------------------------------- | ---------------- |
| GET    | `/api/patients?page=&limit=&search=&gender=`    | paginated        |
| POST   | `/api/patients`                                 |                  |
| GET    | `/api/patients/:id`                             | full side tables |
| PATCH  | `/api/patients/:id`                             |                  |
| DELETE | `/api/patients/:id`                             | cascades         |

Side tables under `/api/patients/:patientId/side/`:

| Resource        | Routes                                                         |
| --------------- | -------------------------------------------------------------- |
| identifications | `GET / POST / PATCH /:id / DELETE /:id`                       |
| relatives       | `GET / POST / PATCH /:id / DELETE /:id`                       |
| addresses       | `GET / POST / PATCH /:id / DELETE /:id`                       |
| habits          | `GET / POST / PATCH /:id / DELETE /:id`                       |
| comorbidities   | `GET / POST / PATCH /:id / DELETE /:id`                       |

### HBCR registrations (Step 1 fields 1-8, 16-17, 31-32 + hospital)

| Method | Path                                                    | Notes                              |
| ------ | ------------------------------------------------------- | ---------------------------------- |
| GET    | `/api/registrations?status=&hospitalId=&patientId=&q=`  | paginated                         |
| GET    | `/api/patients/:patientId/registrations`               | per-patient                        |
| POST   | `/api/patients/:patientId/registrations`               | requires `hospitalId` in body      |
| GET    | `/api/registrations/:id`                               | full record incl. side sections   |
| PATCH  | `/api/registrations/:id`                               |                                    |
| DELETE | `/api/registrations/:id`                               | cascades                          |

### Diagnostic methods (Step 2, Field 20)

| Method | Path                                                            |
| ------ | --------------------------------------------------------------- |
| GET    | `/api/registrations/:registrationId/diagnostic-methods`         |
| POST   | `/api/registrations/:registrationId/diagnostic-methods`         |
| GET    | `/api/diagnostic-methods/:methodId`                             |
| PATCH  | `/api/diagnostic-methods/:methodId`                             |
| DELETE | `/api/diagnostic-methods/:methodId`                             |
| GET    | `/api/diagnostic-methods/:methodId/procedures`                  |
| POST   | `/api/diagnostic-methods/:methodId/procedures`                  |
| PATCH  | `/api/diagnostic-procedures/:procedureId`                       |
| DELETE | `/api/diagnostic-procedures/:procedureId`                       |

### Pathological diagnosis (Step 2, Fields 21-26)

| Method | Path                                                              |
| ------ | ----------------------------------------------------------------- |
| GET    | `/api/registrations/:registrationId/pathological-diagnosis`        |
| POST   | `/api/registrations/:registrationId/pathological-diagnosis`        |
| PATCH  | `/api/registrations/:registrationId/pathological-diagnosis`        |
| DELETE | `/api/registrations/:registrationId/pathological-diagnosis`        |

### Family cancer history (Step 1, Field 19)

| Method | Path                                                          |
| ------ | ------------------------------------------------------------- |
| GET    | `/api/registrations/:registrationId/family-history`           |
| POST   | `/api/registrations/:registrationId/family-history`           |
| PATCH  | `/api/registrations/:registrationId/family-history`           |
| DELETE | `/api/registrations/:registrationId/family-history`           |

### Treatment block (Step 3, Fields 27-32)

| Method | Path                                                |
| ------ | --------------------------------------------------- |
| GET    | `/api/registrations/:registrationId/treatments`     |
| POST   | `/api/registrations/:registrationId/treatments`     |
| GET    | `/api/treatments/:treatmentId`                      |
| PATCH  | `/api/treatments/:treatmentId`                      |
| DELETE | `/api/treatments/:treatmentId`                      |
| GET    | `/api/treatments/:treatmentId/modalities`           |
| POST   | `/api/treatments/:treatmentId/modalities`           |
| PATCH  | `/api/treatment-modalities/:modalityId`             |
| DELETE | `/api/treatment-modalities/:modalityId`             |

## Status codes

| Code | Meaning                                                                                  |
| ---- | ---------------------------------------------------------------------------------------- |
| 200  | Successful read                                                                          |
| 201  | Successful create (POST /api/patients, POST /api/patients/:id/registrations, ...)        |
| 204  | Successful delete (no body)                                                              |
| 400  | Validation failure / malformed id / bad type                                            |
| 404  | Not found (record or route)                                                              |
| 409  | Unique constraint or FK conflict                                                        |
| 422  | Validation failed (with `details[]` listing every field error)                           |
| 500  | Unhandled server error                                                                   |

## Notes

- The DB schema (`prisma/schema.prisma`) was **not** modified - it was used
  verbatim.
- Prisma 7 + driver adapter (`@prisma/adapter-pg`) requires Node 18+ and the
  dedicated `pg` driver. The combination is wired in `src/db/prisma.ts`.
- `raw_constraints.sql` is **not** applied automatically. If you want the
  CHECK / trigram / partial index from `db.txt`, run it once after the
  initial migration with `psql`.
- No authentication was added (per task instructions). `users` and
  `createdByUserId` exist in the model but no JWT / session logic.
