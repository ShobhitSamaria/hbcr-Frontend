-- CreateEnum
CREATE TYPE "hbcr.follow_up_method_enum" AS ENUM ('hospital_visit', 'post_email', 'telephone', 'house_visit', 'public_database', 'special_survey_study', 'others');

-- CreateEnum
CREATE TYPE "hbcr.vital_status_enum" AS ENUM ('alive', 'dead', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.disease_status_enum" AS ENUM ('no_evidence_of_disease', 'ned_second_primary_present', 'ned_other_illness', 'cancer_regression_residual', 'cancer_progression_recurrence', 'too_advanced_cachexia', 'ned_on_chemo_hormonal', 'others', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.place_of_death_enum" AS ENUM ('ri', 'other_hospital', 'residence', 'others', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.death_info_source_enum" AS ENUM ('civil_registration', 'burial_cremation', 'voter_list', 'aadhaar', 'census', 'abdm', 'others', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.follow_up_modality_enum" AS ENUM ('surgery', 'radiotherapy', 'chemotherapy', 'hormone_therapy', 'targeted_therapy', 'others');

-- CreateEnum
CREATE TYPE "hbcr.icdo_entry_kind_enum" AS ENUM ('topography', 'morphology');

-- AlterEnum
ALTER TYPE "hbcr.id_type_enum" ADD VALUE 'pan_card';

-- DropForeignKey
ALTER TABLE "hbcr.hospital_sequences" DROP CONSTRAINT "hospital_sequences_hospital_id_fkey";

-- AlterTable
ALTER TABLE "hbcr.hospital_sequences" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "hbcr.registrations" ADD COLUMN     "contact_number" VARCHAR(15),
ADD COLUMN     "designation" VARCHAR(128);

-- AlterTable
ALTER TABLE "hbcr.treatments" ADD COLUMN     "staging_system_value" VARCHAR(512),
ALTER COLUMN "composite_stage" SET DATA TYPE VARCHAR(256);

-- CreateTable
CREATE TABLE "hbcr.follow_ups" (
    "id" SERIAL NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "visit_no" SMALLINT NOT NULL,
    "date_of_follow_up" DATE NOT NULL,
    "method_of_follow_up" "hbcr.follow_up_method_enum" NOT NULL,
    "vital_status" "hbcr.vital_status_enum" NOT NULL,
    "disease_status" "hbcr.disease_status_enum",
    "date_of_first_recurrence" DATE,
    "treatment_given" BOOLEAN,
    "treatment_type" "hbcr.treatment_type_enum",
    "date_of_death" DATE,
    "place_of_death" "hbcr.place_of_death_enum",
    "source_of_death_info" "hbcr.death_info_source_enum",
    "cause_ia" VARCHAR(255),
    "cause_ib" VARCHAR(255),
    "cause_ic" VARCHAR(255),
    "cause_ii" VARCHAR(255),
    "icd10_ucod" VARCHAR(16),
    "major_cause_group_ucod" VARCHAR(128),
    "form_completed_by" VARCHAR(255),
    "date_of_completion" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hbcr.follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.follow_up_treatments" (
    "id" SERIAL NOT NULL,
    "follow_up_id" INTEGER NOT NULL,
    "modality" "hbcr.follow_up_modality_enum" NOT NULL,
    "start_date" DATE,
    "end_date" DATE,

    CONSTRAINT "hbcr.follow_up_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.icdo_topography" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(8) NOT NULL,
    "term" VARCHAR(255) NOT NULL,
    "synonyms" TEXT[],
    "sub_site_lead_in" VARCHAR(255),
    "sub_sites" TEXT[],
    "group_code" VARCHAR(16),
    "group_name" VARCHAR(500),
    "group_note" VARCHAR(255),
    "sort_order" SMALLINT NOT NULL,

    CONSTRAINT "hbcr.icdo_topography_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.icdo_morphology" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(8) NOT NULL,
    "term" VARCHAR(255) NOT NULL,
    "synonyms" TEXT[],
    "behavior" SMALLINT,
    "site_restriction" VARCHAR(255),
    "is_obsolete" BOOLEAN NOT NULL DEFAULT false,
    "group_code" VARCHAR(16),
    "group_name" VARCHAR(255),
    "sort_order" SMALLINT NOT NULL,

    CONSTRAINT "hbcr.icdo_morphology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.icdo_index_entries" (
    "id" SERIAL NOT NULL,
    "headword" VARCHAR(255) NOT NULL,
    "term" VARCHAR(255) NOT NULL,
    "code" VARCHAR(16),
    "kind" "hbcr.icdo_entry_kind_enum",
    "site_restriction" VARCHAR(255),
    "see_also" TEXT[],
    "is_obsolete" BOOLEAN NOT NULL DEFAULT false,
    "page" SMALLINT NOT NULL,
    "letter" VARCHAR(1) NOT NULL,
    "sub_headword" VARCHAR(255),
    "see_snomed" BOOLEAN NOT NULL DEFAULT false,
    "is_headword_entry" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" SMALLINT NOT NULL,

    CONSTRAINT "hbcr.icdo_index_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.icd10_ranges" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "source" VARCHAR(64) NOT NULL,
    "sort_order" SMALLINT NOT NULL,

    CONSTRAINT "hbcr.icd10_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.icd10_code_mentions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "example_no" VARCHAR(16) NOT NULL,
    "rule" VARCHAR(8) NOT NULL,
    "scenario" VARCHAR(500) NOT NULL,
    "sort_order" SMALLINT NOT NULL,

    CONSTRAINT "hbcr.icd10_code_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.icd10_rules" (
    "id" SERIAL NOT NULL,
    "rule_id" VARCHAR(8) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "text" TEXT NOT NULL,
    "source" VARCHAR(64) NOT NULL,

    CONSTRAINT "hbcr.icd10_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.icd10_examples" (
    "id" SERIAL NOT NULL,
    "example_no" VARCHAR(16) NOT NULL,
    "rule" VARCHAR(8) NOT NULL,
    "scenario" VARCHAR(500) NOT NULL,
    "result_text" VARCHAR(500) NOT NULL,
    "codes" TEXT[],

    CONSTRAINT "hbcr.icd10_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.icdo3_icd10_mapping" (
    "id" SERIAL NOT NULL,
    "icdo3_code" VARCHAR(8) NOT NULL,
    "icdo3_term" VARCHAR(255) NOT NULL,
    "icd10_code" VARCHAR(16) NOT NULL,
    "note" VARCHAR(255),
    "sort_order" SMALLINT NOT NULL,

    CONSTRAINT "hbcr.icdo3_icd10_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_follow_ups_registration" ON "hbcr.follow_ups"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.follow_ups_registration_id_visit_no_key" ON "hbcr.follow_ups"("registration_id", "visit_no");

-- CreateIndex
CREATE INDEX "idx_follow_up_treatments_follow_up" ON "hbcr.follow_up_treatments"("follow_up_id");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.follow_up_treatments_follow_up_id_modality_key" ON "hbcr.follow_up_treatments"("follow_up_id", "modality");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.icdo_topography_code_key" ON "hbcr.icdo_topography"("code");

-- CreateIndex
CREATE INDEX "idx_icdo_topo_term" ON "hbcr.icdo_topography"("term");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.icdo_morphology_code_key" ON "hbcr.icdo_morphology"("code");

-- CreateIndex
CREATE INDEX "idx_icdo_morph_term" ON "hbcr.icdo_morphology"("term");

-- CreateIndex
CREATE INDEX "idx_icdo_index_headword" ON "hbcr.icdo_index_entries"("headword");

-- CreateIndex
CREATE INDEX "idx_icdo_index_code" ON "hbcr.icdo_index_entries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.icd10_ranges_code_key" ON "hbcr.icd10_ranges"("code");

-- CreateIndex
CREATE INDEX "idx_icd10_range_title" ON "hbcr.icd10_ranges"("title");

-- CreateIndex
CREATE INDEX "idx_icd10_code_mention_code" ON "hbcr.icd10_code_mentions"("code");

-- CreateIndex
CREATE INDEX "idx_icd10_code_mention_scenario" ON "hbcr.icd10_code_mentions"("scenario");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.icd10_rules_rule_id_key" ON "hbcr.icd10_rules"("rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.icd10_examples_example_no_key" ON "hbcr.icd10_examples"("example_no");

-- CreateIndex
CREATE INDEX "idx_icd10_example_scenario" ON "hbcr.icd10_examples"("scenario");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.icdo3_icd10_mapping_icdo3_code_key" ON "hbcr.icdo3_icd10_mapping"("icdo3_code");

-- CreateIndex
CREATE INDEX "idx_icdo3_icd10_mapping_icd10_code" ON "hbcr.icdo3_icd10_mapping"("icd10_code");

-- AddForeignKey
ALTER TABLE "hbcr.hospital_sequences" ADD CONSTRAINT "hbcr.hospital_sequences_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hbcr.hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.follow_ups" ADD CONSTRAINT "hbcr.follow_ups_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "hbcr.registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.follow_up_treatments" ADD CONSTRAINT "hbcr.follow_up_treatments_follow_up_id_fkey" FOREIGN KEY ("follow_up_id") REFERENCES "hbcr.follow_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "hospital_sequences_hospital_id_key" RENAME TO "hbcr.hospital_sequences_hospital_id_key";

-- RenameIndex
ALTER INDEX "hospitals_code_key" RENAME TO "hbcr.hospitals_code_key";
