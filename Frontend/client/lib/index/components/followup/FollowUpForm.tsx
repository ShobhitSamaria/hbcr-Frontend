import { useState } from "react";
import {
  followUpApi,
  type ApiFollowUp,
  type FollowUpCreateInput,
  type FollowUpMethod,
  type FollowUpModality,
  type VitalStatus,
} from "@/lib/api";
import { Field, SelectField } from "../FormFields";
import { Icdo10Autocomplete } from "../registration/Icdo10Autocomplete";
import {
  DEATH_INFO_SOURCE_OPTIONS,
  DISEASE_STATUS_OPTIONS,
  FOLLOW_UP_METHOD_OPTIONS,
  FOLLOW_UP_MODALITIES,
  PLACE_OF_DEATH_OPTIONS,
  TREATMENT_TYPE_OPTIONS,
  VITAL_STATUS_OPTIONS,
} from "./options";

type ModalityRow = {
  yes: boolean;
  startDate: string;
  endDate: string;
};

type Props = {
  registrationId: number;
  /** Counter that changes to force a full reset after a successful save. */
  formKey: number;
  onSaved: (visit: ApiFollowUp) => void;
  onCancel: () => void;
};

const EMPTY_MODALITY = (): ModalityRow => ({
  yes: false,
  startDate: "",
  endDate: "",
});

/** Prepends an explicit "Select…" option so an empty value is visibly empty
 *  instead of silently showing the first real option. */
const withPlaceholder = <T extends string>(
  opts: { value: T; label: string }[],
): { value: string; label: string }[] => [{ value: "", label: "Select…" }, ...opts];

const fmtDate = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
};

const dateInputCls = (disabled: boolean): string =>
  "h-9 w-full rounded-lg border border-[#dce9eb] bg-[#fbfdfd] px-2 text-xs text-[#244c5b] outline-none transition focus:border-[#36a99c] focus:ring-2 focus:ring-[#36a99c]/10 " +
  (disabled ? "cursor-not-allowed bg-[#eef2f3] text-[#9aafb5]" : "");

const radioCls = (disabled: boolean): string =>
  "accent-[#0b7d87] " + (disabled ? "opacity-40" : "");

/**
 * The 13-section Follow-up form. Every field is always visible — fields that
 * are not currently applicable are disabled instead of hidden, so the layout
 * matches the printed form and the user always sees what exists. The backend
 * validator still receives only the applicable fields on submit.
 *
 * Section gating:
 *   - 4-5 (disease status / treatment): method = Hospital visit
 *   - recurrence date: disease status = 5 (progression/recurrence)
 *   - treatment table: Treatment = Yes; Surgery never gets an End Date
 *   - 6-11 (death): vital status = Dead; source = place 8; causes = place 1
 */
