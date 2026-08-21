import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  followUpApi,
  type ApiFollowUp,
  type FollowUpRegistrationDetail,
} from "@/lib/api";
import {
  DEATH_INFO_SOURCE_OPTIONS,
  DISEASE_STATUS_OPTIONS,
  FOLLOW_UP_METHOD_OPTIONS,
  FOLLOW_UP_MODALITIES,
  PLACE_OF_DEATH_OPTIONS,
  VITAL_STATUS_OPTIONS,
  optionLabel,
} from "./options";

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">{label}</span>
      <input
        readOnly
        value={value}
        className="h-10 w-full cursor-not-allowed rounded-lg border border-[#e4edef] bg-[#f2f6f7] px-3 text-xs font-semibold text-[#244c5b]"
      />
    </label>
  );
}

/** One read-only visit card — the complete data of a single follow-up visit. */
function VisitCard({ visit }: { visit: ApiFollowUp }) {
  const isHospitalVisit = visit.methodOfFollowUp === "HOSPITAL_VISIT";
  const isDead = visit.vitalStatus === "DEAD";
  return (
    <div className="rounded-xl border border-[#e0ebed] bg-[#fafdfd] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-[#0b7d87]/10 px-2.5 py-1 text-[10px] font-extrabold text-[#0b7d87]">
          Visit {visit.visitNo}
        </span>
        <span className="text-[11px] text-[#8aa0a7]">{fmtDate(visit.dateOfFollowUp)}</span>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs text-[#486b77] sm:grid-cols-2 lg:grid-cols-3">
        <p>
          <span className="text-[#93a9b1]">Method:</span>{" "}
          <span className="font-semibold">
            {optionLabel(FOLLOW_UP_METHOD_OPTIONS, visit.methodOfFollowUp)}
          </span>
        </p>
        <p>
          <span className="text-[#93a9b1]">Vital Status:</span>{" "}
          <span className="font-semibold">
            {optionLabel(VITAL_STATUS_OPTIONS, visit.vitalStatus)}
          </span>
        </p>
        {isHospitalVisit && (
          <p>
            <span className="text-[#93a9b1]">Disease Status:</span>{" "}
            <span className="font-semibold">
              {optionLabel(DISEASE_STATUS_OPTIONS, visit.diseaseStatus)}
            </span>
          </p>
        )}
        {isHospitalVisit && visit.dateOfFirstRecurrence && (
          <p>
            <span className="text-[#93a9b1]">First Recurrence:</span>{" "}
            <span className="font-semibold">{fmtDate(visit.dateOfFirstRecurrence)}</span>
          </p>
        )}
        {isHospitalVisit && visit.treatmentGiven !== null && (
          <p>
            <span className="text-[#93a9b1]">Treatment:</span>{" "}
            <span className="font-semibold">
              {visit.treatmentGiven ? "Yes" : "No"}
              {visit.treatmentGiven && visit.treatmentType
                ? ` · ${optionLabel(
                    [
                      { value: "ALLOPATHIC", label: "Allopathic" },
                      { value: "NON_ALLOPATHIC", label: "Non-Allopathic" },
                      { value: "BOTH", label: "Both" },
                    ],
                    visit.treatmentType,
                  )}`
                : ""}
            </span>
          </p>
        )}
        {isDead && (
          <>
            <p>
              <span className="text-[#93a9b1]">Date of Death:</span>{" "}
              <span className="font-semibold">{fmtDate(visit.dateOfDeath)}</span>
            </p>
            <p>
              <span className="text-[#93a9b1]">Place of Death:</span>{" "}
              <span className="font-semibold">
                {optionLabel(PLACE_OF_DEATH_OPTIONS, visit.placeOfDeath)}
              </span>
            </p>
            {visit.placeOfDeath === "OTHERS" && (
              <p>
                <span className="text-[#93a9b1]">Source of Death Info:</span>{" "}
                <span className="font-semibold">
                  {optionLabel(DEATH_INFO_SOURCE_OPTIONS, visit.sourceOfDeathInfo)}
                </span>
              </p>
            )}
            {visit.placeOfDeath === "RI" &&
              (visit.causeIa || visit.causeIb || visit.causeIc || visit.causeIi) && (
                <p className="sm:col-span-2 lg:col-span-3">
                  <span className="text-[#93a9b1]">Cause of Death:</span>{" "}
                  <span className="font-semibold">
                    {[visit.causeIa, visit.causeIb, visit.causeIc, visit.causeIi]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </p>
              )}
            {visit.icd10Ucod && (
              <p>
                <span className="text-[#93a9b1]">ICD-10 UCOD:</span>{" "}
                <span className="font-semibold">{visit.icd10Ucod}</span>
              </p>
            )}
            {visit.majorCauseGroupUcod && (
              <p>
                <span className="text-[#93a9b1]">Major Cause Group:</span>{" "}
                <span className="font-semibold">{visit.majorCauseGroupUcod}</span>
              </p>
            )}
          </>
        )}
        {visit.formCompletedBy && (
          <p>
            <span className="text-[#93a9b1]">Completed by:</span>{" "}
            <span className="font-semibold">{visit.formCompletedBy}</span>
            {visit.dateOfCompletion ? ` (${fmtDate(visit.dateOfCompletion)})` : ""}
          </p>
        )}
      </div>

      {visit.treatments.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-[#e0ebed] bg-white">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#e7f0f1] text-[#93a9b1]">
                <th className="px-3 py-2 font-bold">Modality</th>
                <th className="px-3 py-2 font-bold">Starting Date</th>
                <th className="px-3 py-2 font-bold">Ending Date</th>
              </tr>
            </thead>
            <tbody>
              {visit.treatments.map((t) => (
                <tr key={t.id} className="border-b border-[#f0f5f6] last:border-0">
                  <td className="px-3 py-2 font-semibold text-[#486b77]">
                    {optionLabel(FOLLOW_UP_MODALITIES, t.modality)}
                  </td>
                  <td className="px-3 py-2 text-[#486b77]">{fmtDate(t.startDate)}</td>
                  <td className="px-3 py-2 text-[#486b77]">
                    {t.modality === "SURGERY" ? "—" : fmtDate(t.endDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type Props = {
  registrationId: number;
  onBack: () => void;
  /** Opens the dedicated New Follow-up page (separate route). */
  onAddNew: () => void;
};

/**
 * Follow-up Details page for one registration: read-only patient header,
 * a read-only Visit No. display (browsed with prev/next arrows over the
 * existing visits — never manually entered), and the selected visit's
 * complete data in view mode. "Add New Follow-up" opens the dedicated
 * create page, which adds a brand-new visit without touching previous ones.
 */
export function FollowUpDetails({ registrationId, onBack, onAddNew }: Props) {
  const [detail, setDetail] = useState<FollowUpRegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisitNo, setSelectedVisitNo] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await followUpApi.registrationDetail(registrationId);
      setDetail(d);
      setSelectedVisitNo(
        d.visits.length > 0 ? d.visits[d.visits.length - 1].visitNo : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the patient record");
    } finally {
      setLoading(false);
    }
  }, [registrationId]);

  useEffect(() => {
    void load();
  }, [load]);


  const visibleVisit =
    detail?.visits.find((v) => v.visitNo === selectedVisitNo) ??
    (detail && detail.visits.length > 0 ? detail.visits[detail.visits.length - 1] : null);

  if (loading) {
    return (
      <section className="rounded-2xl border border-[#dcebef] bg-white p-8 text-center text-xs text-[#8aa0a7]">
        Loading patient record…
      </section>
    );
  }

  if (error || !detail) {
    return (
      <section className="rounded-2xl border border-[#dcebef] bg-white p-8 text-center">
        <p className="text-xs font-medium text-[#b34040]">{error ?? "Record not found"}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-xl border border-[#dce9eb] px-5 py-2 text-xs font-bold text-[#0b7d87] transition hover:bg-[#eef8f7]"
        >
          Back to search
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#6c828c] transition hover:bg-white hover:text-[#103e54]"
        >
          <ArrowLeft size={14} /> Back to search
        </button>
        <button
          type="button"
          onClick={onAddNew}
          className="flex items-center gap-1.5 rounded-xl bg-[#0b7d87] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#096a73]"
        >
          <Plus size={14} strokeWidth={2.5} /> Add New Follow-up
        </button>
      </div>

      {/* Read-only patient header */}
      <section className="rounded-2xl border border-[#dcebef] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-bold text-[#103e54]">Patient Follow-up Record</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReadOnlyField label="HBCR Registration Number" value={detail.hbcrRegistrationNo} />
          <div>
            <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
              Visit No.
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setSelectedVisitNo((cur) =>
                    cur && cur > detail.visits[0].visitNo ? cur - 1 : cur,
                  )
                }
                disabled={detail.visits.length === 0 || (selectedVisitNo ?? 0) <= detail.visits[0].visitNo}
                aria-label="Previous visit"
                className="flex h-10 w-9 items-center justify-center rounded-lg border border-[#dce9eb] bg-white text-[#0b7d87] transition hover:bg-[#eef8f7] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronLeft size={15} />
              </button>
              <input
                readOnly
                value={
                  detail.visits.length === 0
                    ? String(detail.nextVisitNo)
                    : String(visibleVisit?.visitNo ?? detail.visits[detail.visits.length - 1].visitNo)
                }
                className="h-10 w-20 text-center text-xs font-bold text-[#244c5b]"
                style={{
                  border: "1px solid #e4edef",
                  background: "#f2f6f7",
                  borderRadius: "0.5rem",
                  cursor: "not-allowed",
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setSelectedVisitNo((cur) =>
                    cur === null || cur < detail.visits[detail.visits.length - 1].visitNo
                      ? (cur ?? detail.visits[0].visitNo - 1) + 1
                      : cur,
                  )
                }
                disabled={detail.visits.length === 0 || (selectedVisitNo ?? 0) >= detail.visits[detail.visits.length - 1].visitNo}
                aria-label="Next visit"
                className="flex h-10 w-9 items-center justify-center rounded-lg border border-[#dce9eb] bg-white text-[#0b7d87] transition hover:bg-[#eef8f7] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-[#8aa0a7]">
              {detail.visits.length === 0
                ? "No visits yet — next visit will be " + detail.nextVisitNo
                : `Visit ${selectedVisitNo ?? detail.visits[detail.visits.length - 1].visitNo} of ${detail.visits.length} · auto-generated`}
            </p>
          </div>
          <ReadOnlyField
            label="Patient Name"
            value={`${detail.patient.fullName}${detail.patient.age ? `, ${detail.patient.age} yrs` : ""}`}
          />
          <ReadOnlyField label="ICD-10 Code" value={detail.icd10Code ?? "—"} />
        </div>
        {(detail.referenceNo || detail.hospitalRegistrationNo) && (
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-[11px] text-[#8aa0a7]">
            {detail.referenceNo && <span>Reference No: {detail.referenceNo}</span>}
            {detail.hospitalRegistrationNo && (
              <span>Hospital Reg. No: {detail.hospitalRegistrationNo}</span>
            )}
          </div>
        )}
      </section>

      {/* Selected visit — read-only */}
      <section className="rounded-2xl border border-[#dcebef] bg-white p-5 sm:p-6">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#93a9b1]">
          Visit details
        </p>
        {detail.visits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#d5e4e7] bg-[#fafdfd] px-4 py-6 text-center text-xs text-[#8aa0a7]">
            No follow-up visits recorded yet. Click "+ Add New Follow-up" to record the
            first visit.
          </p>
        ) : visibleVisit ? (
          <VisitCard visit={visibleVisit} />
        ) : (
          <p className="text-xs text-[#8aa0a7]">Select a visit number above to view it.</p>
        )}
      </section>

    </div>
  );
}
