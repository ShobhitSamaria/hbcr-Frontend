-- Step 2 Field 23 - ICD-O-3 coding sub-fields.
CREATE TYPE "hbcr.histological_grade_enum" AS ENUM ('grade_i', 'grade_ii', 'grade_iii', 'grade_iv');

ALTER TABLE "hbcr.pathological_diagnoses"
  ADD COLUMN "topography_site" VARCHAR(128),
  ADD COLUMN "histology_morphology" VARCHAR(128),
  ADD COLUMN "morphology_grade" "hbcr.histological_grade_enum",
  ADD COLUMN "secondary_site_code" VARCHAR(64),
  ADD COLUMN "metastasis_morphology_code" VARCHAR(64),
  ADD COLUMN "metastasis_morphology_grade" "hbcr.histological_grade_enum";
