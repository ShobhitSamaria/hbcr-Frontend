-- Split the patient's name into First / Middle / Last parts (Step 1, field 9).
-- All three are nullable so pre-existing rows (which only have full_name)
-- survive; new registrations populate full_name by joining the parts.
ALTER TABLE "hbcr.patients" ADD COLUMN "first_name" VARCHAR(100);
ALTER TABLE "hbcr.patients" ADD COLUMN "middle_name" VARCHAR(100);
ALTER TABLE "hbcr.patients" ADD COLUMN "last_name" VARCHAR(100);
