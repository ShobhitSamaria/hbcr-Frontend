-- Add id_name column to PatientIdentification
ALTER TABLE "hbcr.patient_identifications" ADD COLUMN "id_name" VARCHAR(128);

-- Make number nullable (for "Other" type, name is primary identifier)
ALTER TABLE "hbcr.patient_identifications" ALTER COLUMN "number" DROP NOT NULL;

-- Add son and daughter to relationship_enum
ALTER TYPE "hbcr.relationship_enum" ADD VALUE IF NOT EXISTS 'son';
ALTER TYPE "hbcr.relationship_enum" ADD VALUE IF NOT EXISTS 'daughter';
