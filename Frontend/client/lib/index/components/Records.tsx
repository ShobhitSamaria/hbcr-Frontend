import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Filter,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { patientApi } from "@/lib/api";
import {
  apiPatientToRow,
  type PatientRow,
} from "../utils/apiRows";
import { PatientTable } from "./PatientTable";

type RecordsProps = {
  setView: (v: string) => void;
};

export function Records({ setView }: RecordsProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    patientApi
      .list({ page, limit: 20 })
     .then((data) => {
        if (cancelled) return;
        console.log("PATIENT API DATA:", data);
        const mappedRows = data.items.map(apiPatientToRow);
        setRows(mappedRows);
        setTotal(data.meta.total);
        console.log("ROWS:", mappedRows);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const filtered = query.trim()
  ? rows.filter((p) =>
      `${p.name} ${p.id}`.toLowerCase().includes(query.toLowerCase()),
    )
  : rows;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-[25px] font-extrabold tracking-tight text-[#103e54]">
            Patient records
          </h2>
          <p className="mt-1 text-sm text-[#82979e]">
            Search and manage all registered cancer cases.
          </p>
          {err && <p className="mt-2 text-xs text-[#d04a4a]">{err}</p>}
        </div>
        <button
          onClick={() => setView("register")}
          className="flex w-fit items-center gap-2 rounded-xl bg-[#0b7d87] px-4 py-3 text-xs font-bold text-white"
        >
          <FilePlus2 size={16} /> New registration
        </button>
      </div>
      <div className="rounded-2xl border border-[#e3edef] bg-white shadow-[0_5px_20px_rgba(25,73,89,.035)]">
        <div className="flex flex-col gap-3 border-b border-[#edf3f4] p-5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-3 text-[#9aafb5]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or HBCR ID"
              className="h-10 w-full rounded-lg border border-[#dce9eb] bg-[#fbfdfd] pl-9 pr-3 text-xs outline-none focus:border-[#36a99c]"
            />
          </div>
          <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dce9eb] px-4 text-xs font-bold text-[#6d858e]">
            <Filter size={14} /> Filters
          </button>
          <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dce9eb] px-4 text-xs font-bold text-[#6d858e]">
            <SlidersHorizontal size={14} /> Sort
          </button>
        </div>
        <PatientTable rows={rows} />
        <div className="flex items-center justify-between border-t border-[#edf3f4] px-5 py-4 text-[11px] text-[#8ba0a6]">
          <span>
            Showing {total === 0 ? 0 : (page - 1) * 20 + 1}–{(page - 1) * 20 + filtered.length} of {total} patients
            {loading && " (loading…)"}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-[#e2ecee] p-1.5 text-slate-400 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="rounded-lg bg-[#e8f5f5] px-2.5 py-1.5 font-bold text-[#087888]">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="rounded-lg border border-[#e2ecee] p-1.5 text-slate-400 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
