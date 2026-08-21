-- =============================================================
-- Dummy patient data for Hospital 1 (AIIMS New Delhi, code 961)
-- and Hospital 2 (Tata Memorial Hospital, code 962)
-- =============================================================
BEGIN;

-- ========================
-- HOSPITAL 1 — AIIMS Delhi (3 patients)
-- ========================

-- Patient 1: Anita Sharma (Completed)
INSERT INTO "hbcr.patients" (id, full_name, first_name, middle_name, last_name, age, date_of_birth, gender, health_scheme_beneficiary, health_scheme_details, created_at)
VALUES (1, 'Anita Sharma', 'Anita', NULL, 'Sharma', 54, '1972-03-15', 'female', false, NULL, NOW());

INSERT INTO "hbcr.patient_identifications" (patient_id, id_type, number)
VALUES (1, 'aadhaar', '234567890123');

INSERT INTO "hbcr.registrations" (id, patient_id, hbcr_registration_no, hospital_id, reference_no, department_name, hospital_registration_no, date_of_reporting, case_registered_through, referral_type, referral_facility_name, referral_facility_city, status, form_completed_by, form_completion_date, created_by_user_id, created_at)
VALUES (1, 1, 'HBCR-2026-0001', 1, '96100001', 'Oncology', 'MRD-2026-0451', '2026-08-01', 'out_patient', 'screen_detected', NULL, NULL, 'completed', 'Dr. A. Srinivasan', '2026-08-01', 1, NOW());

INSERT INTO "hbcr.pathological_diagnoses" (registration_id, icd10_site, primary_tumor_site, morphology)
VALUES (1, 'C50.9', 'Breast, unspecified', 'Invasive ductal carcinoma');

-- Patient 2: Rajesh Kumar (Active, referred from another hospital)
INSERT INTO "hbcr.patients" (id, full_name, first_name, middle_name, last_name, age, date_of_birth, gender, health_scheme_beneficiary, health_scheme_details, created_at)
VALUES (2, 'Rajesh Kumar', 'Rajesh', NULL, 'Kumar', 62, '1964-07-22', 'male', true, 'Ayushman Bharat', NOW());

INSERT INTO "hbcr.patient_identifications" (patient_id, id_type, number)
VALUES (2, 'aadhaar', '345678901234');

INSERT INTO "hbcr.registrations" (id, patient_id, hbcr_registration_no, hospital_id, reference_no, department_name, hospital_registration_no, date_of_reporting, case_registered_through, referral_type, referral_facility_name, referral_facility_city, status, form_completed_by, form_completion_date, created_by_user_id, created_at)
VALUES (2, 2, 'HBCR-2026-0002', 1, '96100002', 'Oncology', 'MRD-2026-0452', '2026-08-05', 'in_patient_elective', 'other_hospital', 'City Hospital Lucknow', 'Lucknow', 'active', 'Dr. A. Srinivasan', '2026-08-05', 1, NOW());

INSERT INTO "hbcr.pathological_diagnoses" (registration_id, icd10_site, primary_tumor_site, morphology)
VALUES (2, 'C34.9', 'Lung, unspecified', 'Non-small cell lung carcinoma');

-- Patient 3: Meena Patel (Pending, self-referral)
INSERT INTO "hbcr.patients" (id, full_name, first_name, middle_name, last_name, age, date_of_birth, gender, health_scheme_beneficiary, health_scheme_details, created_at)
VALUES (3, 'Meena Patel', 'Meena', NULL, 'Patel', 45, '1981-11-03', 'female', false, NULL, NOW());

INSERT INTO "hbcr.patient_identifications" (patient_id, id_type, number)
VALUES (3, 'aadhaar', '456789012345');

INSERT INTO "hbcr.registrations" (id, patient_id, hbcr_registration_no, hospital_id, reference_no, department_name, hospital_registration_no, date_of_reporting, case_registered_through, referral_type, referral_facility_name, referral_facility_city, status, form_completed_by, form_completion_date, created_by_user_id, created_at)
VALUES (3, 3, 'HBCR-2026-0003', 1, '96100003', 'Oncology', 'MRD-2026-0460', '2026-08-10', 'out_patient', 'self', NULL, NULL, 'pending', 'Dr. A. Srinivasan', '2026-08-10', 1, NOW());

INSERT INTO "hbcr.pathological_diagnoses" (registration_id, icd10_site, primary_tumor_site, morphology)
VALUES (3, 'C50.1', 'Right breast, central', 'Ductal carcinoma in situ');

-- ========================
-- HOSPITAL 2 — Tata Memorial (4 patients)
-- ========================

-- Patient 4: Suresh Nair (Completed)
INSERT INTO "hbcr.patients" (id, full_name, first_name, middle_name, last_name, age, date_of_birth, gender, health_scheme_beneficiary, health_scheme_details, created_at)
VALUES (4, 'Suresh Nair', 'Suresh', NULL, 'Nair', 70, '1956-01-18', 'male', true, 'Ayushman Bharat', NOW());

INSERT INTO "hbcr.patient_identifications" (patient_id, id_type, number)
VALUES (4, 'aadhaar', '567890123456');

INSERT INTO "hbcr.registrations" (id, patient_id, hbcr_registration_no, hospital_id, reference_no, department_name, hospital_registration_no, date_of_reporting, case_registered_through, referral_type, referral_facility_name, referral_facility_city, status, form_completed_by, form_completion_date, created_by_user_id, created_at)
VALUES (4, 4, 'HBCR-2026-0004', 2, '96200001', 'Surgical Oncology', 'TMC-2026-1101', '2026-08-02', 'in_patient_elective', 'self', NULL, NULL, 'completed', 'Dr. P. Mehta', '2026-08-02', 2, NOW());

