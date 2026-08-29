-- MakeDraftFieldsRequired: Ensure patientName and aadhaar have defaults for existing NULL rows
-- then remove the nullable constraint

-- Set defaults for any existing NULL rows
UPDATE "hbcr.drafts" SET "patient_name" = 'Unnamed Draft' WHERE "patient_name" IS NULL;
UPDATE "hbcr.drafts" SET "aadhaar" = '' WHERE "aadhaar" IS NULL;

-- Alter columns to NOT NULL
ALTER TABLE "hbcr.drafts" ALTER COLUMN "patient_name" SET NOT NULL;
ALTER TABLE "hbcr.drafts" ALTER COLUMN "aadhaar" SET NOT NULL;
