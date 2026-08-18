-- Add new Step 1 registration form fields:
--   * registrations.reference_no
--   * registrations.hospital_registration_no_type (dropdown for field 4)
--   * registrations.referral_facility_pincode (referral "Other Hospital" section)
--   * patients.health_scheme_beneficiary / health_scheme_details (field 13)
--   * patient_addresses.urban_rural / ward_no (field 15)
--   * new enum values: case_through_enum 'unknown_person', relationship_enum 'other'
-- All columns are nullable so pre-existing rows survive; new values are added
-- to the enums via ALTER TYPE (Prisma enum naming convention from init).

-- Registration: Reference No. (field 1), hospital reg no type (field 4),
-- referral facility pincode (field 7)
ALTER TABLE "hbcr.registrations" ADD COLUMN "reference_no" VARCHAR(64);
ALTER TABLE "hbcr.registrations" ADD COLUMN "hospital_registration_no_type" VARCHAR(64);
ALTER TABLE "hbcr.registrations" ADD COLUMN "referral_facility_pincode" VARCHAR(6);

-- Case Registered Through: add "Unknown Person" (field 6)
ALTER TYPE "hbcr.case_through_enum" ADD VALUE IF NOT EXISTS 'unknown_person';

-- Relative details: add "Other" relationship (field 14)
ALTER TYPE "hbcr.relationship_enum" ADD VALUE IF NOT EXISTS 'other';

-- Patient: Beneficiary of Health Scheme (field 13)
ALTER TABLE "hbcr.patients" ADD COLUMN "health_scheme_beneficiary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "hbcr.patients" ADD COLUMN "health_scheme_details" VARCHAR(255);

-- Address: Urban / Rural + Ward No. (field 15)
CREATE TYPE "hbcr.urban_rural_enum" AS ENUM ('urban', 'rural');
ALTER TABLE "hbcr.patient_addresses" ADD COLUMN "urban_rural" "hbcr.urban_rural_enum";
ALTER TABLE "hbcr.patient_addresses" ADD COLUMN "ward_no" VARCHAR(32);