INSERT INTO "hbcr.pathological_diagnoses" (registration_id, icd10_site, primary_tumor_site, morphology)
VALUES (4, 'C61', 'Prostate gland', 'Adenocarcinoma, Gleason score 7');

-- Patient 5: Fatima Begum (Active, screen-detected)
INSERT INTO "hbcr.patients" (id, full_name, first_name, middle_name, last_name, age, date_of_birth, gender, health_scheme_beneficiary, health_scheme_details, created_at)
VALUES (5, 'Fatima Begum', 'Fatima', NULL, 'Begum', 49, '1977-05-30', 'female', false, NULL, NOW());

INSERT INTO "hbcr.patient_identifications" (patient_id, id_type, number)
VALUES (5, 'aadhaar', '678901234567');

INSERT INTO "hbcr.registrations" (id, patient_id, hbcr_registration_no, hospital_id, reference_no, department_name, hospital_registration_no, date_of_reporting, case_registered_through, referral_type, referral_facility_name, referral_facility_city, status, form_completed_by, form_completion_date, created_by_user_id, created_at)
VALUES (5, 5, 'HBCR-2026-0005', 2, '96200002', 'Gynecologic Oncology', 'TMC-2026-1115', '2026-08-07', 'out_patient', 'screen_detected', NULL, NULL, 'active', 'Dr. P. Mehta', '2026-08-07', 2, NOW());

INSERT INTO "hbcr.pathological_diagnoses" (registration_id, icd10_site, primary_tumor_site, morphology)
VALUES (5, 'C53.9', 'Cervix uteri, unspecified', 'Squamous cell carcinoma');

-- Patient 6: Vikram Singh (Pending, referred from another hospital)
INSERT INTO "hbcr.patients" (id, full_name, first_name, middle_name, last_name, age, date_of_birth, gender, health_scheme_beneficiary, health_scheme_details, created_at)
VALUES (6, 'Vikram Singh', 'Vikram', 'R.', 'Singh', 58, '1968-09-12', 'male', false, NULL, NOW());

INSERT INTO "hbcr.patient_identifications" (patient_id, id_type, number)
VALUES (6, 'aadhaar', '789012345678');

INSERT INTO "hbcr.registrations" (id, patient_id, hbcr_registration_no, hospital_id, reference_no, department_name, hospital_registration_no, date_of_reporting, case_registered_through, referral_type, referral_facility_name, referral_facility_city, status, form_completed_by, form_completion_date, created_by_user_id, created_at)
VALUES (6, 6, 'HBCR-2026-0006', 2, '96200003', 'Head & Neck Oncology', 'TMC-2026-1128', '2026-08-12', 'in_patient_emergency', 'other_hospital', 'Regional Cancer Centre', 'Nagpur', 'pending', 'Dr. P. Mehta', '2026-08-12', 2, NOW());

INSERT INTO "hbcr.pathological_diagnoses" (registration_id, icd10_site, primary_tumor_site, morphology)
VALUES (6, 'C06.9', 'Other and unspecified parts of mouth', 'Squamous cell carcinoma, grade II');

-- Patient 7: Lakshmi Iyer (Completed, referred from another hospital)
INSERT INTO "hbcr.patients" (id, full_name, first_name, middle_name, last_name, age, date_of_birth, gender, health_scheme_beneficiary, health_scheme_details, created_at)
VALUES (7, 'Lakshmi Iyer', 'Lakshmi', NULL, 'Iyer', 65, '1961-04-08', 'female', true, 'CGHS', NOW());

INSERT INTO "hbcr.patient_identifications" (patient_id, id_type, number)
VALUES (7, 'aadhaar', '890123456789');

INSERT INTO "hbcr.registrations" (id, patient_id, hbcr_registration_no, hospital_id, reference_no, department_name, hospital_registration_no, date_of_reporting, case_registered_through, referral_type, referral_facility_name, referral_facility_city, status, form_completed_by, form_completion_date, created_by_user_id, created_at)
VALUES (7, 7, 'HBCR-2026-0007', 2, '96200004', 'Gastrointestinal Oncology', 'TMC-2026-1140', '2026-08-15', 'out_patient', 'other_hospital', 'General Hospital Pune', 'Pune', 'completed', 'Dr. P. Mehta', '2026-08-15', 2, NOW());

INSERT INTO "hbcr.pathological_diagnoses" (registration_id, icd10_site, primary_tumor_site, morphology)
VALUES (7, 'C18.9', 'Colon, unspecified', 'Adenocarcinoma, moderately differentiated');

-- ========================
-- Update hospital sequences
-- ========================
UPDATE "hbcr.hospital_sequences" SET next_sequence = 4, updated_at = NOW() WHERE hospital_id = 1;
UPDATE "hbcr.hospital_sequences" SET next_sequence = 5, updated_at = NOW() WHERE hospital_id = 2;

-- Reset serial sequences
SELECT setval(pg_get_serial_sequence('"hbcr.patients"', 'id'), 7, true);
SELECT setval(pg_get_serial_sequence('"hbcr.registrations"', 'id'), 7, true);
SELECT setval(pg_get_serial_sequence('"hbcr.pathological_diagnoses"', 'id'), 7, true);
SELECT setval(pg_get_serial_sequence('"hbcr.patient_identifications"', 'id'), 7, true);

COMMIT;
