# HBCR Prisma Schema

This folder holds the **Prisma schema** for the HBCR Cancer Registry, plus a
companion raw-SQL file with database features that Prisma 7 syntax cannot
express directly.

## Files

| File                    | Purpose                                                                         |
| ----------------------- | ------------------------------------------------------------------------------- |
| `schema.prisma`         | All 16 HBCR tables + 30 PostgreSQL enums (under the `hbcr` schema).              |
| `raw_constraints.sql`   | CHECK constraints, the `pg_trgm` extension, the GIN trigram index, and the partial index on `treatment_modality_details` (see notes below). |

The mapping to SQL exactly follows `../db.txt` (the canonical DB design report
in the project root).

## What is in the Prisma schema

- **30 enums** mirroring every dropdown in the three registration steps
  (gender, Aadhaar/ABHA, referral, marital status, education, status of
  registration, diagnostic method, laterality, sequence, clinical extent,
  staging system, ECOG status/grade, treatment stage/type/targeted
  therapy/modality/intention/role/details, etc.). Each enum is mapped to the
  `hbcr.<name>_enum` schema-qualified Postgres enum via `@@map`.
- **16 models** covering: centres, hospitals, users, patients and the five
  patient-side tables (identifications, relatives, addresses, habits,
  comorbidities); registrations and the four clinical-side tables
  (diagnostic methods, diagnostic procedures, pathological diagnoses,
  treatments + treatment modality details); plus familial cancer history.
- All tables live under the `hbcr` Postgres schema via `@@map("hbcr.<table>")`.
- All snake_case column names are preserved via `@map("snake_case")` so the
  generated SQL matches `db.txt` byte-for-byte.
- Cross-references use Prisma relations with explicit `onDelete`
  (`Cascade`, `Restrict`, `SetNull`) per `db.txt`.
- Composite uniqueness (`(patient_id, address_type)`, etc.) is enforced via
  `@@unique([...])`.
- Plain non-unique indexes are added via `@@index(...)`.
- Date / numeric precision is preserved with `@db.Date`, `@db.Timestamptz(6)`,
  `@db.SmallInt`, and `@db.Decimal(p, s)`.

## What is _not_ in the Prisma schema (and why)

These three items are NOT expressible in Prisma 7 syntax today, so they live
in `raw_constraints.sql`:

1. **`CHECK` constraints** - Prisma 7 does not support `@@check(...)`.
   Constraints such as `hbcr_registration_no ~ '^HBCR-[0-9]{4}-[0-9]{4,5}$'`,
   `pin_code ~ '^[1-9][0-9]{5}$'`, and the conditional `duration_months`
   requirement sit in `raw_constraints.sql`.
2. **The `pg_trgm` extension + GIN index** on `hbcr.patients.full_name`.
3. **A partial index** (WHERE is_selected = true) on
   `hbcr.treatment_modality_details`. The Prisma schema adds a plain BTree
   on `treatment_id` (covers the main access path); the canonical partial
   index is added in `raw_constraints.sql`.

The Prisma enum `DiagnosticMethodKind` is named with the `Kind` suffix to
avoid a name collision with the model `DiagnosticMethod`. The underlying
Postgres enum is still `hbcr.diagnostic_method_enum`.

## How to use these files

Current status: **schema files created and validated. Migrations NOT run.**

Next steps when you're ready to migrate:

```bash
cd Backend
npx prisma migrate dev --name init     # creates the SQL migration + applies it
psql "$DATABASE_URL" -f prisma/raw_constraints.sql   # add CHECK + pg_trgm + partial index
npx prisma generate                   # generate the typed client
```

Until that happens, `prisma generate` will fail with no `DATABASE_URL`
(the existing `.env` already points at `postgresql://postgres@localhost:5432/hbcr_db`,
which is fine for a fresh local Postgres).
