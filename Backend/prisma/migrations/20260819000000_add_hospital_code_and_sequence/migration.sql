-- Add hospital code column and hospital_sequences table for Reference Number generation.
-- Reference Number = Hospital Code + 5-digit sequence (e.g. 96100001)
-- Registration Number = last 2 digits of year + last 5 digits of reference (e.g. 2600001)

-- 1. Add 'code' column to hospitals table
ALTER TABLE "hbcr.hospitals" ADD COLUMN "code" VARCHAR(16);
-- Set unique constraint
ALTER TABLE "hbcr.hospitals" ADD CONSTRAINT "hospitals_code_key" UNIQUE ("code");
-- Backfill existing hospitals with codes
UPDATE "hbcr.hospitals" SET "code" = '961' WHERE "id" = 1;
UPDATE "hbcr.hospitals" SET "code" = '962' WHERE "id" = 2;
-- Make NOT NULL after backfill
ALTER TABLE "hbcr.hospitals" ALTER COLUMN "code" SET NOT NULL;

-- 2. Create hospital_sequences table
CREATE TABLE "hbcr.hospital_sequences" (
    "id" SERIAL PRIMARY KEY,
    "hospital_id" INTEGER NOT NULL,
    "next_sequence" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "hospital_sequences_hospital_id_key" UNIQUE ("hospital_id"),
    CONSTRAINT "hospital_sequences_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hbcr.hospitals"("id") ON DELETE CASCADE
);

-- 3. Seed initial sequence rows for existing hospitals
INSERT INTO "hbcr.hospital_sequences" ("hospital_id", "next_sequence") VALUES (1, 1) ON CONFLICT DO NOTHING;
INSERT INTO "hbcr.hospital_sequences" ("hospital_id", "next_sequence") VALUES (2, 1) ON CONFLICT DO NOTHING;
