import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { followUpApi, type FollowUpRegistrationDetail } from "@/lib/api";
import { FollowUpForm } from "./FollowUpForm";

type Props = {
  registrationId: number;
  /** Navigate away (back to the details page) after save or cancel. */
  onDone: () => void;
};

/**
 * Dedicated page for creating a new follow-up visit. Shows a compact
 * read-only patient header for context, then the create form. The next
 * Visit No. is assigned automatically by the backend — there is no manual
 * visit-number entry anywhere.
 */
export function FollowUpNewVisit({ registrationId, onDone }: Props) {
  const [detail, setDetail] = useState<FollowUpRegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    followUpApi
      .registrationDetail(registrationId)
      .then((d) => {
        if (active) setDetail(d);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Could not load the patient");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [registrationId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#6c828c] transition hover:bg-white hover:text-[#103e54]"
        >
          <ArrowLeft size={14} /> Back to follow-up details
        </button>
      </div>

      {loading && (
        <section className="rounded-2xl border border-[#dcebef] bg-white p-8 text-center text-xs text-[#8aa0a7]">
          Loading patient record…
        </section>
      )}

      {error && !detail && (
        <section className="rounded-2xl border border-[#dcebef] bg-white p-8 text-center">
          <p className="text-xs font-medium text-[#b34040]">{error}</p>
          <button
            type="button"
            onClick={onDone}
            className="mt-4 rounded-xl border border-[#dce9eb] px-5 py-2 text-xs font-bold text-[#0b7d87] transition hover:bg-[#eef8f7]"
          >
            Back
          </button>
        </section>
      )}

      {detail && (
        <>
          <section className="rounded-2xl border border-[#dcebef] bg-white p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-bold text-[#103e54]">New Follow-up</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
                  HBCR Registration Number
                </span>
                <input
                  readOnly
                  value={detail.hbcrRegistrationNo}
                  className="h-10 w-full cursor-not-allowed rounded-lg border border-[#e4edef] bg-[#f2f6f7] px-3 text-xs font-semibold text-[#244c5b]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
                  Patient Name
                </span>
                <input
                  readOnly
                  value={`${detail.patient.fullName}${detail.patient.age ? `, ${detail.patient.age}` : ""}`}
                  className="h-10 w-full cursor-not-allowed rounded-lg border border-[#e4edef] bg-[#f2f6f7] px-3 text-xs font-semibold text-[#244c5b]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
                  ICD-10 Code
                </span>
                <input
                  readOnly
                  value={detail.icd10Code ?? "—"}
                  className="h-10 w-full cursor-not-allowed rounded-lg border border-[#e4edef] bg-[#f2f6f7] px-3 text-xs font-semibold text-[#244c5b]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
                  Visit No.
                </span>
                <input
                  readOnly
                  value={String(detail.nextVisitNo)}
                  className="h-10 w-full cursor-not-allowed rounded-lg border border-[#e4edef] bg-[#f2f6f7] px-3 text-xs font-bold text-[#244c5b]"
                />
                <span className="mt-1 block text-[10px] text-[#8aa0a7]">
                  Auto-generated — {detail.visits.length === 0
                    ? "first follow-up visit"
                    : `${detail.visits.length} existing visit${detail.visits.length === 1 ? "" : "s"}`}
                </span>
              </label>
            </div>
          </section>

          <FollowUpForm
            registrationId={detail.registrationId}
            formKey={0}
            onSaved={onDone}
            onCancel={onDone}
          />
        </>
      )}
    </div>
  );
}
