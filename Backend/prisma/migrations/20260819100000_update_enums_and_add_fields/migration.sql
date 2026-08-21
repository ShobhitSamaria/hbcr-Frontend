-- 1. Habit enum: rename SMOKELESS_TOBACCO → SMOKELESS, replace BETEL_NUT with two options
-- PostgreSQL doesn't support renaming enum values directly, so we:
--   a) Add new values
--   b) Migrate existing data
--   c) Remove old values

ALTER TYPE "hbcr.habit_enum" ADD VALUE IF NOT EXISTS 'smokeless' BEFORE 'alcohol';
ALTER TYPE "hbcr.habit_enum" ADD VALUE IF NOT EXISTS 'betel_nut_with_tobacco';
ALTER TYPE "hbcr.habit_enum" ADD VALUE IF NOT EXISTS 'betel_nut_without_tobacco';

-- Migrate existing data
UPDATE "hbcr.patient_habits" SET "habit" = 'smokeless' WHERE "habit" = 'smokeless_tobacco';
UPDATE "hbcr.patient_habits" SET "habit" = 'betel_nut_with_tobacco' WHERE "habit" = 'betel_nut';

-- Remove old values (requires creating a new enum type in PostgreSQL)
-- Since PG doesn't support DROP VALUE, we recreate the enum
-- Step 1: Create new clean enum
CREATE TYPE "hbcr.habit_enum_new" AS ENUM ('smoking', 'smokeless', 'betel_nut_with_tobacco', 'betel_nut_without_tobacco', 'alcohol');

-- Step 2: Change column type
ALTER TABLE "hbcr.patient_habits" ALTER COLUMN "habit" TYPE "hbcr.habit_enum_new" USING "habit"::text::"hbcr.habit_enum_new";

-- Step 3: Drop old type and rename new
ALTER TYPE "hbcr.habit_enum" RENAME TO "hbcr.habit_enum_old";
ALTER TYPE "hbcr.habit_enum_new" RENAME TO "hbcr.habit_enum";
DROP TYPE "hbcr.habit_enum_old";


-- 2. MaritalStatus enum: add SEPARATED, OTHER, UNKNOWN
ALTER TYPE "hbcr.marital_status_enum" ADD VALUE IF NOT EXISTS 'separated' AFTER 'divorced';
ALTER TYPE "hbcr.marital_status_enum" ADD VALUE IF NOT EXISTS 'other' AFTER 'separated';
ALTER TYPE "hbcr.marital_status_enum" ADD VALUE IF NOT EXISTS 'unknown' AFTER 'other';


-- 3. Add new text fields to registrations table
ALTER TABLE "hbcr.registrations" ADD COLUMN "marital_status_other" VARCHAR(128);
ALTER TABLE "hbcr.registrations" ADD COLUMN "case_registered_through_other" VARCHAR(128);
