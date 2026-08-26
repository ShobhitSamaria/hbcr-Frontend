-- ============================================================
-- COMPLETE DUMMY PATIENT REGISTRATION FOR HOSPITAL 2
-- Hospital: Tata Memorial Hospital (id=2, code='962')
-- Centre: MH002 | Ref: 96200004 | Reg: 2600004
-- ============================================================
BEGIN;

-- 1. PATIENT
INSERT INTO "hbcr.patients" ("full_name","first_name","middle_name","last_name","age","date_of_birth","gender","health_scheme_beneficiary","health_scheme_details")
VALUES ('Anita Sharma','Anita','Kumari','Sharma',52,'1974-03-15','female'::"hbcr.gender_enum",true,'Ayushman Bharat - AB001234567890');

-- 2. IDENTIFICATIONS (7 rows)
INSERT INTO "hbcr.patient_identifications" ("patient_id","id_type","number") SELECT id,'aadhaar'::"hbcr.id_type_enum",'345678901234' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_identifications" ("patient_id","id_type","number") SELECT id,'abha'::"hbcr.id_type_enum",'12345678901234' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_identifications" ("patient_id","id_type","number") SELECT id,'pan_card'::"hbcr.id_type_enum",'ABCPM1234M' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_identifications" ("patient_id","id_type","number") SELECT id,'voter_id'::"hbcr.id_type_enum",'ABC1234567' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_identifications" ("patient_id","id_type","number") SELECT id,'passport'::"hbcr.id_type_enum",'A1234567' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_identifications" ("patient_id","id_type","number") SELECT id,'ab_pmjay'::"hbcr.id_type_enum",'ABPMJAY-987654' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_identifications" ("patient_id","id_type","number") SELECT id,'other'::"hbcr.id_type_enum",'REF-CRC-001234' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;

-- 3. RELATIVES (4 rows)
INSERT INTO "hbcr.patient_relatives" ("patient_id","relationship","name","mobile_number") SELECT id,'father'::"hbcr.relationship_enum",'Ramesh Sharma','9876543210' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_relatives" ("patient_id","relationship","name","mobile_number") SELECT id,'mother'::"hbcr.relationship_enum",'Sunita Sharma','9876543211' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_relatives" ("patient_id","relationship","name","mobile_number") SELECT id,'spouse'::"hbcr.relationship_enum",'Vikram Sharma','9876543212' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_relatives" ("patient_id","relationship","name","mobile_number") SELECT id,'other'::"hbcr.relationship_enum",'Priya Sharma (Daughter)','9876543213' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;

-- 4. ADDRESSES (2 rows)
INSERT INTO "hbcr.patient_addresses" ("patient_id","address_type","urban_rural","ward_no","flat_house_no","street_road","city","district","state","pin_code","mobile_number","email")
SELECT id,'residential'::"hbcr.address_type_enum",'urban'::"hbcr.urban_rural_enum",'12','45-B, Second Floor','MG Road, Connaught Place','New Delhi','Central Delhi','Delhi','110001','9876543210','anita.sharma@email.com' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_addresses" ("patient_id","address_type","urban_rural","ward_no","flat_house_no","street_road","city","district","state","pin_code","mobile_number","email")
SELECT id,'permanent'::"hbcr.address_type_enum",'rural'::"hbcr.urban_rural_enum",'05','House No. 23','Gandhi Nagar','Sonipat','Sonipat','Haryana','131001','9876543214','anita.sharma@email.com' FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;

-- 5. HABITS (5 rows)
INSERT INTO "hbcr.patient_habits" ("patient_id","habit","answer","duration_months") SELECT id,'smoking'::"hbcr.habit_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_habits" ("patient_id","habit","answer","duration_months") SELECT id,'smokeless'::"hbcr.habit_enum",'yes'::"hbcr.yes_no_unknown_enum",120 FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_habits" ("patient_id","habit","answer","duration_months") SELECT id,'betel_nut_with_tobacco'::"hbcr.habit_enum",'yes'::"hbcr.yes_no_unknown_enum",60 FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_habits" ("patient_id","habit","answer","duration_months") SELECT id,'betel_nut_without_tobacco'::"hbcr.habit_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_habits" ("patient_id","habit","answer","duration_months") SELECT id,'alcohol'::"hbcr.habit_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;

