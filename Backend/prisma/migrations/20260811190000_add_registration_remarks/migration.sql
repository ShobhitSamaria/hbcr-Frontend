-- Step 3 field: Remarks (free text next to 32. Date of Completion of Form).
ALTER TABLE "hbcr.registrations"
  ADD COLUMN "remarks" VARCHAR(1000);
