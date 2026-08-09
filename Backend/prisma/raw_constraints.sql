-- =============================================================================
-- HBCR Cancer Registry - raw SQL companion to prisma/schema.prisma
-- =============================================================================
-- Holds database features that the current Prisma 7 syntax cannot express
-- directly:
--   * CHECK constraints (regex/format + conditional NOT NULL)
--   * Partial indexes (PG-specific WHERE clause)
--   * The pg_trgm GIN index on patients.full_name
--   * The pg_trgm extension itself
--
-- Apply with:  npm run constraints
--
-- IMPORTANT: the dev env we got had migrations applied WITHOUT the schema
-- qualifier (tables were created as `public."hbcr.centres"`). The statements
-- below reference each table by its actual (quoted) name so they work whether
-- the schema existed or not.  All `IF NOT EXISTS` and `DO $$ BEGIN ... EXCEPTION`
-- blocks make this script safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extension for fuzzy name search
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 1. CHECK constraints
-- ---------------------------------------------------------------------------

-- patient_addresses: formats
DO $$ BEGIN
  ALTER TABLE "hbcr.patient_addresses"
      ADD CONSTRAINT pin_format
      CHECK (pin_code IS NULL OR pin_code ~ '^[1-9][0-9]{5}$');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hbcr.patient_addresses"
      ADD CONSTRAINT mobile_format
      CHECK (mobile_number IS NULL OR mobile_number ~ '^[6-9][0-9]{9}$');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hbcr.patient_addresses"
      ADD CONSTRAINT email_format
      CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- patient_habits: duration only if answer = 'yes'
DO $$ BEGIN
  ALTER TABLE "hbcr.patient_habits"
      ADD CONSTRAINT habit_duration
      CHECK (answer <> 'yes' OR duration_months IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- patient_comorbidities: duration only if answer = 'yes'
DO $$ BEGIN
  ALTER TABLE "hbcr.patient_comorbidities"
      ADD CONSTRAINT comorb_duration
      CHECK (answer <> 'yes' OR duration_months IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- registrations: hbcr_registration_no shape
DO $$ BEGIN
  ALTER TABLE "hbcr.registrations"
      ADD CONSTRAINT hbcr_reg_no_format
      CHECK (hbcr_registration_no ~ '^HBCR-[0-9]{4}-[0-9]{4,5}$');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- registrations: referral sub-fields required only when referral_type='other_hospital'
DO $$ BEGIN
  ALTER TABLE "hbcr.registrations"
      ADD CONSTRAINT referral_subfields
      CHECK (
          referral_type IS NULL
          OR referral_type <> 'other_hospital'
          OR (referral_facility_name IS NOT NULL AND referral_facility_city IS NOT NULL)
      );
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- familial_cancer_history: sub-fields required only when family_history='yes'
DO $$ BEGIN
  ALTER TABLE "hbcr.familial_cancer_history"
      ADD CONSTRAINT fam_history_subfields
      CHECK (
          family_history <> 'yes'
          OR (relationship_with_cancer IS NOT NULL AND degree_of_relationship IS NOT NULL)
      );
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

-- GIN trigram on patients.full_name (no-op if extension isn't available).
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm
    ON "hbcr.patients"
    USING gin (full_name gin_trgm_ops);

-- Partial index for selected treatment modalities (Prisma 7 cannot express
-- WHERE clauses natively; our @@index is a plain BTree).
CREATE INDEX IF NOT EXISTS idx_treatment_modality_selected_only
    ON "hbcr.treatment_modality_details" (treatment_id)
    WHERE is_selected = true;

-- ---------------------------------------------------------------------------
-- End of raw_constraints.sql
-- ---------------------------------------------------------------------------
