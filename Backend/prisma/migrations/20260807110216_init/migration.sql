-- CreateEnum
CREATE TYPE "hbcr.gender_enum" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "hbcr.id_type_enum" AS ENUM ('aadhaar', 'abha', 'voter_id', 'passport', 'ab_pmjay', 'other');

-- CreateEnum
CREATE TYPE "hbcr.relationship_enum" AS ENUM ('father', 'mother', 'spouse');

-- CreateEnum
CREATE TYPE "hbcr.address_type_enum" AS ENUM ('residential', 'permanent');

-- CreateEnum
CREATE TYPE "hbcr.yes_no_unknown_enum" AS ENUM ('yes', 'no', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.habit_enum" AS ENUM ('smoking', 'smokeless_tobacco', 'betel_nut', 'alcohol');

-- CreateEnum
CREATE TYPE "hbcr.comorbidity_enum" AS ENUM ('tuberculosis', 'hypertension', 'diabetes', 'ischemic_heart_disease', 'copd_asthma', 'stroke', 'depression', 'hepatitis_b', 'hepatitis_c', 'nafld', 'chronic_kidney_disease', 'hiv_aids', 'hypothyroidism', 'others');

-- CreateEnum
CREATE TYPE "hbcr.case_through_enum" AS ENUM ('out_patient', 'in_patient_elective', 'in_patient_emergency', 'other');

-- CreateEnum
CREATE TYPE "hbcr.referral_type_enum" AS ENUM ('self', 'other_hospital', 'screen_detected', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.marital_status_enum" AS ENUM ('married', 'single', 'widowed', 'divorced');

-- CreateEnum
CREATE TYPE "hbcr.education_enum" AS ENUM ('not_applicable', 'illiterate', 'literate', 'primary', 'middle', 'secondary_higher_secondary', 'technical_after_matric', 'graduate_and_above', 'others', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.registration_status_enum" AS ENUM ('active', 'pending', 'completed');

-- CreateEnum
CREATE TYPE "hbcr.diagnostic_method_enum" AS ENUM ('clinical_only', 'microscopic', 'imaging', 'dco', 'other');

-- CreateEnum
CREATE TYPE "hbcr.laterality_enum" AS ENUM ('not_paired_site', 'paired_site', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.paired_laterality_enum" AS ENUM ('right', 'left', 'only_one_side', 'bilateral_unknown', 'paired_midline', 'paired_unknown');

-- CreateEnum
CREATE TYPE "hbcr.sequence_enum" AS ENUM ('one_primary', 'first_of_multiple', 'second_of_multiple', 'third_of_multiple', 'unspecified_unknown');

-- CreateEnum
CREATE TYPE "hbcr.clinical_extent_enum" AS ENUM ('in_situ_benign_pre_invasive', 'localized', 'direct_extension', 'regional_nodes', 'direct_extension_with_regional_nodes', 'distant_metastasis', 'not_applicable', 'recurrence', 'unknown_primary', 'others_specify', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.staging_system_enum" AS ENUM ('tnm', 'figo', 'ann_arbor', 'toronto_childhood', 'not_applicable', 'lugano', 'cog', 'others_specify', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.ecog_status_enum" AS ENUM ('known', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.ecog_grade_enum" AS ENUM ('grade_0', 'grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5');

-- CreateEnum
CREATE TYPE "hbcr.treatment_stage_enum" AS ENUM ('prior_registration', 'at_ri');

-- CreateEnum
CREATE TYPE "hbcr.treatment_type_enum" AS ENUM ('allopathic', 'non_allopathic', 'both');

-- CreateEnum
CREATE TYPE "hbcr.targeted_therapy_enum" AS ENUM ('tki', 'immunotherapy', 'monoclonal_antibodies', 'antibody_drug_conjugate', 'cdk46_inhibitor', 'mtor_inhibitor', 'parp_inhibitor', 'not_given', 'others_specify', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.treatment_modality_enum" AS ENUM ('surgery', 'radiotherapy_1', 'radiotherapy_2', 'chemotherapy_1', 'chemotherapy_2', 'hormone_therapy', 'targeted_therapy', 'others');

-- CreateEnum
CREATE TYPE "hbcr.intention_enum" AS ENUM ('curative', 'palliative', 'symptomatic', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.role_enum" AS ENUM ('neo_adjuvant', 'definitive', 'concurrent', 'unknown');

-- CreateEnum
CREATE TYPE "hbcr.treatment_detail_enum" AS ENUM ('completed_treatment', 'incomplete_treatment');

-- CreateEnum
CREATE TYPE "hbcr.fam_relationship_enum" AS ENUM ('same_cancer', 'other_cancer');

-- CreateEnum
CREATE TYPE "hbcr.fam_degree_enum" AS ENUM ('first_degree', 'second_degree');

-- CreateEnum
CREATE TYPE "hbcr.fam_primary_site_enum" AS ENUM ('breast', 'ovary', 'colon', 'prostate', 'endometrial', 'melanoma', 'thyroid', 'pancreas');

-- CreateTable
CREATE TABLE "hbcr.centres" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hbcr.centres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.hospitals" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "centre_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hbcr.hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.users" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(64) NOT NULL,
    "initials" VARCHAR(4) NOT NULL,
    "hospital_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hbcr.users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.patients" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "age" SMALLINT,
    "date_of_birth" DATE,
    "gender" "hbcr.gender_enum" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hbcr.patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.patient_identifications" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "id_type" "hbcr.id_type_enum" NOT NULL,
    "number" VARCHAR(64) NOT NULL,

    CONSTRAINT "hbcr.patient_identifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.patient_relatives" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "relationship" "hbcr.relationship_enum" NOT NULL,
    "name" VARCHAR(255),
    "mobile_number" VARCHAR(15),

    CONSTRAINT "hbcr.patient_relatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.patient_addresses" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "address_type" "hbcr.address_type_enum" NOT NULL,
    "flat_house_no" VARCHAR(64),
    "street_road" VARCHAR(255),
    "city" VARCHAR(64),
    "district" VARCHAR(64),
    "state" VARCHAR(64),
    "pin_code" VARCHAR(6),
    "mobile_number" VARCHAR(15),
    "email" VARCHAR(255),

    CONSTRAINT "hbcr.patient_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.patient_habits" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "habit" "hbcr.habit_enum" NOT NULL,
    "answer" "hbcr.yes_no_unknown_enum" NOT NULL DEFAULT 'no',
    "duration_months" SMALLINT,

    CONSTRAINT "hbcr.patient_habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.patient_comorbidities" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "comorbidity" "hbcr.comorbidity_enum" NOT NULL,
    "answer" "hbcr.yes_no_unknown_enum" NOT NULL DEFAULT 'no',
    "duration_months" SMALLINT,

    CONSTRAINT "hbcr.patient_comorbidities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.registrations" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "hbcr_registration_no" VARCHAR(20) NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "department_name" VARCHAR(128),
    "unit_number" VARCHAR(32),
    "hospital_registration_no" VARCHAR(64),
    "date_of_reporting" DATE,
    "case_registered_through" "hbcr.case_through_enum",
    "referral_type" "hbcr.referral_type_enum",
    "referral_facility_name" VARCHAR(255),
    "referral_facility_city" VARCHAR(64),
    "referral_facility_district" VARCHAR(64),
    "referral_facility_hospital_lab_nh" VARCHAR(255),
    "referral_facility_reg_date" DATE,
    "date_of_first_diagnosis" DATE,
    "anthropometric_height_cm" DECIMAL(5,2),
    "anthropometric_weight_kg" DECIMAL(5,2),
    "marital_status" "hbcr.marital_status_enum",
    "education" "hbcr.education_enum",
    "status" "hbcr.registration_status_enum" NOT NULL DEFAULT 'active',
    "form_completed_by" VARCHAR(255),
    "form_completion_date" DATE,
    "created_by_user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hbcr.registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.diagnostic_methods" (
    "id" SERIAL NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "method" "hbcr.diagnostic_method_enum" NOT NULL,
    "clinical_only_date" DATE,

    CONSTRAINT "hbcr.diagnostic_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.diagnostic_procedures" (
    "id" SERIAL NOT NULL,
    "diagnostic_method_id" INTEGER NOT NULL,
    "procedure_name" VARCHAR(128) NOT NULL,
    "is_others" BOOLEAN NOT NULL DEFAULT false,
    "others_specify" VARCHAR(255),
    "procedure_date" DATE,

    CONSTRAINT "hbcr.diagnostic_procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.pathological_diagnoses" (
    "id" SERIAL NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "longest_symptom_duration_months" SMALLINT,
    "anatomical_site" VARCHAR(128),
    "pathology_slide_no" VARCHAR(64),
    "primary_tumor_site" VARCHAR(128),
    "morphology" VARCHAR(128),
    "icdo_topography" VARCHAR(64),
    "icdo_morphology" VARCHAR(64),
    "secondary_site" VARCHAR(128),
    "metastasis_morphology" VARCHAR(128),
    "icd10_site" VARCHAR(64),
    "laterality" "hbcr.laterality_enum" DEFAULT 'not_paired_site',
    "paired_laterality" "hbcr.paired_laterality_enum",
    "sequence" "hbcr.sequence_enum",

    CONSTRAINT "hbcr.pathological_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.treatments" (
    "id" SERIAL NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "treatment_stage" "hbcr.treatment_stage_enum" NOT NULL,
    "treatment_given_choice" "hbcr.yes_no_unknown_enum",
    "treatment_type" "hbcr.treatment_type_enum",
    "clinical_extent_of_disease" "hbcr.clinical_extent_enum",
    "staging_system" "hbcr.staging_system_enum",
    "tnm_t" VARCHAR(8),
    "tnm_n" VARCHAR(8),
    "tnm_m" VARCHAR(8),
    "composite_stage" VARCHAR(16),
    "ecog_status" "hbcr.ecog_status_enum",
    "ecog_grade" "hbcr.ecog_grade_enum",
    "targeted_therapy_type" "hbcr.targeted_therapy_enum",
    "targeted_therapy_other_specify" VARCHAR(255),

    CONSTRAINT "hbcr.treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.treatment_modality_details" (
    "id" SERIAL NOT NULL,
    "treatment_id" INTEGER NOT NULL,
    "modality" "hbcr.treatment_modality_enum" NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "intention_to_treat" "hbcr.intention_enum",
    "role" "hbcr.role_enum",
    "details" "hbcr.treatment_detail_enum",
    "start_date" DATE,
    "end_date" DATE,
    "others_specify" VARCHAR(255),

    CONSTRAINT "hbcr.treatment_modality_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hbcr.familial_cancer_history" (
    "id" SERIAL NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "family_history" "hbcr.yes_no_unknown_enum" NOT NULL DEFAULT 'no',
    "relationship_with_cancer" "hbcr.fam_relationship_enum",
    "degree_of_relationship" "hbcr.fam_degree_enum",
    "primary_site" "hbcr.fam_primary_site_enum",
    "age_at_diagnosis" SMALLINT,
    "date_of_diagnosis" DATE,

    CONSTRAINT "hbcr.familial_cancer_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.centres_code_key" ON "hbcr.centres"("code");

-- CreateIndex
CREATE INDEX "idx_hospitals_centre" ON "hbcr.hospitals"("centre_id");

-- CreateIndex
CREATE INDEX "idx_patients_name" ON "hbcr.patients"("full_name");

-- CreateIndex
CREATE INDEX "idx_patids_value" ON "hbcr.patient_identifications"("number");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.patient_identifications_patient_id_id_type_key" ON "hbcr.patient_identifications"("patient_id", "id_type");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.patient_relatives_patient_id_relationship_key" ON "hbcr.patient_relatives"("patient_id", "relationship");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.patient_addresses_patient_id_address_type_key" ON "hbcr.patient_addresses"("patient_id", "address_type");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.patient_habits_patient_id_habit_key" ON "hbcr.patient_habits"("patient_id", "habit");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.patient_comorbidities_patient_id_comorbidity_key" ON "hbcr.patient_comorbidities"("patient_id", "comorbidity");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.registrations_hbcr_registration_no_key" ON "hbcr.registrations"("hbcr_registration_no");

-- CreateIndex
CREATE INDEX "idx_registrations_status" ON "hbcr.registrations"("status");

-- CreateIndex
CREATE INDEX "idx_registrations_hospital" ON "hbcr.registrations"("hospital_id");

-- CreateIndex
CREATE INDEX "idx_registrations_patient" ON "hbcr.registrations"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.diagnostic_methods_registration_id_method_key" ON "hbcr.diagnostic_methods"("registration_id", "method");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.diagnostic_procedures_diagnostic_method_id_procedure_n_key" ON "hbcr.diagnostic_procedures"("diagnostic_method_id", "procedure_name");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.pathological_diagnoses_registration_id_key" ON "hbcr.pathological_diagnoses"("registration_id");

-- CreateIndex
CREATE INDEX "idx_pathdx_icdo_topo" ON "hbcr.pathological_diagnoses"("icdo_topography");

-- CreateIndex
CREATE INDEX "idx_pathdx_icdo_morph" ON "hbcr.pathological_diagnoses"("icdo_morphology");

-- CreateIndex
CREATE INDEX "idx_pathdx_icd10" ON "hbcr.pathological_diagnoses"("icd10_site");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.treatments_registration_id_treatment_stage_key" ON "hbcr.treatments"("registration_id", "treatment_stage");

-- CreateIndex
CREATE INDEX "idx_treatment_modality_sel" ON "hbcr.treatment_modality_details"("treatment_id");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.treatment_modality_details_treatment_id_modality_key" ON "hbcr.treatment_modality_details"("treatment_id", "modality");

-- CreateIndex
CREATE UNIQUE INDEX "hbcr.familial_cancer_history_registration_id_key" ON "hbcr.familial_cancer_history"("registration_id");

-- AddForeignKey
ALTER TABLE "hbcr.hospitals" ADD CONSTRAINT "hbcr.hospitals_centre_id_fkey" FOREIGN KEY ("centre_id") REFERENCES "hbcr.centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.users" ADD CONSTRAINT "hbcr.users_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hbcr.hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.patient_identifications" ADD CONSTRAINT "hbcr.patient_identifications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "hbcr.patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.patient_relatives" ADD CONSTRAINT "hbcr.patient_relatives_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "hbcr.patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.patient_addresses" ADD CONSTRAINT "hbcr.patient_addresses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "hbcr.patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.patient_habits" ADD CONSTRAINT "hbcr.patient_habits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "hbcr.patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.patient_comorbidities" ADD CONSTRAINT "hbcr.patient_comorbidities_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "hbcr.patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.registrations" ADD CONSTRAINT "hbcr.registrations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "hbcr.patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.registrations" ADD CONSTRAINT "hbcr.registrations_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hbcr.hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.registrations" ADD CONSTRAINT "hbcr.registrations_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "hbcr.users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.diagnostic_methods" ADD CONSTRAINT "hbcr.diagnostic_methods_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "hbcr.registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.diagnostic_procedures" ADD CONSTRAINT "hbcr.diagnostic_procedures_diagnostic_method_id_fkey" FOREIGN KEY ("diagnostic_method_id") REFERENCES "hbcr.diagnostic_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.pathological_diagnoses" ADD CONSTRAINT "hbcr.pathological_diagnoses_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "hbcr.registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.treatments" ADD CONSTRAINT "hbcr.treatments_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "hbcr.registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.treatment_modality_details" ADD CONSTRAINT "hbcr.treatment_modality_details_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "hbcr.treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hbcr.familial_cancer_history" ADD CONSTRAINT "hbcr.familial_cancer_history_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "hbcr.registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