-- 6. COMORBIDITIES (14 rows)
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'tuberculosis'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'hypertension'::"hbcr.comorbidity_enum",'yes'::"hbcr.yes_no_unknown_enum",120 FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'diabetes'::"hbcr.comorbidity_enum",'yes'::"hbcr.yes_no_unknown_enum",72 FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'ischemic_heart_disease'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'copd_asthma'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'stroke'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'depression'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'hepatitis_b'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'hepatitis_c'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'nafld'::"hbcr.comorbidity_enum",'yes'::"hbcr.yes_no_unknown_enum",36 FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'chronic_kidney_disease'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'hiv_aids'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'hypothyroidism'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;
INSERT INTO "hbcr.patient_comorbidities" ("patient_id","comorbidity","answer","duration_months") SELECT id,'others'::"hbcr.comorbidity_enum",'no'::"hbcr.yes_no_unknown_enum",NULL FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;

-- 7. REGISTRATION (correct enum values)
INSERT INTO "hbcr.registrations" ("patient_id","hbcr_registration_no","hospital_id","reference_no","department_name","unit_number","hospital_registration_no","hospital_registration_no_type","date_of_reporting","case_registered_through","referral_type","referral_facility_name","referral_facility_hospital_lab_nh","referral_facility_city","referral_facility_district","referral_facility_pincode","referral_facility_reg_date","date_of_first_diagnosis","microscopic_confirmation_later","anthropometric_height_cm","anthropometric_weight_kg","marital_status","education","occupation","status","form_completed_by","form_completion_date","remarks","contact_number","designation","created_by_user_id")
SELECT id,'2600004',2,'96200004','Medical Oncology','Unit 02','MRD-TMH-2026-4567','MRD','2026-07-15','out_patient'::"hbcr.case_through_enum",'other_hospital'::"hbcr.referral_type_enum",'Apollo Hospital Delhi','Private Hospital','New Delhi','New Delhi','110020','2026-06-10','2026-05-20',false,158.50,62.30,'married'::"hbcr.marital_status_enum",'secondary_higher_secondary'::"hbcr.education_enum",'Homemaker','active'::"hbcr.registration_status_enum",'NURSE PRIYA VERMA','2026-08-20','Patient presented with right breast lump. Biopsy confirmed invasive ductal carcinoma. Referred from Apollo Hospital for further management.','9876543210','Senior Nurse',2
FROM "hbcr.patients" WHERE "full_name"='Anita Sharma' ORDER BY id DESC LIMIT 1;

-- 8. PATHOLOGICAL DIAGNOSIS
INSERT INTO "hbcr.pathological_diagnoses" ("registration_id","longest_symptom_duration_months","anatomical_site","pathology_slide_no","primary_tumor_site","morphology","icdo_topography","topography_site","icdo_morphology","histology_morphology","morphology_grade","secondary_site","secondary_site_code","icd10_site","laterality","paired_laterality","sequence","pathology_date_of_reporting")
SELECT id,3,'Right breast','PATH-2026-7890','Right breast, upper outer quadrant','Invasive ductal carcinoma','C50.1','Right breast, upper outer quadrant','8500/3','Invasive ductal carcinoma, NOS','grade_ii'::"hbcr.histological_grade_enum",'Right axillary lymph nodes','C77.3','C50.1','paired_site'::"hbcr.laterality_enum",'right'::"hbcr.paired_laterality_enum",'one_primary'::"hbcr.sequence_enum",'2026-06-25'
FROM "hbcr.registrations" WHERE "hbcr_registration_no"='2600004';

-- 9. DIAGNOSTIC METHODS + PROCEDURES
INSERT INTO "hbcr.diagnostic_methods" ("registration_id","method","clinical_only_date") SELECT id,'microscopic'::"hbcr.diagnostic_method_enum",NULL FROM "hbcr.registrations" WHERE "hbcr_registration_no"='2600004';
INSERT INTO "hbcr.diagnostic_methods" ("registration_id","method","clinical_only_date") SELECT id,'imaging'::"hbcr.diagnostic_method_enum",NULL FROM "hbcr.registrations" WHERE "hbcr_registration_no"='2600004';
INSERT INTO "hbcr.diagnostic_procedures" ("diagnostic_method_id","procedure_name","is_others","procedure_date") VALUES ((SELECT dm.id FROM "hbcr.diagnostic_methods" dm JOIN "hbcr.registrations" r ON r.id=dm.registration_id WHERE r."hbcr_registration_no"='2600004' AND dm."method"='microscopic'::"hbcr.diagnostic_method_enum"),'FNAC',false,'2026-05-25');
INSERT INTO "hbcr.diagnostic_procedures" ("diagnostic_method_id","procedure_name","is_others","procedure_date") VALUES ((SELECT dm.id FROM "hbcr.diagnostic_methods" dm JOIN "hbcr.registrations" r ON r.id=dm.registration_id WHERE r."hbcr_registration_no"='2600004' AND dm."method"='microscopic'::"hbcr.diagnostic_method_enum"),'Core Needle Biopsy',false,'2026-05-28');
INSERT INTO "hbcr.diagnostic_procedures" ("diagnostic_method_id","procedure_name","is_others","procedure_date") VALUES ((SELECT dm.id FROM "hbcr.diagnostic_methods" dm JOIN "hbcr.registrations" r ON r.id=dm.registration_id WHERE r."hbcr_registration_no"='2600004' AND dm."method"='imaging'::"hbcr.diagnostic_method_enum"),'Mammography',false,'2026-05-22');
INSERT INTO "hbcr.diagnostic_procedures" ("diagnostic_method_id","procedure_name","is_others","procedure_date") VALUES ((SELECT dm.id FROM "hbcr.diagnostic_methods" dm JOIN "hbcr.registrations" r ON r.id=dm.registration_id WHERE r."hbcr_registration_no"='2600004' AND dm."method"='imaging'::"hbcr.diagnostic_method_enum"),'CT Scan',false,'2026-06-01');

