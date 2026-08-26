import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Pencil, Save, X } from "lucide-react";
import {
  patientApi,
  registrationApi,
  sideApi,
  pathologyApi,
  type ApiPatient,
  type ApiPatientHabit,
  type ApiPatientComorbidity,
  type ApiRegistration,
  type ApiPathologicalDiagnosis,
} from "@/lib/api";
import { Field } from "./FormFields";

type PatientDetailProps = {
  patientId: number;
  onBack: () => void;
};

/** Fields that are read-only after patient creation — cannot be modified via Edit. */
const READONLY_FIELDS = new Set([
  "fullName", "firstName", "middleName", "lastName",
  "age", "dateOfBirth", "gender",
  "aadhaar", "voterId", "abha", "passport", "abPmjay", "otherIds",
  "father", "mother", "spouse", "sonDaughter", "accompanyingPerson",
  "residentialAddress", "permanentAddress", "contactNumbers", "email",
]);

export function PatientDetail({ patientId, onBack }: PatientDetailProps) {
  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [registrations, setRegistrations] = useState<ApiRegistration[]>([]);
  const [habits, setHabits] = useState<ApiPatientHabit[]>([]);
  const [comorbidities, setComorbidities] = useState<ApiPatientComorbidity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable field values
  const [editHealthScheme, setEditHealthScheme] = useState(false);
  const [editHealthSchemeDetails, setEditHealthSchemeDetails] = useState("");

  // Editable remarks
  const [editRemarks, setEditRemarks] = useState("");

  // Editable pathological diagnosis
  const [pathology, setPathology] = useState<ApiPathologicalDiagnosis | null>(null);
  const [editPathology, setEditPathology] = useState<Record<string, string>>({});

  // Editable habits
  const [editHabits, setEditHabits] = useState<Record<string, { answer: string; durationMonths: number | null }>>({});

  // Editable comorbidities
  const [editComorbidities, setEditComorbidities] = useState<Record<string, { answer: string; durationMonths: number | null }>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, regs, hab, comp] = await Promise.all([
        patientApi.get(patientId),
        registrationApi.forPatient(patientId),
        sideApi.habits.list(patientId).catch(() => []),
        sideApi.comorbidities.list(patientId).catch(() => []),
      ]);
      setPatient(p);
      setRegistrations(regs);
      setHabits(hab);
      setComorbidities(comp);

      // Initialize editable values
      setEditHealthScheme(p.healthSchemeBeneficiary);
      setEditHealthSchemeDetails(p.healthSchemeDetails ?? "");
      const firstReg = regs[0];
      setEditRemarks(firstReg?.remarks ?? "");

      // Load pathological diagnosis separately
      if (firstReg) {
        try {
          const pathData = await pathologyApi.get(firstReg.id);
          setPathology(pathData);
          setEditPathology({
            longestSymptomDurationMonths: pathData.longestSymptomDurationMonths?.toString() ?? "",
            anatomicalSite: pathData.anatomicalSite ?? "",
            pathologySlideNo: pathData.pathologySlideNo ?? "",
            primaryTumorSite: pathData.primaryTumorSite ?? "",
            morphology: pathData.morphology ?? "",
            icdoTopography: pathData.icdoTopography ?? "",
            topographySite: pathData.topographySite ?? "",
            icdoMorphology: pathData.icdoMorphology ?? "",
            histologyMorphology: pathData.histologyMorphology ?? "",
            morphologyGrade: pathData.morphologyGrade ?? "",
            secondarySite: pathData.secondarySite ?? "",
            secondarySiteCode: pathData.secondarySiteCode ?? "",
            metastasisMorphology: pathData.metastasisMorphology ?? "",
            metastasisMorphologyCode: pathData.metastasisMorphologyCode ?? "",
            metastasisMorphologyGrade: pathData.metastasisMorphologyGrade ?? "",
            icd10Site: pathData.icd10Site ?? "",
            laterality: pathData.laterality ?? "",
            pairedLaterality: pathData.pairedLaterality ?? "",
            sequence: pathData.sequence ?? "",
            pathologyDateOfReporting: pathData.pathologyDateOfReporting ?? "",
          });
        } catch {
          setPathology(null);
          setEditPathology({});
        }
      }

      const habMap: Record<string, { answer: string; durationMonths: number | null }> = {};
      for (const h of hab) {
        habMap[h.habit] = { answer: h.answer, durationMonths: h.durationMonths };
      }
      setEditHabits(habMap);

      const compMap: Record<string, { answer: string; durationMonths: number | null }> = {};
      for (const c of comp) {
        compMap[c.comorbidity] = { answer: c.answer, durationMonths: c.durationMonths };
      }
      setEditComorbidities(compMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patient");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const enterEdit = () => {
    setSaveError(null);
    setSaveSuccess(false);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setSaveError(null);
    setSaveSuccess(false);
    // Reset editable values from loaded data, clearing months when answer is not YES
    if (patient) {
      setEditHealthScheme(patient.healthSchemeBeneficiary);
      setEditHealthSchemeDetails(patient.healthSchemeDetails ?? "");
      setEditRemarks(registrations[0]?.remarks ?? "");
      if (pathology) {
        setEditPathology({
          longestSymptomDurationMonths: pathology.longestSymptomDurationMonths?.toString() ?? "",
          anatomicalSite: pathology.anatomicalSite ?? "",
          pathologySlideNo: pathology.pathologySlideNo ?? "",
          primaryTumorSite: pathology.primaryTumorSite ?? "",
          morphology: pathology.morphology ?? "",
          icdoTopography: pathology.icdoTopography ?? "",
          topographySite: pathology.topographySite ?? "",
          icdoMorphology: pathology.icdoMorphology ?? "",
          histologyMorphology: pathology.histologyMorphology ?? "",
          morphologyGrade: pathology.morphologyGrade ?? "",
          secondarySite: pathology.secondarySite ?? "",
          secondarySiteCode: pathology.secondarySiteCode ?? "",
          metastasisMorphology: pathology.metastasisMorphology ?? "",
          metastasisMorphologyCode: pathology.metastasisMorphologyCode ?? "",
          metastasisMorphologyGrade: pathology.metastasisMorphologyGrade ?? "",
          icd10Site: pathology.icd10Site ?? "",
          laterality: pathology.laterality ?? "",
          pairedLaterality: pathology.pairedLaterality ?? "",
          sequence: pathology.sequence ?? "",
          pathologyDateOfReporting: pathology.pathologyDateOfReporting ?? "",
        });
      }
    }
    const habMap: Record<string, { answer: string; durationMonths: number | null }> = {};
    for (const h of habits) {
      habMap[h.habit] = {
        answer: h.answer,
        durationMonths: h.answer === "YES" ? h.durationMonths : null,
      };
    }
    setEditHabits(habMap);
    const compMap: Record<string, { answer: string; durationMonths: number | null }> = {};
    for (const c of comorbidities) {
      compMap[c.comorbidity] = {
        answer: c.answer,
        durationMonths: c.answer === "YES" ? c.durationMonths : null,
      };
    }
    setEditComorbidities(compMap);
  };

  const save = async () => {
    if (!patient) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Validate: "Yes" answers require a month value
      const validationErrors: string[] = [];
      for (const [key, val] of Object.entries(editHabits)) {
        if (val.answer === "YES" && (val.durationMonths === null || val.durationMonths === undefined)) {
          validationErrors.push(`Habits: "${key.replace(/_/g, " ").toLowerCase()}" requires a month value when Yes is selected`);
        }
      }
      for (const [key, val] of Object.entries(editComorbidities)) {
        if (val.answer === "YES" && (val.durationMonths === null || val.durationMonths === undefined)) {
          validationErrors.push(`Comorbidities: "${key}" requires a month value when Yes is selected`);
        }
      }
      if (validationErrors.length > 0) {
        setSaveError(validationErrors.join("; "));
        return;
      }

      // 1. Update patient-level fields (healthScheme)
      await patientApi.update(patientId, {
        healthSchemeBeneficiary: editHealthScheme,
        healthSchemeDetails: editHealthSchemeDetails || undefined,
      });

      // 2. Sync habits (update existing, create new)
      const HABIT_KEYS = ["SMOKING", "SMOKELESS", "BETEL_NUT_WITH_TOBACCO", "BETEL_NUT_WITHOUT_TOBACCO", "ALCOHOL"] as const;
      for (const key of HABIT_KEYS) {
        const val = editHabits[key];
        if (!val) continue;
        const existing = habits.find((h) => h.habit === key);
        if (existing) {
          if (existing.answer !== val.answer || existing.durationMonths !== val.durationMonths) {
            await sideApi.habits.update(patientId, existing.id, {
              answer: val.answer as "YES" | "NO" | "UNKNOWN",
              durationMonths: val.durationMonths ?? undefined,
            });
          }
        } else if (val.answer !== "UNKNOWN") {
          await sideApi.habits.create(patientId, {
            habit: key,
            answer: val.answer as "YES" | "NO" | "UNKNOWN",
            durationMonths: val.durationMonths ?? undefined,
          });
        }
      }

      // 3. Sync comorbidities (update existing, create new)
      for (const [key, val] of Object.entries(editComorbidities)) {
        if (!val) continue;
        const existing = comorbidities.find((c) => c.comorbidity === key);
        if (existing) {
          if (existing.answer !== val.answer || existing.durationMonths !== val.durationMonths) {
            await sideApi.comorbidities.update(patientId, existing.id, {
              answer: val.answer as "YES" | "NO" | "UNKNOWN",
              durationMonths: val.durationMonths ?? undefined,
            });
          }
        } else if (val.answer !== "UNKNOWN") {
          await sideApi.comorbidities.create(patientId, {
            comorbidity: key,
            answer: val.answer as "YES" | "NO" | "UNKNOWN",
            durationMonths: val.durationMonths ?? undefined,
          });
        }
      }

      // 4. Save remarks to registration
      if (registrations[0]) {
        await registrationApi.update(registrations[0].id, {
          remarks: editRemarks || undefined,
        });
      }

      // 5. Save pathological diagnosis
      if (registrations[0] && Object.keys(editPathology).length > 0) {
        const pathologyData: Record<string, string | number | null> = {};
        for (const [key, value] of Object.entries(editPathology)) {
          if (value === "") {
            pathologyData[key] = null;
          } else if (key === "longestSymptomDurationMonths" && value !== "") {
            pathologyData[key] = Number(value);
          } else {
            pathologyData[key] = value;
          }
        }
        await pathologyApi.upsert(registrations[0].id, pathologyData);
      }

      setSaveSuccess(true);
      setEditMode(false);
      // Reload data to reflect changes
      await loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#087888]" />
        <span className="ml-3 text-sm text-[#82979e]">Loading patient details…</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[#087888]">
          <ArrowLeft size={16} /> Back to Patient Records
        </button>
        <p className="text-sm text-[#d04a4a]">{error || "Patient not found"}</p>
      </div>
    );
  }

  const reg = registrations[0];
  const aadhaar = patient.identifications?.find((i) => i.idType === "AADHAAR");
  const voterId = patient.identifications?.find((i) => i.idType === "VOTER_ID");
  const abha = patient.identifications?.find((i) => i.idType === "ABHA");
  const passport = patient.identifications?.find((i) => i.idType === "PASSPORT");
  const abPmjay = patient.identifications?.find((i) => i.idType === "AB_PMJAY");
  const otherIds = patient.identifications?.filter((i) => i.idType === "OTHER") ?? [];
  const residential = patient.addresses?.find((a) => a.addressType === "RESIDENTIAL");
  const permanent = patient.addresses?.find((a) => a.addressType === "PERMANENT");
  const father = patient.relatives?.find((r) => r.relationship === "FATHER");
  const mother = patient.relatives?.find((r) => r.relationship === "MOTHER");
  const spouse = patient.relatives?.find((r) => r.relationship === "SPOUSE");
  const otherRelative = patient.relatives?.find((r) => r.relationship === "OTHER");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-[#dce9eb] bg-white px-4 py-2.5 text-xs font-bold text-[#087888] transition hover:bg-[#e8f5f5]"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#103e54]">
              {patient.fullName}
            </h2>
            <p className="text-sm text-[#82979e]">
              {editMode ? "Editing patient record" : "Patient details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="rounded-lg bg-[#e8f6ec] px-3 py-1.5 text-xs font-bold text-[#30935c]">
              Saved successfully
            </span>
          )}
          {saveError && (
            <span className="rounded-lg bg-[#fde8e8] px-3 py-1.5 text-xs font-bold text-[#d04a4a]">
              {saveError}
            </span>
          )}
          {!editMode ? (
            <button
              onClick={enterEdit}
              className="flex items-center gap-2 rounded-xl bg-[#0b7d87] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#096a73]"
            >
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-[#dce9eb] bg-white px-4 py-2.5 text-xs font-bold text-[#6d858e] transition hover:bg-[#f0f4f5] disabled:opacity-50"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={() => void save()}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#0b7d87] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#096a73] disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Registration Summary — READ ONLY */}
      {reg && (
        <Section title="Registration Summary">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ReadField label="Reference No." value={reg.referenceNo ?? "—"} />
            <ReadField label="Registration No." value={deriveRegNo(reg)} />
            <ReadField label="Status" value={formatEnum(reg.status)} />
            <ReadField label="Date of Reporting" value={reg.dateOfReporting ?? "—"} />
            <ReadField label="Case Registered Through" value={formatEnum(reg.caseRegisteredThrough)} />
            <ReadField label="Type of Referral" value={formatEnum(reg.referralType)} />
            <ReadField label="Referral Facility" value={reg.referralFacilityName ?? "—"} />
            <ReadField label="Date of First Diagnosis" value={reg.dateOfFirstDiagnosis ?? "—"} />
            <ReadField label="Form Completed By" value={reg.formCompletedBy ?? "—"} />
            <ReadField label="Form Completion Date" value={reg.formCompletionDate ?? "—"} />
            <ReadField label="Hospital Reg No." value={reg.hospitalRegistrationNo ?? "—"} />
            <ReadField label="Remarks" value={reg.remarks ?? "—"} />
          </div>
        </Section>
      )}

      {/* Identifying Information — READ ONLY (except healthScheme) */}
      <Section title="Identifying Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadField label="Full Name" value={patient.fullName} />
          <ReadField label="First Name" value={patient.firstName ?? "—"} />
          <ReadField label="Middle Name" value={patient.middleName ?? "—"} />
          <ReadField label="Last Name" value={patient.lastName ?? "—"} />
          <ReadField label="Age" value={patient.age != null ? String(patient.age) : "—"} />
          <ReadField label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
          <ReadField label="Sex" value={formatGender(patient.gender)} />
          {/* Health Scheme — EDITABLE */}
          <EditSelectField
            label="Health Scheme Beneficiary"
            value={editHealthScheme}
            onChange={setEditHealthScheme}
            editMode={editMode}
            readOnly={false}
          />
          {editHealthScheme && (
            <EditTextField
              label="Health Scheme Details"
              value={editHealthSchemeDetails}
              onChange={setEditHealthSchemeDetails}
              editMode={editMode}
              readOnly={false}
            />
          )}
          {!editHealthScheme && (
            <ReadField label="Health Scheme Details" value="—" />
          )}
        </div>
      </Section>

      {/* Identification Documents — READ ONLY */}
      <Section title="Identification Documents">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadField label="Aadhaar" value={aadhaar?.number ?? "—"} />
          <ReadField label="Voter ID" value={voterId?.number ?? "—"} />
          <ReadField label="ABHA (Health ID)" value={abha?.number ?? "—"} />
          <ReadField label="Passport" value={passport?.number ?? "—"} />
          <ReadField label="AB-PMJAY ID" value={abPmjay?.number ?? "—"} />
          {otherIds.map((id, idx) => (
            <ReadField key={id.id} label={`Other ID ${idx + 1}`} value={id.number} />
          ))}
          {otherIds.length === 0 && <ReadField label="Other Beneficiary Numbers" value="—" />}
        </div>
      </Section>

      {/* 14. Relative details — exact match of registration form */}
      <section className="rounded-2xl border border-[#dcebef] bg-white p-5 sm:p-6">
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          14. Relative details
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <Field label="Father name" value={father?.name ?? ""} readOnly placeholder="—" />
          <Field label="Father mobile number" value={father?.mobileNumber ?? ""} readOnly placeholder="—" />
          <Field label="Mother name" value={mother?.name ?? ""} readOnly placeholder="—" />
          <Field label="Mother mobile number" value={mother?.mobileNumber ?? ""} readOnly placeholder="—" />
          <Field label="Spouse name" value={spouse?.name ?? ""} readOnly placeholder="—" />
          <Field label="Spouse mobile number" value={spouse?.mobileNumber ?? ""} readOnly placeholder="—" />
          <Field label="Other name" value={otherRelative?.name ?? ""} readOnly placeholder="—" />
          <Field label="Other mobile number" value={otherRelative?.mobileNumber ?? ""} readOnly placeholder="—" />
        </div>
      </section>

      {/* 15. Address — exact match of registration form */}
      <section className="rounded-2xl border border-[#dcebef] bg-white p-5 sm:p-6">
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          15. Address
        </label>
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#718991]">
          <span className="text-[11px] font-bold text-[#5d7a84]">
            Urban / Rural
          </span>
          <label className="flex items-center gap-1.5">
            <span className={`h-3.5 w-3.5 rounded-full border ${residential?.urbanRural === "URBAN" ? "border-[#0b7d87] bg-[#0b7d87]" : "border-[#c9dce0]"}`} />
            Urban
          </label>
          <label className="flex items-center gap-1.5">
            <span className={`h-3.5 w-3.5 rounded-full border ${residential?.urbanRural === "RURAL" ? "border-[#0b7d87] bg-[#0b7d87]" : "border-[#c9dce0]"}`} />
            Rural
          </label>
        </div>
        {(() => {
          const sameAsRes = residential && permanent && residential.flatHouseNo === permanent.flatHouseNo && residential.streetRoad === permanent.streetRoad && residential.city === permanent.city && residential.district === permanent.district && residential.state === permanent.state && residential.pinCode === permanent.pinCode;
          return (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Flat / House No." value={residential?.flatHouseNo ?? ""} readOnly placeholder="—" />
                <Field label="Ward No." value={residential?.wardNo ?? ""} readOnly placeholder="—" />
                <Field label="Street / Road" value={residential?.streetRoad ?? ""} readOnly placeholder="—" />
                <Field label="City" value={residential?.city ?? ""} readOnly placeholder="—" />
                <Field label="District" value={residential?.district ?? ""} readOnly placeholder="—" />
                <Field label="State" value={residential?.state ?? ""} readOnly placeholder="—" />
                <Field label="PIN Code" value={residential?.pinCode ?? ""} readOnly placeholder="—" />
                <Field label="Mobile number" value={residential?.mobileNumber ?? ""} readOnly placeholder="—" />
                <Field label="Email address" value={residential?.email ?? ""} readOnly placeholder="—" />
              </div>
              <label className="mt-4 flex items-center gap-2 text-xs text-[#718991]">
                <input type="checkbox" checked={!!sameAsRes} readOnly className="h-3.5 w-3.5 rounded border-[#c9dce0] accent-[#0b7d87]" />
                Residential Address is same as Permanent Address
              </label>
              {!sameAsRes && permanent && (
                <div className="mt-5 grid gap-4 rounded-xl border border-[#e7f0f1] bg-[#fbfdfd] p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Permanent Flat / House No." value={permanent.flatHouseNo ?? ""} readOnly placeholder="—" />
                  <Field label="Permanent Street / Road" value={permanent.streetRoad ?? ""} readOnly placeholder="—" />
                  <Field label="Permanent City" value={permanent.city ?? ""} readOnly placeholder="—" />
                  <Field label="Permanent District" value={permanent.district ?? ""} readOnly placeholder="—" />
                  <Field label="Permanent State" value={permanent.state ?? ""} readOnly placeholder="—" />
                  <Field label="Permanent PIN Code" value={permanent.pinCode ?? ""} readOnly placeholder="—" />
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* 18(a). Habits — matches ToggleDetails layout exactly */}
      <section className="rounded-2xl border border-[#dcebef] bg-white p-5 sm:p-6">
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          18(a). Habits
        </label>
        {editMode ? (
          <ToggleDetailsEditable
            items={["Smoking", "Smokeless", "Betel Nut with Tobacco", "Betel Nut without Tobacco", "Alcohol"]}
            values={editHabits}
            onChange={setEditHabits}
            labelToKey={HABIT_LABEL_TO_KEY}
          />
        ) : (
          <ToggleDetailsReadOnly
            items={["Smoking", "Smokeless", "Betel Nut with Tobacco", "Betel Nut without Tobacco", "Alcohol"]}
            habits={habits}
          />
        )}
      </section>

      {/* 18(b). Co-Morbidities — matches ToggleDetails layout exactly */}
      <section className="rounded-2xl border border-[#dcebef] bg-white p-5 sm:p-6">
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          18(b). Co-Morbidities
        </label>
        {editMode ? (
          <ToggleDetailsEditable
            items={["Tuberculosis", "Hypertension", "Diabetes", "Ischemic Heart Disease", "COPD / Asthma", "Stroke", "Depression", "Hepatitis B", "Hepatitis C", "NAFLD", "Chronic Kidney Disease", "HIV/AIDS", "Hypothyroidism", "Others"]}
            values={editComorbidities}
            onChange={setEditComorbidities}
            labelToKey={COMORBIDITY_LABEL_TO_KEY}
          />
        ) : (
          <ToggleDetailsReadOnly
            items={["Tuberculosis", "Hypertension", "Diabetes", "Ischemic Heart Disease", "COPD / Asthma", "Stroke", "Depression", "Hepatitis B", "Hepatitis C", "NAFLD", "Chronic Kidney Disease", "HIV/AIDS", "Hypothyroidism", "Others"]}
            comorbidities={comorbidities}
          />
        )}
      </section>

      {/* Treatment — READ ONLY */}
      {reg?.treatments && reg.treatments.length > 0 && (
        <Section title="Treatment">
          {reg.treatments.map((t) => (
            <div key={t.id} className="mb-4 rounded-lg border border-[#edf3f4] p-4">
              <p className="mb-2 text-xs font-bold text-[#103e54]">
                {formatEnum(t.treatmentStage)}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ReadField label="Treatment Type" value={formatEnum(t.treatmentType)} />
                <ReadField label="Staging System" value={formatEnum(t.stagingSystem)} />
                <ReadField label="Staging Value" value={t.stagingSystemValue ?? "—"} />
                <ReadField label="T (TNM)" value={t.tnmT ?? "—"} />
                <ReadField label="N (TNM)" value={t.tnmN ?? "—"} />
                <ReadField label="M (TNM)" value={t.tnmM ?? "—"} />
                <ReadField label="Composite Stage" value={t.compositeStage ?? "—"} />
                <ReadField label="ECOG Status" value={formatEnum(t.ecogStatus)} />
                <ReadField label="ECOG Grade" value={formatEnum(t.ecogGrade)} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Remarks — EDITABLE */}
      <Section title="Remarks" editable>
        {editMode ? (
          <textarea
            value={editRemarks}
            onChange={(e) => setEditRemarks(e.target.value)}
            rows={3}
            placeholder="Enter remarks..."
            className="w-full rounded-lg border border-[#dce9eb] bg-white px-3 py-2 text-xs text-[#244c5b] outline-none focus:border-[#36a99c] resize-y"
          />
        ) : (
          <p className="text-sm text-[#52707b] whitespace-pre-wrap">{reg?.remarks || '—'}</p>
        )}
      </Section>

      {/* Diagnostic Details — EDITABLE */}
      <Section title="Diagnostic Details" editable>
        {editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <EditTextField
                label="Longest Duration of Symptom (Months)"
                value={editPathology.longestSymptomDurationMonths ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, longestSymptomDurationMonths: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="Anatomical Site"
                value={editPathology.anatomicalSite ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, anatomicalSite: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="Pathology Slide No."
                value={editPathology.pathologySlideNo ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, pathologySlideNo: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="Primary Tumour Site"
                value={editPathology.primaryTumorSite ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, primaryTumorSite: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="Morphology"
                value={editPathology.morphology ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, morphology: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="ICD-O-3 Topography"
                value={editPathology.icdoTopography ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, icdoTopography: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="Topography Site"
                value={editPathology.topographySite ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, topographySite: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="ICD-O-3 Morphology"
                value={editPathology.icdoMorphology ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, icdoMorphology: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="Histology/Morphology"
                value={editPathology.histologyMorphology ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, histologyMorphology: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="Morphology Grade"
                value={editPathology.morphologyGrade ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, morphologyGrade: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="Secondary Site"
                value={editPathology.secondarySite ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, secondarySite: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="ICD-10 Site"
                value={editPathology.icd10Site ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, icd10Site: v })}
                editMode={true}
                readOnly={false}
              />
              <EditTextField
                label="Laterality"
                value={editPathology.laterality ?? ""}
                onChange={(v) => setEditPathology({ ...editPathology, laterality: v })}
                editMode={true}
                readOnly={false}
              />
            </div>
          </div>
        ) : pathology ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ReadField label="Longest Duration of Symptom (Months)" value={pathology.longestSymptomDurationMonths?.toString() ?? "—"} />
            <ReadField label="Anatomical Site" value={pathology.anatomicalSite ?? "—"} />
            <ReadField label="Pathology Slide No." value={pathology.pathologySlideNo ?? "—"} />
            <ReadField label="Primary Tumour Site" value={pathology.primaryTumorSite ?? "—"} />
            <ReadField label="Morphology" value={pathology.morphology ?? "—"} />
            <ReadField label="ICD-O-3 Topography" value={pathology.icdoTopography ?? "—"} />
            <ReadField label="Topography Site" value={pathology.topographySite ?? "—"} />
            <ReadField label="ICD-O-3 Morphology" value={pathology.icdoMorphology ?? "—"} />
            <ReadField label="Histology/Morphology" value={pathology.histologyMorphology ?? "—"} />
            <ReadField label="Morphology Grade" value={pathology.morphologyGrade ?? "—"} />
            <ReadField label="Secondary Site" value={pathology.secondarySite ?? "—"} />
            <ReadField label="ICD-10 Site" value={pathology.icd10Site ?? "—"} />
            <ReadField label="Laterality" value={pathology.laterality ?? "—"} />
          </div>
        ) : (
          <p className="text-sm text-[#82979e] italic">No diagnostic details available.</p>
        )}
      </Section>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────

function Section({
  title,
  children,
  editable,
}: {
  title: string;
  children: React.ReactNode;
  editable?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e3edef] bg-white shadow-[0_5px_20px_rgba(25,73,89,.035)]">
      <div className="border-b border-[#edf3f4] px-5 py-4 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-[#103e54]">{title}</h3>
        {editable && (
          <span className="rounded-full bg-[#e8f5f5] px-2.5 py-1 text-[10px] font-bold text-[#087888]">
            Editable
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6]">
          {label}
        </label>
      )}
      <div className="h-10 w-full rounded-lg border border-[#edf3f4] bg-[#f8fbfb] px-3 text-xs leading-10 text-[#244c5b]">
        {value}
      </div>
    </div>
  );
}

function EditTextField({
  label,
  value,
  onChange,
  editMode,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editMode: boolean;
  readOnly: boolean;
}) {
  if (!editMode || readOnly) {
    return <ReadField label={label} value={value || "—"} />;
  }
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6]">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-[#dce9eb] bg-white px-3 text-xs text-[#244c5b] outline-none focus:border-[#36a99c]"
      />
    </div>
  );
}

function EditSelectField({
  label,
  value,
  onChange,
  editMode,
  readOnly,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  editMode: boolean;
  readOnly: boolean;
}) {
  if (!editMode || readOnly) {
    return <ReadField label={label} value={value ? "Yes" : "No"} />;
  }
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6]">
        {label}
      </label>
      <select
        value={value ? "true" : "false"}
        onChange={(e) => onChange(e.target.value === "true")}
        className="h-10 w-full rounded-lg border border-[#dce9eb] bg-white px-3 text-xs text-[#244c5b] outline-none focus:border-[#36a99c]"
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>
  );
}

// ─── Formatting helpers ───────────────────────────────────────

function formatEnum(val: string | null | undefined): string {
  if (!val) return "—";
  return val
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatGender(g: string): string {
  if (g === "MALE") return "Male";
  if (g === "FEMALE") return "Female";
  return "Other";
}

function deriveRegNo(reg: ApiRegistration): string {
  const ref = reg.referenceNo;
  if (!ref) return reg.hbcrRegistrationNo;
  const d = new Date(reg.createdAt);
  if (Number.isNaN(d.getTime())) return reg.hbcrRegistrationNo;
  const yearSuffix = String(d.getFullYear()).slice(-2);
  return `${yearSuffix}${ref.slice(-5)}`;
}

// ─── ToggleDetails — read-only and editable (matches FormFields.tsx layout) ───

const HABIT_LABEL_TO_KEY: Record<string, string> = {
  Smoking: "SMOKING",
  Smokeless: "SMOKELESS",
  "Betel Nut with Tobacco": "BETEL_NUT_WITH_TOBACCO",
  "Betel Nut without Tobacco": "BETEL_NUT_WITHOUT_TOBACCO",
  Alcohol: "ALCOHOL",
};

const COMORBIDITY_LABEL_TO_KEY: Record<string, string> = {
  Tuberculosis: "TUBERCULOSIS",
  Hypertension: "HYPERTENSION",
  Diabetes: "DIABETES",
  "Ischemic Heart Disease": "ISCHEMIC_HEART_DISEASE",
  "COPD / Asthma": "COPD_ASTHMA",
  Stroke: "STROKE",
  Depression: "DEPRESSION",
  "Hepatitis B": "HEPATITIS_B",
  "Hepatitis C": "HEPATITIS_C",
  NAFLD: "NAFLD",
  "Chronic Kidney Disease": "CHRONIC_KIDNEY_DISEASE",
  "HIV/AIDS": "HIV_AIDS",
  Hypothyroidism: "HYPOTHYROIDISM",
  Others: "OTHERS",
};

type ToggleDetailsReadOnlyProps = {
  items: string[];
  habits?: { habit: string; answer: string; durationMonths: number | null }[];
  comorbidities?: { comorbidity: string; answer: string; durationMonths: number | null }[];
};

/** Read-only replica of ToggleDetails from FormFields.tsx — same CSS layout. */
function ToggleDetailsReadOnly({ items, habits, comorbidities }: ToggleDetailsReadOnlyProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        let answer = "UNKNOWN";
        let durationMonths: number | null = null;
        if (habits) {
          const key = HABIT_LABEL_TO_KEY[item] ?? item;
          const match = habits.find((h) => h.habit === key);
          if (match) { answer = match.answer; durationMonths = match.durationMonths; }
        } else if (comorbidities) {
          const key = COMORBIDITY_LABEL_TO_KEY[item] ?? item;
          const match = comorbidities.find((c) => c.comorbidity === key);
          if (match) { answer = match.answer; durationMonths = match.durationMonths; }
        }
        const isEnabled = answer === "YES";
        return (
          <div key={item} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#718991]">
            <span className="w-40">{item}</span>
            <label className="flex items-center gap-1.5">
              <span className={`h-3.5 w-3.5 rounded-full border ${answer === "YES" ? "border-[#0b7d87] bg-[#0b7d87]" : "border-[#c9dce0]"}`} />
              Yes
            </label>
            <label className="flex items-center gap-1.5">
              <span className={`h-3.5 w-3.5 rounded-full border ${answer === "NO" ? "border-[#0b7d87] bg-[#0b7d87]" : "border-[#c9dce0]"}`} />
              No
            </label>
            <input
              readOnly
              disabled={!isEnabled}
              placeholder="Duration (Months)"
              type="number"
              value={isEnabled ? (durationMonths ?? "") : ""}
              className={`h-8 w-36 rounded-lg border px-2 text-[11px] ${
                isEnabled
                  ? "border-[#e4edef] bg-[#f2f6f7] font-semibold text-[#244c5b]"
                  : "cursor-not-allowed border-[#edf3f4] bg-[#f1f5f5] text-[#a9b8bc]"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

type ToggleDetailsEditableProps = {
  items: string[];
  values: Record<string, { answer: string; durationMonths: number | null }>;
  onChange: (v: Record<string, { answer: string; durationMonths: number | null }>) => void;
  labelToKey?: Record<string, string>;
};

/** Editable ToggleDetails — same layout as FormFields.tsx ToggleDetails with form context. */
/** Editable ToggleDetails — same layout as FormFields.tsx ToggleDetails with form context. */
function ToggleDetailsEditable({ items, values, onChange, labelToKey }: ToggleDetailsEditableProps & { labelToKey: Record<string, string> }) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const key = labelToKey[item] ?? item;
        const val = values[key] ?? { answer: "UNKNOWN", durationMonths: null };
        const isEnabled = val.answer === "YES";
        return (
          <div key={item} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#718991]">
            <span className="w-40">{item}</span>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name={`toggle-${item}`}
                checked={val.answer === "YES"}
                onChange={() =>
                  onChange({
                    ...values,
                    [key]: {
                      answer: "YES",
                      durationMonths: val.durationMonths,
                    },
                  })
                }
                className="accent-[#0b7d87]"
              />
              Yes
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name={`toggle-${item}`}
                checked={val.answer === "NO"}
                onChange={() =>
                  onChange({
                    ...values,
                    [key]: { answer: "NO", durationMonths: null },
                  })
                }
                className="accent-[#0b7d87]"
              />
              No
            </label>
            <input
              disabled={!isEnabled}
              placeholder="Duration (Months)"
              type="number"
              value={isEnabled ? (val.durationMonths ?? "") : ""}
              onChange={(e) =>
                onChange({
                  ...values,
                  [key]: {
                    ...val,
                    durationMonths: e.target.value ? Number(e.target.value) : null,
                  },
                })
              }
              className={`h-8 w-36 rounded-lg border px-2 text-[11px] ${
                isEnabled
                  ? "border-[#dce9eb] bg-[#fbfdfd] outline-none focus:border-[#36a99c]"
                  : "cursor-not-allowed border-[#edf3f4] bg-[#f1f5f5] text-[#a9b8bc]"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
