# HBCR Cancer Registry — Complete Application Documentation

> **Generated from actual codebase analysis — August 2026**
> Covers: Patient Form (33 fields), Database Schema, Application Architecture, System Design

---

## Table of Contents

1. [Patient Form — 33 Field Validation](#1-patient-form--33-field-validation)
2. [Database Schema & ER Diagram](#2-database-schema--er-diagram)
3. [Complete Application Architecture](#3-complete-application-architecture)
4. [System Design](#4-system-design)

---

# 1. Patient Form — 33 Field Validation

The Patient Registration Form is divided into **3 Steps** (pages):

- **Step 1**: Identifying Information (Fields 1–19)
- **Step 2**: Diagnostic Details (Fields 20–26)
- **Step 3**: Clinical Stage & Treatment (Fields 27–34)

## Step 1 — Identifying Information

### Field 1: Department Name*

| Property | Value |
|---|---|
| **Field Key** | `"3(a). Department name"` |
| **Data Type** | String |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()` — must not be empty |
| **Backend Validation** | `z.string().min(1, "Department name is required")` |
| **Database Column** | `hbcr.registrations.department_name` VARCHAR(128) |
| **Edge Cases** | Free text input; no pattern validation |

### Field 2: Unit Number*

| Property | Value |
|---|---|
| **Field Key** | `"3(b). Unit number"` |
| **Data Type** | String |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()` — must not be empty |
| **Backend Validation** | `z.string().min(1, "Unit number is required")` |
| **Database Column** | `hbcr.registrations.unit_number` VARCHAR(32) |
| **Edge Cases** | Free text input |

### Field 3: Date of Reporting*

| Property | Value |
|---|---|
| **Field Key** | `"5. Date of reporting"` |
| **Data Type** | Date |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()`, `isDate()`, `notFutureDate()` |
| **Backend Validation** | `z.coerce.date()` |
| **Database Column** | `hbcr.registrations.date_of_reporting` DATE |
| **Edge Cases** | Must be a valid date; cannot be in the future |

### Field 4: Case Registered Through

| Property | Value |
|---|---|
| **Field Key** | `"6. Case Registered Through"` |
| **Data Type** | Enum + conditional text |
| **Required** | ✅ Yes |
| **Options** | `Out Patient`, `In Patient (Elective)`, `In Patient (Emergency)`, `Unknown`, `Other` |
| **Conditional** | When "Other" is selected → shows text field `"Case Registered Through (Other)"` |
| **Frontend Validation** | `required()`, `notEquals("Select")` |
| **Backend Validation** | `z.nativeEnum(CaseThrough)` |
| **Database Column** | `hbcr.registrations.case_registered_through` ENUM; `case_registered_through_other` VARCHAR(128) |
| **Edge Cases** | "Other" text field must be filled when selected |

### Field 5: Type of Referral

| Property | Value |
|---|---|
| **Field Key** | `"7. Type of Referral"` |
| **Data Type** | Enum + conditional fields |
| **Required** | ✅ Yes |
| **Options** | `Self`, `Other Hospital / Health Facility`, `Screen Detected Referral`, `Unknown` |
| **Conditional** | When "Other Hospital" → shows Facility Name, City, District, Pincode, Hospital/Lab Name, Reg Date fields |
| **Frontend Validation** | `required()`, `notEquals("Select")` |
| **Backend Validation** | `z.nativeEnum(ReferralType)` |
| **Database Columns** | `referral_type` ENUM, `referral_facility_name`, `referral_facility_city`, `referral_facility_district`, `referral_facility_pincode`, `referral_facility_hospital_lab_nh`, `referral_facility_reg_date` |
| **Edge Cases** | When "Other Hospital" selected, facility detail fields should be provided |

### Field 6: Date of First Diagnosis*

| Property | Value |
|---|---|
| **Field Key** | `"8. Date of first diagnosis"` |
| **Data Type** | Date |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()`, `isDate()` — NO restriction on being before reporting date |
| **Backend Validation** | `z.coerce.date()` |
| **Database Column** | `hbcr.registrations.date_of_first_diagnosis` DATE |
| **Edge Cases** | Can be earlier than Date of Reporting. No upper date limit enforced (unlike older versions) |

### Field 7: Full Name*

| Property | Value |
|---|---|
| **Field Key** | `"9. Full name"` |
| **Data Type** | String |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()`, `minLen(2)` |
| **Backend Validation** | `z.string().min(1, "Full name is required")` |
| **Database Column** | `hbcr.patients.full_name` VARCHAR(255) |
| **Edge Cases** | Also populates `first_name`, `middle_name`, `last_name` parsed from full name |

### Field 8: Department Name (Registration Number)

| Property | Value |
|---|---|
| **Field Key** | N/A — removed from form |
| **Status** | **REMOVED** — "Hospital Registration Number (MRD / CR / Unique ID)" was deleted from the form |

### Field 9: Patient Name (First / Middle / Last)

| Property | Value |
|---|---|
| **Field Key** | `"First Name"`, `"Middle Name"`, `"Last Name"` |
| **Data Type** | String (3 fields) |
| **Required** | First Name: ✅ Yes; Middle/Last: Optional |
| **Frontend Validation** | First Name: `required()` |
| **Backend Validation** | `firstName: z.string().min(1, "First name is required")` |
| **Database Columns** | `hbcr.patients.first_name` VARCHAR(100), `middle_name` VARCHAR(100), `last_name` VARCHAR(100) |
| **Edge Cases** | Parsed from full name or entered separately |

### Field 10: Age*

| Property | Value |
|---|---|
| **Field Key** | `"11. Age"` |
| **Data Type** | Integer (SmallInt) |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()`, `isInt()`, `range(0, 130)` |
| **Backend Validation** | `z.coerce.number().int().min(0).max(130)` |
| **Database Column** | `hbcr.patients.age` SMALLINT |
| **Edge Cases** | Auto-calculated from Date of Birth if provided, but also manually editable |

### Field 11: Date of Birth

| Property | Value |
|---|---|
| **Field Key** | `"10. Date of Birth"` |
| **Data Type** | Date |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()`, `isDate()` |
| **Backend Validation** | `z.coerce.date()` |
| **Database Column** | `hbcr.patients.date_of_birth` DATE |
| **Edge Cases** | Used to auto-calculate Age; can be in the past |

### Field 12: Gender*

| Property | Value |
|---|---|
| **Field Key** | `"12. Gender"` |
| **Data Type** | Enum |
| **Required** | ✅ Yes |
| **Options** | `Male`, `Female`, `Other` |
| **Frontend Validation** | `required()`, `notEquals("Select gender")` |
| **Backend Validation** | `z.nativeEnum(Gender)` |
| **Database Column** | `hbcr.patients.gender` ENUM (`male`, `female`, `other`) |
| **Edge Cases** | Must explicitly select; placeholder "Select gender" is invalid |

### Field 13: Unique Identification

| Property | Value |
|---|---|
| **Field Key** | `"13. Unique Identification"` — multiple sub-fields |
| **Data Type** | Multiple sub-fields (see below) |
| **Required** | Conditional per sub-field |

**Sub-fields:**

| ID Type | Field Key | Validation | Database |
|---|---|---|---|
| **a). Aadhaar** | `"a). Aadhaar number"` | 12 digits exactly | `patient_identifications` (type=`aadhaar`, number=`VARCHAR(64)`) |
| **b). ABHA (Health ID)** | `"b). ABHA"` | 14 digits exactly | `patient_identifications` (type=`abha`) |
| **c). PAN Card** | `"c). PAN Card number"` | 10 chars: 5 uppercase + 4 digits + 1 uppercase | `patient_identifications` (type=`pan_card`) |
| **d). Voter ID** | `"d). Voter ID number"` | Exactly 10 alphanumeric characters | `patient_identifications` (type=`voter_id`) |
| **e). Passport** | `"e). Passport number"` | Exactly 8 chars: 1 uppercase letter + 7 digits | `patient_identifications` (type=`passport`) |
| **f). AB-PMJAY** | `"f). AB-PMJAY ID"` | Required when Yes selected | `patient_identifications` (type=`ab_pmjay`) |
| **g). Other** | `"g). ID Name"` + `"g). ID Number"` | Both required when selected | `patient_identifications` (type=`other`, `id_name`=`VARCHAR(128)`) |

**Frontend**: Shows Yes/No radio for each. When Yes → input field appears. Direct input (no Yes/No radio for Aadhaar and ABHA).

**Backend**: `patient_identifications` table with unique constraint on `(patient_id, id_type)`.

### Field 14: Beneficiary of Health Scheme Details

| Property | Value |
|---|---|
| **Field Key** | `"13(b). Beneficiary of Health Scheme Details"` |
| **Data Type** | Yes/No + conditional text |
| **Required** | Conditional |
| **Database Column** | `hbcr.patients.health_scheme_beneficiary` BOOLEAN, `health_scheme_details` VARCHAR(255) |
| **Edge Cases** | When "Yes" is selected, the ID details field becomes mandatory |

### Field 15: Relative Details*

| Property | Value |
|---|---|
| **Field Key** | `"14. Father/Mother Name"`, `"14. Contact Number"`, `"14. Husband/Wife Name"`, `"14. Son/Daughter Name"` |
| **Data Type** | Multiple sub-fields |
| **Required** | Contact Number: ✅ (numbers only) |
| **Options** | Father, Mother, Spouse, Son, Daughter, Other |
| **Frontend Validation** | Contact: `pattern(/^[6-9][0-9]{9}$/)` — 10-digit mobile only |
| **Backend Validation** | `z.nativeEnum(Relationship)` per row |
| **Database Table** | `hbcr.patient_relatives` — columns: `id`, `patient_id`, `relationship` ENUM, `name` VARCHAR(255), `mobile_number` VARCHAR(15) |
| **Unique Constraint** | `(patient_id, relationship)` |
| **Edge Cases** | Contact Number accepts numbers only, not alphabets |

### Field 16: Address*

| Property | Value |
|---|---|
| **Field Key** | Multiple address fields |
| **Data Type** | Complex — two address blocks (Residential + Permanent) |
| **Required** | ✅ Yes (Urban/Rural selection mandatory) |
| **Sub-fields** | Urban/Rural radio, Ward No, Flat/House No, Street/Road, City, District, State, PIN Code, Mobile Number, Email |
| **Conditional** | Address fields only editable after Urban/Rural selection |
| **Database Table** | `hbcr.patient_addresses` — 2 rows per patient (residential + permanent) |
| **Unique Constraint** | `(patient_id, address_type)` |
| **Edge Cases** | "Residential Address is same as Permanent" checkbox copies data |

### Field 17: Duration of Stay

| Property | Value |
|---|---|
| **Field Key** | `"Duration of Stay"` (labeled "(in years)") |
| **Data Type** | String/Integer |
| **Required** | ✅ Yes |
| **Database Column** | Part of address or patient model |
| **Edge Cases** | Label must specify "(in years)" |

### Field 18: Marital Status

| Property | Value |
|---|---|
| **Field Key** | `"16. Marital Status"` |
| **Data Type** | Enum + conditional text |
| **Options** | `Married`, `Single`, `Widowed`, `Divorced`, `Separated`, `Other`, `Unknown` |
| **Conditional** | When "Other" → text field `"Marital Status (Other)"` |
| **Frontend Validation** | `required()` |
| **Backend Validation** | `z.nativeEnum(MaritalStatus)` |
| **Database Columns** | `marital_status` ENUM, `marital_status_other` VARCHAR(128) |
| **Edge Cases** | "Other" text must be provided when selected |

### Field 19: Education*

| Property | Value |
|---|---|
| **Field Key** | `"17. Education"` |
| **Data Type** | Enum + conditional text |
| **Options** | `Not Applicable`, `Illiterate`, `Literate`, `Primary`, `Middle`, `Secondary/Higher Secondary`, `Technical After Matriculation`, `Graduate and Above`, `Others`, `Unknown` |
| **Conditional** | When "Others" → text field `"Education (Other)"` |
| **Frontend Validation** | `required()` |
| **Backend Validation** | `z.nativeEnum(Education)` |
| **Database Columns** | `education` ENUM, `education_other` VARCHAR(128) |
| **Edge Cases** | Enum conversion must handle slashes: "Secondary/Higher Secondary" → `SECONDARY_HIGHER_SECONDARY` |

### Field 20: Habits (18(a))*

| Property | Value |
|---|---|
| **Field Key** | `"18(a). Habits"` — 5 sub-fields |
| **Data Type** | Array of habit records |
| **Required** | ✅ Yes (all habits must have an answer) |
| **Options per habit** | `Yes`, `No`, `Unknown` + Duration (Months) when Yes |
| **Habit Types** | Smoking, Smokeless, Betel Nut with Tobacco, Betel Nut without Tobacco, Alcohol |
| **Conditional** | When "Yes" → Duration (Months) becomes **mandatory**. When "No" → Duration disabled/cleared |
| **Frontend Validation** | Each habit: `required()`. If Yes: duration required with `isInt()`, `range(0, 32767)` |
| **Backend Validation** | `z.nativeEnum(Habit)` + `z.nativeEnum(YesNoUnknown)` + optional `durationMonths` |
| **Database Table** | `hbcr.patient_habits` — columns: `id`, `patient_id`, `habit` ENUM, `answer` ENUM, `duration_months` SMALLINT |
| **Unique Constraint** | `(patient_id, habit)` |
| **Edge Cases** | Duration must not be editable when answer is "No". Selecting "No" must clear the duration field |

### Field 21: Co-Morbidities (18(b))*

| Property | Value |
|---|---|
| **Field Key** | `"18(b). Co-Morbidities"` — 14 sub-fields |
| **Data Type** | Array of comorbidity records |
| **Required** | ✅ Yes (all must have an answer) |
| **Options per comorbidity** | `Yes`, `No`, `Unknown` + Duration (Months) when Yes |
| **Comorbidity Types** | Tuberculosis, Hypertension, Diabetes, Ischemic Heart Disease, COPD/Asthma, Stroke, Depression, Hepatitis B, Hepatitis C, NAFLD, Chronic Kidney Disease, HIV/AIDS, Hypothyroidism, Others |
| **Conditional** | Same as Habits — Duration required when Yes, disabled when No |
| **Frontend Validation** | Same pattern as Habits |
| **Backend Validation** | `z.nativeEnum(Comorbidity)` + `z.nativeEnum(YesNoUnknown)` |
| **Database Table** | `hbcr.patient_comorbidities` — same structure as habits |
| **Unique Constraint** | `(patient_id, comorbidity)` |
| **Edge Cases** | Same as Habits |

### Field 22: Relationship to Cancer / Degree of Relationship (Field 19)

| Property | Value |
|---|---|
| **Field Key** | `"19. Relationship to Cancer"` |
| **Data Type** | Complex — Yes/No/Unknown + conditional fields |
| **Required** | Conditional (visible only for specific cancer sites) |
| **Visible Only For** | Breast, Ovary, Colon, Prostate, Endometrial, Melanoma, Thyroid, Pancreas |
| **Sub-fields** | `Family History` (Yes/No/Unknown), `Relationship with Cancer` (Same Cancer/Other Cancer), `Degree of Relationship` (First Degree/Second Degree), `Primary Site` (enum), `Age at Diagnosis`, `Date of Diagnosis` |
| **Backend Validation** | `z.nativeEnum(YesNoUnknown)` + conditional sub-fields |
| **Database Table** | `hbcr.familial_cancer_history` — unique on `registration_id` |
| **Edge Cases** | Only visible when primary tumour site matches the specific cancer types listed above |

---

## Step 2 — Diagnostic Details

### Field 23: Method of Diagnosis*

| Property | Value |
|---|---|
| **Field Key** | `"20. Method of Diagnosis"` (checkboxes) |
| **Data Type** | Array of enum values |
| **Required** | ✅ Yes — at least one method must be selected |
| **Options** | `Clinical Only`, `Microscopic`, `Imaging`, `DCO`, `Other` |
| **Conditional** | Clinical Only → shows Diagnosis Date (mandatory). Microscopic → shows pathological fields (21.1–21.5, mandatory). "Was microscopic confirmation done at a later date?" → always visible, Yes/No mandatory. When "Other" selected → shows "Other diagnostic procedures" text field |
| **Database Table** | `hbcr.diagnostic_methods` — one row per selected method |
| **Edge Cases** | "Was microscopic confirmation done at a later date?" is always visible and mandatory regardless of Method selection |

### Field 24: Longest Duration of Symptom (in months)*

| Property | Value |
|---|---|
| **Field Key** | `"21. Longest duration of symptom for cancer (in months)"` |
| **Data Type** | Integer |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()`, `isInt()`, `range(0, 32767)` |
| **Backend Validation** | `z.coerce.number().int().min(0).max(32767)` |
| **Database Column** | `hbcr.pathological_diagnoses.longest_symptom_duration_months` SMALLINT |
| **Edge Cases** | Must be a valid positive integer |

### Field 25: Pathological Fields (conditional — when Microscopic selected)

| Sub-field | Key | Validation | DB Column |
|---|---|---|---|
| **21.1 Anatomical Site** | `"21.1 Anatomical Site..."` | Required if Microscopic | `anatomical_site` VARCHAR(128) |
| **21.2 Pathology Slide No** | `"21.2 Pathology Slide No"` | Optional | `pathology_slide_no` VARCHAR(64) |
| **21.3 Date of Reporting** | `"21.3 Date of Reporting"` | Required if Microscopic | `pathology_date_of_reporting` DATE |
| **21.4 Primary Site** | `"21.4 Primary Site of Tumour - Topography"` | Required if Microscopic | `primary_tumor_site` VARCHAR(128) |
| **21.5 Primary Histology** | `"21.5 Primary Histology / Morphology"` | Required if Microscopic | `histology_morphology` VARCHAR(128) |

### Field 26: ICD-O-3 Coding (23.1–23.4)

| Property | Value |
|---|---|
| **Field Key** | `"23.1 Site"`, `"23.1 Code"`, `"23.2 Morphology"`, `"23.2 Code"`, `"23.2 Grade"`, `"23.3 Site"`, `"23.3 Code"`, `"23.4 Morphology"`, `"23.4 Code"`, `"23.4 Grade"` |
| **Data Type** | Multiple string fields |
| **Required** | Optional |
| **Database Columns** | Multiple in `hbcr.pathological_diagnoses`: `icdo_topography`, `topography_site`, `icdo_morphology`, `histology_morphology`, `morphology_grade`, `secondary_site`, `secondary_site_code`, `metastasis_morphology`, `metastasis_morphology_code`, `metastasis_morphology_grade` |
| **Edge Cases** | Search from ICD-O-3 reference tables (`hbcr.icdo_topography`, `hbcr.icdo_morphology`, `hbcr.icdo_index_entries`). Must work in both local and production environments |

### Field 27: ICD-10 Site of Tumour

| Property | Value |
|---|---|
| **Field Key** | `"24. Site of Tumour (ICD-10)"` |
| **Data Type** | String (searchable dropdown) |
| **Required** | Optional |
| **Database Column** | `hbcr.pathological_diagnoses.icd10_site` VARCHAR(64) |
| **Search Source** | `hbcr.icd10_ranges`, `hbcr.icd10_code_mentions`, `hbcr.icdo3_icd10_mapping` |
| **Edge Cases** | Must work in both local and production — search from reference tables via API |

### Field 28: Laterality*

| Property | Value |
|---|---|
| **Field Key** | `"25. Laterality"` |
| **Data Type** | Enum + conditional |
| **Required** | ✅ Yes |
| **Options** | `Not a Paired Site`, `Paired Site`, `Unknown` |
| **Conditional** | When "Paired Site" → shows Paired Laterality radio (Right, Left, Only One Side, Bilateral Unknown, Paired Midline, Paired Unknown) |
| **Frontend Validation** | `required()`. When Paired Site: paired laterality also required |
| **Backend Validation** | `z.nativeEnum(Laterality)` + `z.nativeEnum(PairedLaterality)` |
| **Database Columns** | `laterality` ENUM (default `NOT_PAIRED_SITE`), `paired_laterality` ENUM |
| **Edge Cases** | Default must not be pre-selected; show "Select" placeholder |

### Field 29: Sequence

| Property | Value |
|---|---|
| **Field Key** | `"26. Sequence"` |
| **Data Type** | Enum |
| **Options** | `One Primary`, `First of Multiple`, `Second of Multiple`, `Third of Multiple`, `Unspecified/Unknown` |
| **Database Column** | `hbcr.pathological_diagnoses.sequence` ENUM |
| **Edge Cases** | Optional field |

---

## Step 3 — Clinical Stage & Treatment

### Field 30: Clinical Extent of Disease*

| Property | Value |
|---|---|
| **Field Key** | `"Clinical Extent of Disease Before Cancer Directed Treatment"` |
| **Data Type** | Enum |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required("Please select a clinical extent")` |
| **Backend Validation** | `z.nativeEnum(ClinicalExtent)` |
| **Database Column** | `hbcr.treatments.clinical_extent_of_disease` ENUM |
| **Options** | In Situ/Benign, Localized, Direct Extension, Regional Nodes, Direct Extension with Regional Nodes, Distant Metastasis, Not Applicable, Recurrence, Unknown Primary, Others Specify, Unknown |

### Field 31: Staging System*

| Property | Value |
|---|---|
| **Field Key** | `"28(a). Staging system"` |
| **Data Type** | Enum + conditional |
| **Required** | ✅ Yes |
| **Options** | `TNM`, `FIGO`, `Ann Arbor`, `Toronto Childhood`, `Not Applicable`, `Lugano`, `COG`, `Others Specify`, `Unknown` |
| **Conditional** | TNM → shows T, N, M fields (text inputs). Other → shows a single text input for staging system value |
| **Frontend Validation** | `required()`. When non-TNM: staging system value required |
| **Backend Validation** | `z.nativeEnum(StagingSystem)` |
| **Database Columns** | `staging_system` ENUM, `staging_system_value` VARCHAR(512), `tnm_t` VARCHAR(16), `tnm_n` VARCHAR(16), `tnm_m` VARCHAR(16) |

### Field 32: Composite Stage*

| Property | Value |
|---|---|
| **Field Key** | `"28(c). Composite stage"` |
| **Data Type** | Dropdown (text input) |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required("Composite stage is required")` |
| **Backend Validation** | Required string |
| **Database Column** | `hbcr.treatments.composite_stage` VARCHAR(256) |
| **Edge Cases** | Always visible regardless of staging system selection. Replaced A/B/C/D dropdown with a text input/dropdown |

### Field 33: Treatment Given Prior to Registration*

| Property | Value |
|---|---|
| **Field Key** | `"29. Treatment Given Prior to Registration at RI / Outside RI"` |
| **Data Type** | Enum (radio group) |
| **Required** | ✅ Yes |
| **Frontend Validation** | Required (radio group must be selected) |
| **Backend Validation** | Required |
| **Database Column** | Related to `hbcr.treatments` with `treatment_stage = PRIOR_REGISTRATION` |

### Field 34: Treatment Modalities (30(a))

| Property | Value |
|---|---|
| **Field Key** | `"30(a). Type of treatment given"` |
| **Data Type** | Multiple treatment records |
| **Options** | Surgery, Radiotherapy (1 & 2), Chemotherapy (1 & 2), Hormone Therapy, Targeted Therapy, Others |
| **Sub-fields per modality** | Intention (Curative/Palliative/Symptomatic/Unknown), Role (Neo-adjuvant/Definitive/Concurrent/Unknown), Details (Complete/Incomplete/Treatment advised but not accepted), Start Date, End Date |
| **Conditional** | Targeted Therapy → shows type dropdown: TKI, Immunotherapy, Monoclonal Antibodies, etc. + "Others (Specify)" |
| **Database Tables** | `hbcr.treatments` + `hbcr.treatment_modality_details` |
| **Edge Cases** | Treatment modalities for Prior Registration and At RI are stored separately |

### Field 35: Performance Status (ECOG)

| Property | Value |
|---|---|
| **Field Key** | `"29(c). Performance Status (ECOG)"` |
| **Data Type** | Enum (Known/Unknown) + conditional grade |
| **Conditional** | Known → shows ECOG Grade dropdown (Grade 0–5) |
| **Backend Validation** | `z.nativeEnum(EcogStatus)` + `z.nativeEnum(EcogGrade)` |
| **Database Columns** | `ecog_status` ENUM, `ecog_grade` ENUM |

### Field 36: Name of Person Completing Form*

| Property | Value |
|---|---|
| **Field Key** | `"31. Name of person completing form (IN CAPITALS)"` |
| **Data Type** | String |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()`, `maxLen(255)` |
| **Backend Validation** | `z.string().min(1).max(255)` |
| **Database Column** | `hbcr.registrations.form_completed_by` VARCHAR(255) |
| **Edge Cases** | Should be in capital letters per label instruction |

### Field 37: Date of Completion of Form*

| Property | Value |
|---|---|
| **Field Key** | `"32. Date of completion of form"` |
| **Data Type** | Date |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()`, `isDate()`, `notFutureDate()` |
| **Backend Validation** | `z.coerce.date()` |
| **Database Column** | `hbcr.registrations.form_completion_date` DATE |
| **Edge Cases** | Cannot be in the future |

### Field 38: Contact Number*

| Property | Value |
|---|---|
| **Field Key** | `"33. Contact Number"` |
| **Data Type** | String |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()`, `pattern(/^[6-9][0-9]{9}$/)` — 10-digit Indian mobile |
| **Backend Validation** | Required string, validated format |
| **Database Column** | `hbcr.registrations.contact_number` VARCHAR(15) |
| **Edge Cases** | Must start with 6-9, exactly 10 digits |

### Field 39: Designation*

| Property | Value |
|---|---|
| **Field Key** | `"34. Designation"` |
| **Data Type** | String |
| **Required** | ✅ Yes |
| **Frontend Validation** | `required()` |
| **Backend Validation** | Required string |
| **Database Column** | `hbcr.registrations.designation` VARCHAR(128) |

### Field 40: Remarks

| Property | Value |
|---|---|
| **Field Key** | `"Remarks"` |
| **Data Type** | String |
| **Required** | ❌ No |
| **Frontend Validation** | `maxLen(1000)` |
| **Backend Validation** | Optional string, max 1000 chars |
| **Database Column** | `hbcr.registrations.remarks` VARCHAR(1000) |

---

### Auto-Generated Fields (Not User-Entered)

#### Reference Number

| Property | Value |
|---|---|
| **Format** | `{Centre Code}{5-digit running sequence}` |
| **Example** | Centre Code `961` → `96100001`, `96100002`, ... |
| **Generation** | Backend-controlled via `HospitalSequence` table |
| **Storage** | `hbcr.registrations.reference_no` VARCHAR(64) |
| **Concurrency** | Atomic `UPDATE ... SET next_sequence = next_sequence + 1 RETURNING` in `sequence.service.ts` |
| **Hospital-scoped** | ✅ Each hospital has its own sequence starting from 1 |

#### Registration Number

| Property | Value |
|---|---|
| **Format** | `{Last 2 digits of year}{5-digit sequence}` |
| **Example** | Year 2026, sequence 1 → `2600001` |
| **Generation** | Same atomic sequence as Reference Number, same running counter |
| **Storage** | `hbcr.registrations.hbcr_registration_no` VARCHAR(20) UNIQUE |
| **Note** | Uses the same sequence number as Reference Number (same `nextSequence` counter) |

---

# 2. Database Schema & ER Diagram

## Database Overview

- **Database**: PostgreSQL (Neon in production, local PostgreSQL for development)
- **Schema**: `hbcr`
- **ORM**: Prisma 7
- **Total Models**: 22 (excluding reference data)

## ER Diagram (Text Representation)

```
┌──────────────┐
│   centres    │
│──────────────│
│ id      (PK) │
│ code    (UQ) │──── 1:N ────┐
│ created_at   │              │
└──────────────┘              │
                              ▼
                    ┌──────────────────┐
                    │    hospitals     │
                    │──────────────────│
                    │ id        (PK)   │
                    │ code      (UQ)   │
                    │ name             │
                    │ centre_id (FK)   │
                    │ created_at       │─── 1:N ──┐
                    └──────────────────┘          │
                              │                   │
                    1:N       │         1:N       │
              ┌───────────────┤         ┌─────────┤
              ▼               ▼         ▼         ▼
     ┌──────────────┐ ┌────────────┐ ┌────────┐ ┌────────┐
     │    users     │ │  hospital_ │ │registr-│ │ drafts │
     │──────────────│ │  sequences │ │ations  │ │        │
     │ id      (PK) │ │────────────│ │────────│ │────────│
     │ username(UQ) │ │ id    (PK) │ │id  (PK)│ │id  (PK)│
     │ password_hash│ │ hospital_id│ │patient_│ │hospital│
     │ full_name    │ │ next_seq   │ │  id(FK)│ │  _id   │
     │ role         │ │ created_at │ │hospit_ │ │created_│
     │ hospital_id  │ │ updated_at │ │  id(FK)│ │  by_   │
     │ is_active    │ └────────────┘ │ref_no  │ │user_id │
     └──────────────┘                │reg_no  │ │form_   │
              │                      │status  │ │  data  │
              │ 1:N                  │...many │ │patient_│
              ▼                      │  cols  │ │  name  │
     ┌──────────────┐                └───┬────┘ │aadhaar │
     │   drafts     │                    │       └────────┘
     │ (see above)  │                    │
     └──────────────┘                    │
                                         │
                    ┌────────────────────┘
                    │ 1:N
                    ▼
          ┌──────────────────┐
          │    patients      │
          │──────────────────│
          │ id        (PK)   │
          │ full_name        │
          │ first_name       │
          │ middle_name      │
          │ last_name        │
          │ age              │
          │ date_of_birth    │
          │ gender     (FK)  │
          │ health_scheme_   │
          │   beneficiary    │
          │ health_scheme_   │
          │   details        │
          │ created_at       │──── 1:N ──┐
          └──────────────────┘           │
                                         │
              ┌──────────────────────────┤
              │         │          │     │
              ▼         ▼          ▼     ▼
     ┌───────────┐ ┌────────┐ ┌──────┐ ┌──────────────┐
     │ patient_  │ │patient_│ │patient│ │  patient_    │
     │ identify- │ │relativ-│ │_habit-│ │  comorbidity │
     │ cations   │ │  es    │ │  s   │ │    s         │
     │───────────│ │────────│ │──────│ │──────────────│
     │id    (PK) │ │id (PK) │ │id(PK)│ │id      (PK) │
     │patient_id │ │patient_│ │pat_  │ │patient_id    │
     │  (FK)     │ │  id(FK)│ │  id  │ │comorbidity   │
     │id_type    │ │relation│ │habit │ │answer        │
     │number     │ │  ship  │ │answer│ │duration_     │
     │id_name    │ │name    │ │durat_│ │  months      │
     └───────────┘ │mobile_ │ │months│ └──────────────┘
                   │  number│ └──────┘
                   └────────┘
                         │
              ┌──────────┘
              │ 1:N
              ▼
     ┌──────────────────┐
     │  registrations   │
     │──────────────────│
     │ id        (PK)   │
     │ patient_id (FK)  │
     │ hospital_id (FK) │
     │ hbcr_reg_no (UQ) │
     │ reference_no     │
     │ department_name  │
     │ unit_number      │
     │ date_of_reporting│
     │ case_registered_ │
     │   through        │
     │ referral_type    │
     │ date_of_first_   │
     │   diagnosis      │
     │ marital_status   │
     │ education        │
     │ status           │
     │ form_completed_by│
     │ contact_number   │
     │ designation      │
     │ remarks          │
     │ ...many more cols│
     └───────┬──────────┘
             │
    ┌────────┼─────────────┬───────────────┬──────────────────┐
    │        │             │               │                  │
    ▼        ▼             ▼               ▼                  ▼
┌────────┐┌──────────┐┌──────────┐┌────────────────┐┌──────────────────────┐
│diagno- ││pathologi-││ treatment││  familial_     ││     follow_ups       │
│stic_   ││cal_      ││   s      ││  cancer_       ││──────────────────────│
│methods ││diagnoses ││──────────││  history       ││id              (PK)  │
│────────││──────────││id   (PK) ││────────────────││registration_id (FK)  │
│id  (PK)││id   (PK) ││registr_  ││id         (PK) ││visit_no              │
│registr_││registr_  ││  id (FK) ││registration_   ││date_of_follow_up     │
│  id(FK)││  id (UQ) ││treatment_││  id       (UQ) ││method_of_follow_up   │
│method  ││longest_  ││  stage   ││family_history  ││vital_status          │
│clinical││  symptom_││staging_  ││relationship_   ││disease_status        │
│  _only_││  duration││  system  ││  with_cancer   ││...many cols          │
│  date  ││anatomical││composite_││degree_of_      │└──────────────────────┘
└────────┘│  _site   ││  stage   ││  relationship  │
          │icdo_topo ││tnm_t/n/m ││primary_site    │
          │icdo_morph││ecog_*    ││age_at_diagnosis│
          │icd10_site││...       ││date_of_diagnosis│
          │laterality│└──────────┘└────────────────┘
          │sequence  │
          └──────────┘
                     │ 1:1
                     ▼
          ┌─────────────────────────┐
          │ treatment_modality_     │
          │        details          │
          │─────────────────────────│
          │ id                (PK)  │
          │ treatment_id      (FK)  │
          │ modality                │
          │ is_selected             │
          │ intention_to_treat      │
          │ role                    │
          │ details                 │
          │ start_date              │
          │ end_date                │
          │ others_specify          │
          └─────────────────────────┘
```

## Reference Data Tables (Read-Only)

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ icdo_topography  │  │ icdo_morphology  │  │ icdo_index_      │
│──────────────────│  │──────────────────│  │     entries      │
│ id (PK)          │  │ id (PK)          │  │──────────────────│
│ code (UQ) C09.9  │  │ code (UQ) 8077/2 │  │ id (PK)          │
│ term             │  │ term             │  │ headword         │
│ synonyms[]       │  │ synonyms[]       │  │ term             │
│ group_code       │  │ behavior         │  │ code             │
│ sort_order       │  │ site_restriction │  │ kind             │
└──────────────────┘  │ sort_order       │  │ sort_order       │
                      └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ icd10_ranges     │  │ icd10_code_      │  │ icd10_rules      │
│──────────────────│  │     mentions     │  │──────────────────│
│ id (PK)          │  │──────────────────│  │ id (PK)          │
│ code (UQ)        │  │ id (PK)          │  │ rule_id (UQ)     │
│ title            │  │ code             │  │ title            │
│ sort_order       │  │ example_no       │  │ text             │
└──────────────────┘  │ scenario         │  └──────────────────┘
                      │ sort_order       │
                      └──────────────────┘

┌──────────────────┐
│ icdo3_icd10_     │
│     mapping      │
│──────────────────│
│ id (PK)          │
│ icdo3_code (UQ)  │
│ icdo3_term       │
│ icd10_code       │
│ note             │
│ sort_order       │
└──────────────────┘
```

## Complete Table List

| Table | Purpose | Key Columns |
|---|---|---|
| `hbcr.centres` | Registry centres | `id`, `code` (UQ) |
| `hbcr.hospitals` | Reporting institutions | `id`, `code` (UQ), `name`, `centre_id` (FK) |
| `hbcr.hospital_sequences` | Running sequence per hospital | `hospital_id` (FK, UQ), `next_sequence` |
| `hbcr.users` | Login accounts | `id`, `username` (UQ), `password_hash`, `hospital_id` (FK) |
| `hbcr.patients` | Core patient record | `id`, `full_name`, `age`, `gender`, `date_of_birth` |
| `hbcr.patient_identifications` | ID documents (Aadhaar, ABHA, etc.) | `id`, `patient_id` (FK), `id_type` (ENUM), `number` |
| `hbcr.patient_relatives` | Father/Mother/Spouse/Son/Daughter | `id`, `patient_id` (FK), `relationship` (ENUM), `name` |
| `hbcr.patient_addresses` | Residential + Permanent addresses | `id`, `patient_id` (FK), `address_type` (ENUM) |
| `hbcr.patient_habits` | Smoking/Smokeless/Betel/Alcohol | `id`, `patient_id` (FK), `habit` (ENUM), `answer`, `duration_months` |
| `hbcr.patient_comorbidities` | 14 comorbidity types | `id`, `patient_id` (FK), `comorbidity` (ENUM), `answer` |
| `hbcr.registrations` | Core registration record | `id`, `patient_id` (FK), `hospital_id` (FK), `reference_no`, `hbcr_registration_no` (UQ) |
| `hbcr.diagnostic_methods` | Method of Diagnosis checkboxes | `id`, `registration_id` (FK), `method` (ENUM) |
| `hbcr.diagnostic_procedures` | Sub-procedures per method | `id`, `diagnostic_method_id` (FK), `procedure_name` |
| `hbcr.pathological_diagnoses` | Fields 21–26 (ICD-O-3, ICD-10, Laterality) | `id`, `registration_id` (FK, UQ) |
| `hbcr.treatments` | Treatment blocks (Prior + At RI) | `id`, `registration_id` (FK), `treatment_stage` (ENUM) |
| `hbcr.treatment_modality_details` | 8-row modality grid per treatment | `id`, `treatment_id` (FK), `modality` (ENUM) |
| `hbcr.familial_cancer_history` | Family cancer history (Field 19) | `id`, `registration_id` (FK, UQ) |
| `hbcr.follow_ups` | Follow-up visits | `id`, `registration_id` (FK), `visit_no` |
| `hbcr.follow_up_treatments` | Treatment modalities per follow-up | `id`, `follow_up_id` (FK), `modality` (ENUM) |
| `hbcr.drafts` | Incomplete registration drafts | `id`, `hospital_id` (FK), `form_data` (JSON), `patient_name`, `aadhaar` |
| `hbcr.icdo_topography` | ICD-O-3 Topography reference | `id`, `code` (UQ), `term` |
| `hbcr.icdo_morphology` | ICD-O-3 Morphology reference | `id`, `code` (UQ), `term` |
| `hbcr.icdo_index_entries` | ICD-O-3 Alphabetic Index | `id`, `headword`, `term`, `code` |
| `hbcr.icd10_ranges` | ICD-10 code ranges | `id`, `code` (UQ), `title` |
| `hbcr.icd10_code_mentions` | ICD-10 code mentions in examples | `id`, `code`, `example_no` |
| `hbcr.icd10_rules` | ICD-10 coding rules | `id`, `rule_id` (UQ), `text` |
| `hbcr.icd10_examples` | ICD-10 worked examples | `id`, `example_no` (UQ), `codes[]` |
| `hbcr.icdo3_icd10_mapping` | ICD-O-3 → ICD-10 mapping | `id`, `icdo3_code` (UQ), `icd10_code` |

## PostgreSQL Enums (28 total)

| Enum | Values |
|---|---|
| `gender_enum` | male, female, other |
| `id_type_enum` | aadhaar, abha, pan_card, voter_id, passport, ab_pmjay, other |
| `relationship_enum` | father, mother, spouse, son, daughter, other |
| `address_type_enum` | residential, permanent |
| `urban_rural_enum` | urban, rural |
| `yes_no_unknown_enum` | yes, no, unknown |
| `habit_enum` | smoking, smokeless, betel_nut_with_tobacco, betel_nut_without_tobacco, alcohol |
| `comorbidity_enum` | tuberculosis, hypertension, diabetes, ischemic_heart_disease, copd_asthma, stroke, depression, hepatitis_b, hepatitis_c, nafld, chronic_kidney_disease, hiv_aids, hypothyroidism, others |
| `case_through_enum` | out_patient, in_patient_elective, in_patient_emergency, unknown, other |
| `referral_type_enum` | self, other_hospital, screen_detected, unknown |
| `marital_status_enum` | married, single, widowed, divorced, separated, other, unknown |
| `education_enum` | not_applicable, illiterate, literate, primary, middle, secondary_higher_secondary, technical_after_matric, graduate_and_above, others, unknown |
| `registration_status_enum` | active, pending, completed |
| `diagnostic_method_enum` | clinical_only, microscopic, imaging, dco, other |
| `laterality_enum` | not_paired_site, paired_site, unknown |
| `paired_laterality_enum` | right, left, only_one_side, bilateral_unknown, paired_midline, paired_unknown |
| `sequence_enum` | one_primary, first_of_multiple, second_of_multiple, third_of_multiple, unspecified_unknown |
| `histological_grade_enum` | grade_i, grade_ii, grade_iii, grade_iv |
| `clinical_extent_enum` | in_situ_benign_pre_invasive, localized, direct_extension, regional_nodes, direct_extension_with_regional_nodes, distant_metastasis, not_applicable, recurrence, unknown_primary, others_specify, unknown |
| `staging_system_enum` | tnm, figo, ann_arbor, toronto_childhood, not_applicable, lugano, cog, others_specify, unknown |
| `ecog_status_enum` | known, unknown |
| `ecog_grade_enum` | grade_0 through grade_5 |
| `treatment_stage_enum` | prior_registration, at_ri |
| `treatment_type_enum` | allopathic, non_allopathic, both |
| `targeted_therapy_enum` | tki, immunotherapy, monoclonal_antibodies, antibody_drug_conjugate, cdk46_inhibitor, mtor_inhibitor, parp_inhibitor, not_given, others_specify, unknown |
| `treatment_modality_enum` | surgery, radiotherapy_1, radiotherapy_2, chemotherapy_1, chemotherapy_2, hormone_therapy, targeted_therapy, others |
| `intention_enum` | curative, palliative, symptomatic, unknown |
| `role_enum` | neo_adjuvant, definitive, concurrent, unknown |
| `treatment_detail_enum` | completed_treatment, incomplete_treatment, treatment_advised_not_accepted |
| `fam_relationship_enum` | same_cancer, other_cancer |
| `fam_degree_enum` | first_degree, second_degree |
| `fam_primary_site_enum` | breast, ovary, colon, prostate, endometrial, melanoma, thyroid, pancreas |
| `follow_up_method_enum` | hospital_visit, post_email, telephone, house_visit, public_database, special_survey_study, others |
| `vital_status_enum` | alive, dead, unknown |
| `disease_status_enum` | no_evidence_of_disease, ned_second_primary_present, ned_other_illness, cancer_regression_residual, cancer_progression_recurrence, too_advanced_cachexia, ned_on_chemo_hormonal, others, unknown |
| `place_of_death_enum` | ri, other_hospital, residence, others, unknown |
| `death_info_source_enum` | civil_registration, burial_cremation, voter_list, aadhaar, census, abdm, others, unknown |
| `follow_up_modality_enum` | surgery, radiotherapy, chemotherapy, hormone_therapy, targeted_therapy, others |
| `icdo_entry_kind_enum` | topography, morphology |

---

# 3. Complete Application Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  React SPA (Vite)                      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │Dashboard │ │Register  │ │ Patient  │ │ FollowUp │ │ │
│  │  │          │ │ (3-step) │ │ Records  │ │          │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │ │
│  │  │ Drafts   │ │  Login   │ │ ICD-10 / ICD-O-3     │  │ │
│  │  │          │ │          │ │ Reference Search      │  │ │
│  │  └──────────┘ └──────────┘ └──────────────────────┘  │ │
│  │                                                        │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │              Shared Libraries                    │  │ │
│  │  │  api.ts │ auth.tsx │ formState.tsx │ validation  │  │ │
│  │  │  hbcrForm.ts │ registrationSubmit.ts            │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │ fetch()                          │
└──────────────────────────┼──────────────────────────────────┘
                           │
                     ┌─────▼─────┐
                     │  Vercel   │ (Frontend hosting)
                     │  / Vite   │
                     │  Dev Proxy│
                     └─────┬─────┘
                           │ /api/* → Backend
                     ┌─────▼──────────────────────────┐
                     │       Render (Backend)          │
                     │  ┌────────────────────────────┐ │
                     │  │     Express.js (v5)        │ │
                     │  │                            │ │
                     │  │  ┌──────────────────────┐  │ │
                     │  │  │   Middleware          │  │ │
                     │  │  │  • requireAuth (JWT)  │  │ │
                     │  │  │  • validate (Zod)     │  │ │
                     │  │  │  • errorHandler       │  │ │
                     │  │  └──────────────────────┘  │ │
                     │  │                            │ │
                     │  │  ┌──────────────────────┐  │ │
                     │  │  │   Routes / Controllers│  │ │
                     │  │  │  • auth               │  │ │
                     │  │  │  • patient            │  │ │
                     │  │  │  • registration       │  │ │
                     │  │  │  • diagnostic         │  │ │
                     │  │  │  • pathology          │  │ │
                     │  │  │  • treatment          │  │ │
                     │  │  │  • familyHistory      │  │ │
                     │  │  │  • followup           │  │ │
                     │  │  │  • sideTables         │  │ │
                     │  │  │  • draft              │  │ │
                     │  │  │  • icdo / icd10       │  │ │
                     │  │  │  • dashboard          │  │ │
                     │  │  │  • aux (centres,      │  │ │
                     │  │  │    hospitals, users)  │  │ │
                     │  │  └──────────────────────┘  │ │
                     │  │                            │ │
                     │  │  ┌──────────────────────┐  │ │
                     │  │  │   Services            │  │ │
                     │  │  │  • registration       │  │ │
                     │  │  │  • patient            │  │ │
                     │  │  │  • sequence           │  │ │
                     │  │  │  • diagnostic         │  │ │
                     │  │  │  • pathology          │  │ │
                     │  │  │  • treatment          │  │ │
                     │  │  │  • familyHistory      │  │ │
                     │  │  │  • followup           │  │ │
                     │  │  │  • sideTables         │  │ │
                     │  │  │  • dashboard          │  │ │
                     │  │  │  • draft              │  │ │
                     │  │  │  • icdo / icd10       │  │ │
                     │  │  └──────────────────────┘  │ │
                     │  │                            │ │
                     │  │  ┌──────────────────────┐  │ │
                     │  │  │   Prisma Client       │  │ │
                     │  │  └──────────────────────┘  │ │
                     │  └────────────────────────────┘ │
                     └────────────┬─────────────────────┘
                                  │
                     ┌────────────▼─────────────────────┐
                     │    PostgreSQL (Neon / Local)       │
                     │    Schema: hbcr                    │
                     │    22+ tables, 28 enums            │
                     │    ICD-O-3 & ICD-10 reference data │
                     └──────────────────────────────────┘
```

## Technology Stack

### Frontend

| Component | Technology | Version |
|---|---|---|
| **Framework** | React | 18.x |
| **Build Tool** | Vite | 5.x |
| **Language** | TypeScript | 5.x |
| **Routing** | React Router DOM | v6 |
| **State** | React Context + useRef | — |
| **Styling** | Tailwind CSS | 3.x |
| **UI Components** | shadcn/ui (Radix UI) | — |
| **Animations** | Framer Motion | — |
| **Data Fetching** | TanStack React Query | v5 |
| **Icons** | Lucide React | — |
| **Form State** | Custom FormStateProvider | — |
| **Validation** | Custom validation library | — |
| **Hosting** | Vercel | — |

### Backend

| Component | Technology | Version |
|---|---|---|
| **Runtime** | Node.js | 20+ |
| **Framework** | Express.js | 5.x |
| **Language** | TypeScript | 5.x |
| **ORM** | Prisma | 7.x |
| **Database** | PostgreSQL | — |
| **Auth** | JWT (HMAC signed tokens) | — |
| **Password Hashing** | bcryptjs | 3.x |
| **Validation** | Zod | — |
| **CORS** | cors middleware | 2.x |
| **Hosting** | Render | — |
| **Database Host** | Neon (serverless PostgreSQL) | — |

## Frontend Structure

```
Frontend/
├── client/
│   ├── App.tsx                    # Root router, auth guard
│   ├── pages/
│   │   ├── Index.tsx              # Main workspace (sidebar + view switcher)
│   │   ├── Login.tsx              # Login page
│   │   └── NotFound.tsx           # 404 page
│   ├── lib/
│   │   ├── api.ts                 # Typed API client (all endpoints)
│   │   ├── auth.tsx               # Auth context, login/logout/session
│   │   ├── formState.tsx          # Multi-step form state provider
│   │   ├── validation.ts          # Custom validation library
│   │   ├── global.css             # Global styles
│   │   ├── registration/
│   │   │   ├── steps.ts           # Step labels, required fields, field order
│   │   │   ├── step1Rules.ts      # Step 1 validation rules
│   │   │   ├── step2Rules.ts      # Step 2 validation rules
│   │   │   ├── step3Rules.ts      # Step 3 validation rules
│   │   │   └── apiErrorMap.ts     # Maps API errors to field labels
│   │   ├── index/
│   │   │   ├── data.ts            # Page titles, mock data
│   │   │   ├── components/
│   │   │   │   ├── Dashboard.tsx          # Dashboard with stats
│   │   │   │   ├── Registration.tsx       # Multi-step registration orchestrator
│   │   │   │   ├── Records.tsx            # Patient Records + PatientRecordForm
│   │   │   │   ├── PatientTable.tsx       # Patient records table
│   │   │   │   ├── PatientRecordForm.tsx  # Full 3-step form in patient view
│   │   │   │   ├── PatientDetail.tsx      # (deprecated → PatientRecordForm)
│   │   │   │   ├── Drafts.tsx             # Drafts list page
│   │   │   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   │   │   ├── Header.tsx             # Top header bar
│   │   │   │   ├── Brand.tsx              # Logo/brand
│   │   │   │   ├── FormFields.tsx         # Field, SelectField, ToggleDetails
│   │   │   │   ├── registration/
│   │   │   │   │   ├── Step1Identifying.tsx    # Step 1 form fields
│   │   │   │   │   └── Step2Diagnostic.tsx     # Step 2 form fields
│   │   │   │   ├── ClinicalTreatment.tsx       # Step 3 form fields
│   │   │   │   └── followup/
│   │   │   │       ├── FollowUp.tsx            # Follow-up page
│   │   │   │       ├── FollowUpSearch.tsx      # Search component
│   │   │   │       └── FollowUpDetails.tsx     # Visit details
│   │   │   └── utils/
│   │   │       ├── registrationSubmit.ts # Submit orchestrator
│   │   │       └── apiRows.ts            # API → table row mapping
│   │   └── utils/
│   │       └── hbcrForm.ts       # Form state → API payload extraction
│   └── vite.config.ts
├── vercel.json                    # SPA rewrites
├── .env                           # VITE_API_BASE
└── package.json
```

## Backend Structure

```
Backend/
├── src/
│   ├── server.ts                  # Entry point, DB connect, listen
│   ├── app.ts                     # Express app creation, middleware
│   ├── config/
│   │   └── index.js               # PORT, NODE_ENV, DATABASE_URL
│   ├── db/
│   │   └── prisma.ts              # PrismaClient singleton, connect/disconnect
│   ├── middleware/
│   │   ├── requireAuth.ts         # JWT verification, attaches user + hospitalId
│   │   ├── validate.ts            # Zod validation middleware
│   │   ├── errorHandler.ts        # Global error handler (Prisma errors, HttpError)
│   │   └── asyncHandler.ts        # Async route wrapper
│   ├── utils/
│   │   ├── response.ts            # ok() / fail() response helpers
│   │   ├── httpError.ts           # HttpError class
│   │   ├── password.ts            # bcrypt hash/verify
│   │   └── token.ts               # JWT sign/verify
│   ├── validators/
│   │   ├── common.ts              # Shared Zod schemas (isString, isInt, etc.)
│   │   ├── registration.validator.ts  # Registration create/update validation
│   │   ├── patient.validator.ts       # Patient create/update validation
│   │   ├── followup.validator.ts      # Follow-up validation
│   │   ├── draft.validator.ts         # Draft validation
│   │   └── familyHistory.validator.ts # Family history validation
│   ├── controllers/
│   │   ├── auth.controller.ts         # Login, /me
│   │   ├── patient.controller.ts      # CRUD patients
│   │   ├── registration.controller.ts # CRUD registrations, preview numbers
│   │   ├── diagnostic.controller.ts   # Diagnostic methods/procedures
│   │   ├── pathology.controller.ts    # Pathological diagnosis
│   │   ├── treatment.controller.ts    # Treatment + modalities
│   │   ├── familyHistory.controller.ts # Family cancer history
│   │   ├── followup.controller.ts     # Follow-up CRUD
│   │   ├── dashboard.controller.ts    # Dashboard stats
│   │   ├── draft.controller.ts        # Draft CRUD
│   │   ├── icdo.controller.ts         # ICD-O-3 lookups
│   │   ├── icd10.controller.ts        # ICD-10 lookups
│   │   ├── sideTables.controller.ts   # Addresses, relatives, habits, etc.
│   │   └── health.controller.ts       # Health check endpoint
│   ├── services/
│   │   ├── registration.service.ts    # Registration business logic
│   │   ├── patient.service.ts         # Patient business logic
│   │   ├── sequence.service.ts        # Atomic sequence generation
│   │   ├── diagnostic.service.ts      # Diagnostic methods
│   │   ├── pathology.service.ts       # Pathological diagnosis
│   │   ├── treatment.service.ts       # Treatment logic
│   │   ├── familyHistory.service.ts   # Family history
│   │   ├── followup.service.ts        # Follow-up logic
│   │   ├── sideTables.service.ts      # Side table operations
│   │   ├── dashboard.service.ts       # Dashboard queries
│   │   ├── draft.service.ts           # Draft operations
│   │   ├── icdo.service.ts            # ICD-O-3 queries
│   │   └── icd10.service.ts           # ICD-10 queries
│   └── routes/
│       ├── index.ts               # Route registration, auth middleware
│       ├── auth.routes.ts         # POST /login, GET /me
│       ├── patient.routes.ts      # /patients CRUD + /:patientId/side/*
│       ├── registration.routes.ts # /registrations + /patients/:id/registrations
│       ├── diagnostic.routes.ts   # /registrations/:id/diagnostic/*
│       ├── pathology.routes.ts    # /registrations/:id/pathology
│       ├── treatment.routes.ts    # /registrations/:id/treatment/*
│       ├── familyHistory.routes.ts # /registrations/:id/family-history
│       ├── followup.routes.ts     # /followups/*
│       ├── draft.routes.ts        # /drafts/*
│       ├── sideTables.routes.ts   # /patients/:id/side/*
│       ├── icdo.routes.ts         # /icdo/*
│       ├── icd10.routes.ts        # /icd10/*
│       ├── auxiliary.routes.ts     # /centres, /hospitals, /users, /dashboard/*
│       └── health.routes.ts       # /health
├── prisma/
│   ├── schema.prisma              # Prisma schema (1065 lines)
│   ├── seed.ts                    # Database seeding
│   ├── migrations/                # 15+ migrations
│   └── prisma.config.ts           # Prisma config
├── scripts/                       # ICD-O-3/ICD-10 seed scripts
├── .env                           # DATABASE_URL, PORT
└── package.json
```

## API Endpoints Summary

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | ❌ | Login with username/password |
| GET | `/api/auth/me` | ✅ | Get current user + hospital |

### Patients
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/patients` | ✅ | List patients (hospital-scoped) |
| POST | `/api/patients` | ✅ | Create patient |
| GET | `/api/patients/:id` | ✅ | Get patient by ID |
| PATCH | `/api/patients/:id` | ✅ | Update patient |
| DELETE | `/api/patients/:id` | ✅ | Delete patient |

### Registrations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/registrations` | ✅ | List all registrations |
| GET | `/api/registrations/preview-numbers/:hospitalId` | ❌ | Preview next Ref/Reg numbers |
| GET | `/api/patients/:id/registrations` | ✅ | List registrations for patient |
| POST | `/api/patients/:id/registrations` | ✅ | Create registration |
| GET | `/api/registrations/:id` | ✅ | Get registration by ID |
| PATCH | `/api/registrations/:id` | ✅ | Update registration |
| DELETE | `/api/registrations/:id` | ✅ | Delete registration |

### Side Tables (Patient sub-data)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/patients/:id/side/addresses` | Create/upsert address |
| GET | `/api/patients/:id/side/addresses` | List addresses |
| POST | `/api/patients/:id/side/relatives` | Create relative |
| POST | `/api/patients/:id/side/habits` | Create habit record |
| POST | `/api/patients/:id/side/comorbidities` | Create comorbidity |
| POST | `/api/patients/:id/side/identifications` | Create ID document |
| DELETE | `/api/patients/:id/side/identifications/:id` | Delete ID document |

### Diagnostic / Pathology / Treatment
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/registrations/:id/diagnostic/methods` | Create diagnostic method |
| DELETE | `/api/registrations/:id/diagnostic/methods/:id` | Delete method |
| POST | `/api/registrations/:id/diagnostic/procedures` | Create procedure |
| PUT | `/api/registrations/:id/pathology` | Upsert pathological diagnosis |
| POST | `/api/registrations/:id/treatments` | Create treatment block |
| PUT | `/api/registrations/:id/treatments/:id` | Update treatment |
| POST | `/api/registrations/:id/treatments/:id/modalities` | Upsert modality |
| PUT | `/api/registrations/:id/family-history` | Upsert family history |

### Follow-ups
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/followups/search` | Search by reg/ref number, aadhaar, phone |
| GET | `/api/followups/:registrationId` | List visits |
| GET | `/api/followups/:registrationId/visit/:visitNo` | Get specific visit |
| POST | `/api/followups/:registrationId` | Create visit |

### Drafts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/drafts` | List drafts (hospital-scoped, with search) |
| GET | `/api/drafts/:id` | Get draft |
| POST | `/api/drafts` | Save draft (create/update) |
| DELETE | `/api/drafts/:id` | Delete draft |

### Reference Data (Read-Only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/icdo/topography` | Search ICD-O-3 topography |
| GET | `/api/icdo/morphology` | Search ICD-O-3 morphology |
| GET | `/api/icdo/index` | Search ICD-O-3 alphabetic index |
| GET | `/api/icd10/ranges` | List ICD-10 code ranges |
| GET | `/api/icd10/search` | Search ICD-10 codes |
| GET | `/api/icd10/rules` | Get coding rules |
| GET | `/api/icd10/examples` | Get worked examples |
| GET | `/api/icdo/icd10-mapping` | Get ICD-O-3 → ICD-10 mapping |

### Dashboard / Aux
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/recent-patients` | Recent patients |
| GET | `/api/centres` | List centres |
| GET | `/api/hospitals` | List hospitals |
| GET | `/api/users` | List users |

---

# 4. System Design

## Authentication Flow

```
1. User enters username (hospital code) + password on Login page
2. Frontend calls POST /api/auth/login
3. Backend:
   a. Looks up user by username in hbcr.users
   b. Compares password with bcrypt hash (constant-time via dummy hash)
   c. If valid: signs JWT with { sub: user.id, exp: tokenExpiry() }
   d. Returns { token, user: { id, username, fullName, role, initials, hospitalId }, hospital: { id, name, centre } }
4. Frontend stores session in localStorage (key: "hbcr.auth")
5. All subsequent API calls include Authorization: Bearer <token>
6. requireAuth middleware:
   a. Verifies JWT signature + expiry
   b. Loads user from DB (including hospital + centre)
   c. Checks user.isActive
   d. Attaches req.user, req.hospitalId
   e. If hospitalId is null → 403 "not linked to any hospital"
7. On 401 from any API: frontend clears session, redirects to /login
8. On page refresh: session restored from localStorage, validated via GET /api/auth/me
```

## Hospital-Scoped Data Isolation

```
Every authenticated request → req.hospitalId is set by requireAuth middleware.

Patient queries:
  prisma.patient.findMany({ where: { registrations: { some: { hospitalId: req.hospitalId } } } })

Registration queries:
  prisma.registration.findMany({ where: { hospitalId: req.hospitalId } })

Follow-up queries:
  prisma.followUp.findMany({ where: { registration: { hospitalId: req.hospitalId } } })

Dashboard queries:
  prisma.registration.count({ where: { hospitalId: req.hospitalId } })

Draft queries:
  prisma.draft.findMany({ where: { hospitalId: req.hospitalId } })

→ Hospital 1 can NEVER see Hospital 2's data, even via direct API calls.
→ The hospitalId comes from the JWT token → database user record, NOT from the request body.
```

## Reference Number / Registration Number Generation

```
1. Preview (GET /api/registrations/preview-numbers/:hospitalId):
   a. Looks up HospitalSequence for the hospital
   b. Returns estimated numbers based on current next_sequence

2. Final Submit (POST /api/patients/:id/registrations):
   a. atomicNextSequence(hospitalId):
      - UPDATE hbcr.hospital_sequences SET next_sequence = next_sequence + 1
        WHERE hospital_id = ? RETURNING next_sequence
      - If no row exists → INSERT (hospitalId, 1)
   b. Reference Number = centreCode + padded sequence (e.g. "96100001")
   c. Registration Number = yearLast2 + padded sequence (e.g. "2600001")
   d. Both stored as VARCHAR to preserve leading zeros

3. Concurrency Safety:
   - Atomic SQL UPDATE...RETURNING prevents race conditions
   - Multiple users/hospitals can submit simultaneously without duplicates
   - Each hospital has its own independent sequence

4. Draft Behavior:
   - Drafts do NOT consume sequence numbers
   - Sequence numbers are only assigned on final submit
   - If a draft is discarded, no number is wasted
```

## Registration Form Submission Flow

```
Frontend (Registration.tsx → registrationSubmit.ts):

1. Step 1 → Step 2 → Step 3 (with validation at each step)
2. On Submit:
   a. extractPatient(values) → patientApi.create()
   b. extractAddresses(values) → sideApi.addresses.upsert() × 2
   c. extractRelatives(values) → sideApi.relatives.create() × N
   d. extractHabits(values) → sideApi.habits.create() × 5
   e. extractComorbidities(values) → sideApi.comorbidities.create() × 14
   f. extractIdentifications(values) → sideApi.identifications.create() × N
   g. extractRegistration(values) → registrationApi.create()
      (triggers atomic sequence generation on backend)
   h. extractPathology(values) → pathologyApi.upsert()
   i. extractFamilyHistory(values) → familyHistoryApi.upsert()
   j. extractDiagnosticMethods(values) → diagnosticApi.createMethod() × N
   k. Extract treatment data → treatmentApi.create() + modalities

3. All side-table operations use try/catch (best-effort, skip duplicates)
4. On success: draft is deleted (if any), submitted state shown
```

## Draft Save/Load Flow

```
Save Draft:
1. Frontend builds full form state snapshot (all 3 steps)
2. Validates Patient Name + Aadhaar are present (mandatory for draft)
3. Calls POST /api/drafts with { formData: JSON snapshot, patientName, aadhaar, currentStep }
4. Backend validates patientName + aadhaar, saves to hbcr.drafts
5. No patient record or registration number is created

Load Draft:
1. User clicks "Continue" on Drafts page
2. Navigates to /register?draft=<id>
3. Registration component reads ?draft= param
4. Calls GET /api/drafts/:id → returns formData JSON
5. Loads all values into FormStateProvider via initialValues
6. Resumes at the saved currentStep
7. User continues editing normally

Delete Draft:
1. User clicks "Discard" on Drafts page
2. Calls DELETE /api/drafts/:id
3. Draft removed, no data loss (no patient/registration was created)
```

## ICD-O-3 / ICD-10 Search Flow

```
1. Frontend field (e.g., "21.4 Primary Site of Tumour - Topography")
2. User types search query → debounced API call
3. GET /api/icdo/topography?q=<query>
4. Backend service queries hbcr.icdo_topography:
   - ILIKE search on code, term, synonyms
   - Returns top 20 matches
5. User selects a result → code stored in form state
6. On submit → saved to hbcr.pathological_diagnoses.icdo_topography

ICD-10 auto-mapping:
1. When ICD-O-3 topography is selected
2. Frontend calls GET /api/icdo/icd10-mapping?code=<icdo3_code>
3. Backend looks up hbcr.icdo3_icd10_mapping
4. Returns corresponding ICD-10 code
5. Auto-fills "24. Site of Tumour (ICD-10)"
```

## Patient Records — Read-Only vs Editable Fields

```
When opening a patient record (PatientRecordForm.tsx):

READ-ONLY (always):
  - Fields 1–12: Department, Unit, Dates, Patient Name, DOB, Age, Gender
  - Field 13: Identification Documents (no update API exists)
  - Field 15: Address (Residential + Permanent)
  - Field 19: Family History (read-only in view, editable in edit mode)

EDITABLE (in Edit mode):
  - Field 14: Relative Details
  - Field 16: Marital Status
  - Field 17: Education
  - Field 18(a): Habits
  - Field 18(b): Co-Morbidities
  - Fields 20–26: Diagnostic Details
  - Fields 27–30: Clinical Stage & Treatment
  - Fields 31–34: Form completion details
  - Remarks
  - Contact Number + Designation

Implementation:
  - readOnlyFields Set passed to FormStateProvider
  - Field/SelectField/ToggleDetails components check useIsFieldReadOnly()
  - Read-only fields get grey background + readOnly attribute
```

## Error Handling Strategy

```
Backend Error Handler (errorHandler.ts):
1. HttpError (our own) → { success: false, error: { message, status } }
2. Prisma P2002 (unique constraint) → 409 with field-specific message
3. Prisma P2025 (record not found) → 404
4. Prisma P2003 (FK violation) → 409 with field name
5. Other Prisma errors → 400 with error message
6. Unknown errors → 500 "Internal server error"

Frontend Error Handling (api.ts):
1. All API functions return Result<T> type (ok/error discriminated union)
2. ApiError class carries status, details, fields (for 422 validation)
3. 401 from any API → automatic logout + redirect to /login
4. 422 validation errors → mapped to field labels via apiErrorMap.ts
5. Network errors → { ok: false, error: "Network error", status: 0 }
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Production Stack                       │
│                                                          │
│  Frontend (Vercel)          Backend (Render)             │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │ React SPA build   │      │ Express.js server │         │
│  │ Static assets     │      │ Port: 5050        │         │
│  │ SPA rewrites      │      │ Node.js runtime   │         │
│  │ (vercel.json)     │      │                   │         │
│  └────────┬─────────┘      └────────┬─────────┘         │
│           │                          │                    │
│           │ fetch() to API           │ Prisma queries     │
│           │                          │                    │
│           ▼                          ▼                    │
│  ┌──────────────────────────────────────────────┐        │
│  │     Neon PostgreSQL (Serverless)              │        │
│  │     Connection: pooler endpoint               │        │
│  │     Schema: hbcr                              │        │
│  └──────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘

Environment Variables:
  Frontend (Vercel):
    VITE_API_BASE = "https://hbcr.onrender.com/api"
    (fallback in code: detects vercel.app hostname)

  Backend (Render):
    DATABASE_URL = "postgresql://...@ep-...neon.tech/neondb"
    PORT = 5050
    NODE_ENV = "production"
    AUTH_SECRET = "<secret>"

  Local Development:
    Frontend: Vite proxy /api → localhost:5050
    Backend: DATABASE_URL = "postgresql://...@localhost:5432/hbcr_db"
```

## Known Limitations & Missing Features

| Area | Status |
|---|---|
| Patient Identification update API | ❌ No update endpoint — only create/delete |
| Habit/Comorbidity update API | Create-only; editing requires careful handling |
| Address update | Uses upsert pattern |
| Treatment detail enum | Missing "Treatment advised but not accepted" in some contexts |
| ICD-10 search in production | Previously broken due to missing columns; should be verified |
| Concurrent draft editing | No conflict resolution — last save wins |
| Draft conflict detection | Not implemented |
| Audit trail | Created/updated timestamps only, no change log |
| File attachments | Not supported |
| Bulk import/export | Not implemented |
| Role-based access control | Single "admin" role; no permission granularity |
| Rate limiting | Not implemented |
| API documentation (OpenAPI/Swagger) | Not generated |

---

*Documentation generated from actual codebase analysis — Backend (Prisma schema, controllers, services, routes, validators), Frontend (components, API client, validation, form state), and configuration files.*
