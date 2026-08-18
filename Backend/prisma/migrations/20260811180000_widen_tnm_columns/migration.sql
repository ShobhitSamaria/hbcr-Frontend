-- Widen TNM stage columns: the new 28(b) dropdowns include values up to
-- 10 characters (e.g. "Tis(paget)"), which exceed the old VARCHAR(8).
ALTER TABLE "hbcr.treatments"
  ALTER COLUMN "tnm_t" TYPE VARCHAR(16),
  ALTER COLUMN "tnm_n" TYPE VARCHAR(16),
  ALTER COLUMN "tnm_m" TYPE VARCHAR(16);