-- 10. TREATMENT (AT_RI)
INSERT INTO "hbcr.treatments" ("registration_id","treatment_stage","treatment_given_choice","treatment_type","clinical_extent_of_disease","staging_system","staging_system_value","tnm_t","tnm_n","tnm_m","composite_stage","ecog_status","ecog_grade")
SELECT id,'at_ri'::"hbcr.treatment_stage_enum",'yes'::"hbcr.yes_no_unknown_enum",'allopathic'::"hbcr.treatment_type_enum",'direct_extension_with_regional_nodes'::"hbcr.clinical_extent_enum",'tnm'::"hbcr.staging_system_enum",'AJCC 8th Edition','T2','N1','M0','Stage IIB','known'::"hbcr.ecog_status_enum",'grade_2'::"hbcr.ecog_grade_enum"
FROM "hbcr.registrations" WHERE "hbcr_registration_no"='2600004';

-- 11. FAMILY HISTORY
INSERT INTO "hbcr.familial_cancer_history" ("registration_id","family_history","relationship_with_cancer","degree_of_relationship","primary_site","age_at_diagnosis","date_of_diagnosis")
SELECT id,'yes'::"hbcr.yes_no_unknown_enum",'other_cancer'::"hbcr.fam_relationship_enum",'first_degree'::"hbcr.fam_degree_enum",'breast'::"hbcr.fam_primary_site_enum",55,'2015-08-20'
FROM "hbcr.registrations" WHERE "hbcr_registration_no"='2600004';

-- 12. UPDATE SEQUENCE
UPDATE "hbcr.hospital_sequences" SET "next_sequence"=5,"updated_at"=NOW() WHERE "hospital_id"=2;

COMMIT;

-- VERIFICATION
SELECT 'PATIENT' AS t, id, full_name, age, gender FROM "hbcr.patients" WHERE "full_name"='Anita Sharma';
SELECT 'REG' AS t, reference_no, hbcr_registration_no, hospital_id, status, remarks FROM "hbcr.registrations" WHERE "hbcr_registration_no"='2600004';
SELECT 'IDS' AS t, id_type, number FROM "hbcr.patient_identifications" p JOIN "hbcr.patients" pt ON pt.id=p.patient_id WHERE pt."full_name"='Anita Sharma';
SELECT 'REL' AS t, relationship, name, mobile_number FROM "hbcr.patient_relatives" r JOIN "hbcr.patients" pt ON pt.id=r.patient_id WHERE pt."full_name"='Anita Sharma';
SELECT 'HAB' AS t, habit, answer, duration_months FROM "hbcr.patient_habits" h JOIN "hbcr.patients" pt ON pt.id=h.patient_id WHERE pt."full_name"='Anita Sharma';
SELECT 'COM' AS t, comorbidity, answer, duration_months FROM "hbcr.patient_comorbidities" c JOIN "hbcr.patients" pt ON pt.id=c.patient_id WHERE pt."full_name"='Anita Sharma';
SELECT 'PATH' AS t, anatomical_site, icdo_topography, icd10_site, morphology_grade FROM "hbcr.pathological_diagnoses" pd JOIN "hbcr.registrations" r ON r.id=pd.registration_id WHERE r."hbcr_registration_no"='2600004';
SELECT 'TREAT' AS t, treatment_stage, treatment_type, tnm_t, tnm_n, tnm_m, composite_stage FROM "hbcr.treatments" t JOIN "hbcr.registrations" r ON r.id=t.registration_id WHERE r."hbcr_registration_no"='2600004';
SELECT 'FAM' AS t, family_history, relationship_with_cancer, primary_site FROM "hbcr.familial_cancer_history" f JOIN "hbcr.registrations" r ON r.id=f.registration_id WHERE r."hbcr_registration_no"='2600004';
SELECT 'SEQ' AS t, hospital_id, next_sequence FROM "hbcr.hospital_sequences" WHERE hospital_id=2;
