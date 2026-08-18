-- Add the Occupation field (Step 1, between Education and Habits).
ALTER TABLE "hbcr.registrations" ADD COLUMN "occupation" VARCHAR(128);