export function FollowUpForm({ registrationId, formKey, onSaved, onCancel }: Props) {
  const [dateOfFollowUp, setDateOfFollowUp] = useState("");
  const [method, setMethod] = useState<FollowUpMethod | "">("");
  const [vitalStatus, setVitalStatus] = useState<VitalStatus | "">("");
  const [diseaseStatus, setDiseaseStatus] = useState("");
  const [dateOfFirstRecurrence, setDateOfFirstRecurrence] = useState("");
  const [treatmentGiven, setTreatmentGiven] = useState<boolean | null>(null);
  const [treatmentType, setTreatmentType] = useState("");
  const [modalities, setModalities] = useState<Record<FollowUpModality, ModalityRow>>(() =>
    Object.fromEntries(FOLLOW_UP_MODALITIES.map((m) => [m.value, EMPTY_MODALITY()])) as Record<
      FollowUpModality,
      ModalityRow
    >,
  );
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [placeOfDeath, setPlaceOfDeath] = useState("");
  const [sourceOfDeathInfo, setSourceOfDeathInfo] = useState("");
  const [causeIa, setCauseIa] = useState("");
  const [causeIb, setCauseIb] = useState("");
  const [causeIc, setCauseIc] = useState("");
  const [causeIi, setCauseIi] = useState("");
  const [icd10Ucod, setIcd10Ucod] = useState("");
  const [majorCauseGroupUcod, setMajorCauseGroupUcod] = useState("");
  const [formCompletedBy, setFormCompletedBy] = useState("");
  const [dateOfCompletion, setDateOfCompletion] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Applicability flags — the fields stay visible but get disabled.
  const isHospitalVisit = method === "HOSPITAL_VISIT";
  const isDead = vitalStatus === "DEAD";
  const isRecurrence = diseaseStatus === "CANCER_PROGRESSION_RECURRENCE";
  const showCauseFields = placeOfDeath === "RI";
  const treatmentEnabled = isHospitalVisit && treatmentGiven === true;

  const setModality = (m: FollowUpModality, patch: Partial<ModalityRow>) => {
    setModalities((prev) => ({ ...prev, [m]: { ...prev[m], ...patch } }));
  };

  /** Clears every hospital-visit field (disease status → treatment rows). */
  const resetHospitalSection = () => {
    setDiseaseStatus("");
    setDateOfFirstRecurrence("");
    setTreatmentGiven(null);
    resetTreatment();
  };

  /** Clears every death-related field (6-11). */
  const resetDeathSection = () => {
    setDateOfDeath("");
    setPlaceOfDeath("");
    setSourceOfDeathInfo("");
    setCauseIa("");
    setCauseIb("");
    setCauseIc("");
    setCauseIi("");
    setIcd10Ucod("");
    setMajorCauseGroupUcod("");
  };

  /** Clears treatment type + all modality rows. */
  const resetTreatment = () => {
    setTreatmentType("");
    setModalities((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k]) => [k, EMPTY_MODALITY()])) as Record<
        FollowUpModality,
        ModalityRow
      >,
    );
  };

  const validate = (): string | null => {
    if (!dateOfFollowUp) return "1. Date of Follow-up is required";
    if (!method) return "2. Method of Follow-up is required";
    if (!vitalStatus) return "3. Vital Status is required";
    if (isHospitalVisit && !diseaseStatus) return "4. Disease Status is required for a Hospital visit";
    if (isHospitalVisit && treatmentGiven === null)
      return "5. Treatment (Yes/No) is required for a Hospital visit";
    if (isHospitalVisit && treatmentGiven && !treatmentType)
      return "5.1 Type of Treatment Given is required when Treatment is Yes";
    if (isDead && !dateOfDeath) return "6. Date of Death is required when Vital Status is Dead";
    if (isDead && !placeOfDeath) return "7. Place of Death is required when Vital Status is Dead";
    if (placeOfDeath === "OTHERS" && !sourceOfDeathInfo)
      return "8. Source of Information on Death is required when Place of Death is Others";
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    const payload: FollowUpCreateInput = {
      registrationId,
      dateOfFollowUp: fmtDate(dateOfFollowUp),
      methodOfFollowUp: method as FollowUpMethod,
      vitalStatus: vitalStatus as VitalStatus,
    };
    if (isHospitalVisit) {
      payload.diseaseStatus = diseaseStatus as FollowUpCreateInput["diseaseStatus"];
      if (isRecurrence) payload.dateOfFirstRecurrence = fmtDate(dateOfFirstRecurrence);
      payload.treatmentGiven = treatmentGiven ?? false;
      if (treatmentGiven) {
        payload.treatmentType = treatmentType;
        const treatments = FOLLOW_UP_MODALITIES.filter((m) => modalities[m.value].yes).map((m) => {
          const row = modalities[m.value];
          return {
            modality: m.value,
            startDate: row.startDate ? fmtDate(row.startDate) : undefined,
            endDate:
              m.value !== "SURGERY" && row.endDate ? fmtDate(row.endDate) : undefined,
          };
        });
        if (treatments.length === 0) {
          setError("Select at least one treatment modality when Treatment is Yes");
          return;
        }
        payload.treatments = treatments;
      }
    }
    if (isDead) {
      payload.dateOfDeath = fmtDate(dateOfDeath);
      payload.placeOfDeath = placeOfDeath as FollowUpCreateInput["placeOfDeath"];
      if (placeOfDeath === "OTHERS")
        payload.sourceOfDeathInfo = sourceOfDeathInfo as FollowUpCreateInput["sourceOfDeathInfo"];
      if (showCauseFields) {
        payload.causeIa = causeIa.trim() || undefined;
        payload.causeIb = causeIb.trim() || undefined;
        payload.causeIc = causeIc.trim() || undefined;
        payload.causeIi = causeIi.trim() || undefined;
      }
      payload.icd10Ucod = icd10Ucod.trim() || undefined;
      payload.majorCauseGroupUcod = majorCauseGroupUcod.trim() || undefined;
    }
    payload.formCompletedBy = formCompletedBy.trim() || undefined;
    payload.dateOfCompletion = dateOfCompletion ? fmtDate(dateOfCompletion) : undefined;

    setSaving(true);
    try {
      const visit = await followUpApi.create(payload);
      onSaved(visit);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save the follow-up";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#dcebef] bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#103e54]">New Follow-up Visit</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#6c828c] transition hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#f3c1c1] bg-[#fdf1f1] px-3 py-2 text-xs font-medium text-[#b34040]">
          {error}
        </div>
      )}

      {/* ===== 1-3: always applicable ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="1. Date of Follow-up"
          type="date"
          value={dateOfFollowUp}
          onChange={setDateOfFollowUp}
        />
        <SelectField
          label="2. Method of Follow-up"
          options={withPlaceholder(FOLLOW_UP_METHOD_OPTIONS)}
          value={method}
          onChange={(v) => {
            setMethod(v as FollowUpMethod);
            // Any method change invalidates the previous hospital-visit answers.
            resetHospitalSection();
          }}
        />
        <SelectField
          label="3. Vital Status"
          options={withPlaceholder(VITAL_STATUS_OPTIONS)}
          value={vitalStatus}
          onChange={(v) => {
            setVitalStatus(v as VitalStatus);
            // Any vital-status change invalidates the previous death answers.
            resetDeathSection();
          }}
        />
      </div>

      {/* ===== 4-5: hospital visit section (always visible, disabled otherwise) ===== */}
      <div className="mt-6 rounded-xl border border-[#e7f0f1] bg-[#fafdfd] p-4">
        <p className="mb-3 text-xs font-bold text-[#486b77]">
          Hospital visit details {!isHospitalVisit && <span className="font-medium text-[#93a9b1]">(applicable when Method is Hospital visit)</span>}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label="4. Disease Status"
            options={withPlaceholder(DISEASE_STATUS_OPTIONS)}
            value={diseaseStatus}
            disabled={!isHospitalVisit}
            onChange={(v) => {
              setDiseaseStatus(v);
              // The recurrence date is only applicable for status 5.
              if (v !== "CANCER_PROGRESSION_RECURRENCE") setDateOfFirstRecurrence("");
            }}
          />
          <Field
            label="Date of First Recurrence"
            type="date"
            value={dateOfFirstRecurrence}
            disabled={!isRecurrence}
            onChange={setDateOfFirstRecurrence}
          />
        </div>

        {/* 5. Treatment */}
        <div className="mt-4">
          <span className="mb-2 block text-xs font-bold text-[#486b77]">
            5. Treatment {!isHospitalVisit && <span className="font-medium text-[#93a9b1]">(applicable when Method is Hospital visit)</span>}
          </span>
          <div className="flex items-center gap-5 text-xs text-[#718991]">
            {(["Yes", "No"] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="followup-treatment"
                  disabled={!isHospitalVisit}
                  checked={treatmentGiven === (opt === "Yes")}
                  onChange={() => {
                    setTreatmentGiven(opt === "Yes");
                    if (opt === "No") resetTreatment();
                  }}
                  className={radioCls(!isHospitalVisit)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* 5.1 + treatment table */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label="5.1 Type of Treatment Given"
            options={withPlaceholder(TREATMENT_TYPE_OPTIONS)}
            value={treatmentType}
            disabled={!treatmentEnabled}
            onChange={setTreatmentType}
          />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-[#486b77]">
            Treatment modalities {!treatmentEnabled && <span className="font-medium text-[#93a9b1]">(applicable when Treatment is Yes)</span>}
          </p>
          <div className="overflow-x-auto rounded-lg border border-[#e0ebed] bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e7f0f1] text-[#93a9b1]">
                  <th className="px-3 py-2.5 font-bold">Treatment</th>
                  <th className="px-3 py-2.5 font-bold">Yes/No</th>
                  <th className="px-3 py-2.5 font-bold">Start Date</th>
                  <th className="px-3 py-2.5 font-bold">End Date</th>
                </tr>
              </thead>
              <tbody>
                {FOLLOW_UP_MODALITIES.map(({ value, label }) => {
                  const row = modalities[value];
                  const rowDisabled = !treatmentEnabled;
                  const startDisabled = rowDisabled || !row.yes;
                  // Surgery: End Date is never applicable.
                  const endDisabled = value === "SURGERY" || startDisabled;
                  return (
                    <tr key={value} className="border-b border-[#f0f5f6] last:border-0">
                      <td className="px-3 py-2.5 font-semibold text-[#486b77]">{label}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          {(["Yes", "No"] as const).map((opt) => (
                            <label key={opt} className="flex items-center gap-1">
                              <input
                                type="radio"
                                name={`followup-modality-${value}`}
                                disabled={rowDisabled}
                                checked={row.yes === (opt === "Yes")}
                                onChange={() => setModality(value, { yes: opt === "Yes" })}
                                className={radioCls(rowDisabled)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="date"
                          value={row.startDate}
                          disabled={startDisabled}
                          onChange={(e) => setModality(value, { startDate: e.target.value })}
                          className={dateInputCls(startDisabled)}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="date"
                          value={value === "SURGERY" ? "" : row.endDate}
                          disabled={endDisabled}
                          onChange={(e) => setModality(value, { endDate: e.target.value })}
                          className={dateInputCls(endDisabled)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== 6-11: death section (always visible, disabled otherwise) ===== */}
      <div className="mt-6 rounded-xl border border-[#e7f0f1] bg-[#fafdfd] p-4">
        <p className="mb-3 text-xs font-bold text-[#486b77]">
          Death details {!isDead && <span className="font-medium text-[#93a9b1]">(applicable when Vital Status is Dead)</span>}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="6. Date of Death"
            type="date"
            value={dateOfDeath}
            disabled={!isDead}
            onChange={setDateOfDeath}
          />
          <SelectField
            label="7. Place of Death"
            options={withPlaceholder(PLACE_OF_DEATH_OPTIONS)}
            value={placeOfDeath}
            disabled={!isDead}
            onChange={(v) => {
              setPlaceOfDeath(v);
              // Source info applies only to Others; causes only to RI.
              setSourceOfDeathInfo("");
              setCauseIa("");
              setCauseIb("");
              setCauseIc("");
              setCauseIi("");
            }}
          />
          <SelectField
            label="8. Source of Information on Death"
            options={withPlaceholder(DEATH_INFO_SOURCE_OPTIONS)}
            value={sourceOfDeathInfo}
            disabled={placeOfDeath !== "OTHERS"}
            onChange={setSourceOfDeathInfo}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="9. IA Immediate Cause" value={causeIa} disabled={!showCauseFields} onChange={setCauseIa} />
          <Field label="9. IB Antecedent Cause" value={causeIb} disabled={!showCauseFields} onChange={setCauseIb} />
          <Field label="9. IC Immediate Cause" value={causeIc} disabled={!showCauseFields} onChange={setCauseIc} />
          <Field
            label="9. II Contributory/significant conditions"
            value={causeIi}
            disabled={!showCauseFields}
            onChange={setCauseIi}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <Icdo10Autocomplete
              key={`ucod-${formKey}`}
              label="10. ICD-10 of Underlying Cause of Death (UCOD)"
              placeholder="Search by code or term, e.g. C71"
              stateKey={`followup-ucod-${formKey}`}
              disabled={!isDead}
              onChange={setIcd10Ucod}
            />
          </div>
          <Field
            label="11. Major Cause Group of UCOD"
            value={majorCauseGroupUcod}
            disabled={!isDead}
            onChange={setMajorCauseGroupUcod}
          />
        </div>
      </div>

      {/* ===== 12-13: form completion (always applicable) ===== */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="12. Name of Person Completing Form (in capitals)"
          placeholder="DR. A. SRINIVASAN"
          value={formCompletedBy}
          onChange={(v) => setFormCompletedBy(v.toUpperCase())}
        />
        <Field
          label="13. Date of Completion of this Form"
          type="date"
          value={dateOfCompletion}
          onChange={setDateOfCompletion}
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#eef4f5] pt-5">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-xl bg-[#0b7d87] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#096a73] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Follow-up Visit"}
        </button>
      </div>
    </div>
  );
}
