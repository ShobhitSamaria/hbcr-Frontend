import type { PatientRow } from "../utils/apiRows";

type PatientTableProps = {
  rows: PatientRow[];
  compact?: boolean;
  onRowClick?: (patientId: number) => void;
};

export function PatientTable({ rows, compact = false, onRowClick }: PatientTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-[.1em] text-[#9aaeb4]">
            <th className="px-4 py-3">Reference No.</th>
            <th className="px-3 py-3">Registration No.</th>
            <th className="px-3 py-3">Patient Name</th>
            <th className="px-3 py-3">Age / Gender</th>
            {!compact && <th className="px-3 py-3">Aadhar</th>}
            {!compact && <th className="px-3 py-3">ICD-10</th>}
            <th className="px-3 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
            {!compact && <th className="px-3 py-3">Completed By</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr
              key={p.id}
              onClick={() => onRowClick?.(Number(p.patientId ?? p.id))}
              className={`border-t border-[#edf3f4] text-xs ${onRowClick ? "cursor-pointer hover:bg-[#f0f8f8]" : ""}`}
            >
              <td className="px-4 py-4 font-bold text-[#087888]">
                {p.referenceNo}
              </td>
              <td className="px-3 py-4 font-semibold text-[#52707b]">
                {p.registrationNo}
              </td>
              <td className="px-3 py-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${p.color}`}
                  >
                    {p.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </span>
                  <span className="font-bold text-[#244c5b]">{p.name}</span>
                </div>
              </td>
              <td className="px-3 py-4 text-[#718991]">
                {p.age} <span className="text-slate-300">•</span> {p.gender}
              </td>
              {!compact && (
                <td className="px-3 py-4 text-[#52707b]">{p.aadhar}</td>
              )}
              {!compact && (
                <td className="px-3 py-4 font-semibold text-[#52707b]">
                  {p.icd10}
                </td>
              )}
              <td className="px-3 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${p.status === "Completed" ? "bg-[#e8f6ec] text-[#30935c]" : p.status === "Pending" ? "bg-[#fff3d9] text-[#bf7a0d]" : "bg-[#e3f4f2] text-[#087888]"}`}
                >
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-4 text-[#80959c]">{p.date}</td>
              {!compact && (
                <td className="px-3 py-4 text-[#718991]">{p.completedBy}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
