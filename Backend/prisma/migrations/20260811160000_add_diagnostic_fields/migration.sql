-- Add Step 2 diagnostic fields.
-- 1. "Was microscopic confirmation done at a later date" (Method of Diagnosis, Field 20 sub-question)
ALTER TABLE "hbcr.registrations" ADD COLUMN "microscopic_confirmation_later" BOOLEAN;

-- 2. "Date of Reporting" under Complete Pathological Diagnosis (Field 22)
ALTER TABLE "hbcr.pathological_diagnoses" ADD COLUMN "pathology_date_of_reporting" DATE;
