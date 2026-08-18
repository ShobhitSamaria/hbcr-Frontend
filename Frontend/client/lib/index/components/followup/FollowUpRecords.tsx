import { useCallback, useState } from "react";
import { followUpApi, type FollowUpSearchHit } from "@/lib/api";
import { Field } from "../FormFields";

type Props = {
  /** Called when the user clicks an HBCR Registration Number. */
  onSelect: (registrationId: number) => void;
};

/**
 * Follow-up Records search page. Shows ONLY the matching patient table after
 * a search — the follow-up details live on a separate page (`/followup/:id`)
 * reached by clicking an HBCR Registration Number.
 */
export function FollowUpRecords({ onSelect }: Props) {
  const [referenceNo, setReferenceNo] = useState("");
  const [hbcrRegNo, setHbcrRegNo] = useState("");
  const [hospitalRegNo, setHospitalRegNo] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FollowUpSearchHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setError(null);
    if (
      !referenceNo.trim() &&
      !hbcrRegNo.trim() &&
      !hospitalRegNo.trim() &&
      !aadhaar.trim() &&
      !phone.trim()
    ) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const hits = await followUpApi.search({
        referenceNo: referenceNo.trim() || undefined,
        hbcrRegNo: hbcrRegNo.trim() || undefined,
        hospitalRegNo: hospitalRegNo.trim() || undefined,
        aadhaar: aadhaar.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setResults(hits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults(null);
    } finally {
      setSearching(false);
    }
  }, [referenceNo, hbcrRegNo, hospitalRegNo, aadhaar, phone]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#dcebef] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-bold text-[#103e54]">Search For Records</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Reference Number" value={referenceNo} onChange={setReferenceNo} />
          <Field
            label="HBCR Registration Number"
            value={hbcrRegNo}
            onChange={setHbcrRegNo}
          />
          <Field
            label="Hospital Registration Number"
            value={hospitalRegNo}
            onChange={setHospitalRegNo}
          />
          <Field label="Aadhaar Number" value={aadhaar} onChange={setAadhaar} />
          <Field label="Phone Number" value={phone} onChange={setPhone} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching}
            className="rounded-xl bg-[#0b7d87] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#096a73] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching ? "Searching…" : "Search"}
          </button>
          {error && <span className="text-xs font-medium text-[#b34040]">{error}</span>}
        </div>
      </section>

      {results && (
        <section className="rounded-2xl border border-[#dcebef] bg-white p-5 sm:p-6">
          <p className="mb-3 text-[11px] font-bold text-[#93a9b1]">
            {results.length === 0
              ? "No matching records found"
              : `${results.length} matching record${results.length === 1 ? "" : "s"} — click an HBCR Registration Number to open the follow-up details`}
          </p>
          {results.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-[#e0ebed]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e7f0f1] bg-[#f7fbfb] text-[10px] uppercase tracking-wide text-[#93a9b1]">
                    <th className="px-4 py-2.5 font-bold">HBCR Reg. No.</th>
                    <th className="px-4 py-2.5 font-bold">Patient Name</th>
                    <th className="px-4 py-2.5 font-bold">ICD-10</th>
                    <th className="px-4 py-2.5 font-bold">Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((h) => (
                    <tr
                      key={h.registrationId}
                      className="border-b border-[#f0f5f6] transition last:border-0 hover:bg-[#f7fbfb]"
                    >
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => onSelect(h.registrationId)}
                          title={`Open follow-up details for ${h.hbcrRegistrationNo}`}
                          className="rounded-md px-1.5 py-1 font-bold text-[#0b7d87] underline decoration-[#0b7d87]/30 underline-offset-2 transition hover:bg-[#eef8f7] hover:decoration-[#0b7d87]"
                        >
                          {h.hbcrRegistrationNo}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-[#244c5b]">
                        {h.patientName}
                      </td>
                      <td className="px-4 py-2.5 text-[#486b77]">{h.icd10Code || "—"}</td>
                      <td className="px-4 py-2.5 text-[#486b77]">{h.visitCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
