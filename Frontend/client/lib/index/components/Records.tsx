import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Filter,
  Search,
  X,
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

type Filters = {
  name: string;
  referenceNo: string;
  hospitalRegNo: string;
  aadhaar: string;
  mobile: string;
  icd10: string;
  dateFrom: string;
  dateTo: string;
};

const EMPTY_FILTERS: Filters = {
  name: "",
  referenceNo: "",
  hospitalRegNo: "",
  aadhaar: "",
  mobile: "",
  icd10: "",
  dateFrom: "",
  dateTo: "",
};

const DEBOUNCE_MS = 350;

export function Records({ setView }: RecordsProps) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setFilter = <K extends keyof Filters>(key: K, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  // Debounce filter changes so typing doesn't fire a request per keystroke.
  const debounced = useDebounced(filters, DEBOUNCE_MS);
  const activeFilters = useMemo(() => debounced, [debounced]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    patientApi
      .list({
        page,
        limit: 20,
        name: activeFilters.name || undefined,
        referenceNo: activeFilters.referenceNo || undefined,
        hospitalRegNo: activeFilters.hospitalRegNo || undefined,
        aadhaar: activeFilters.aadhaar || undefined,
        mobile: activeFilters.mobile || undefined,
        icd10: activeFilters.icd10 || undefined,
        dateFrom: activeFilters.dateFrom || undefined,
        dateTo: activeFilters.dateTo || undefined,
      })
      .then((data) => {
        if (cancelled) return;
        setRows(data.items.map(apiPatientToRow));
        setTotal(data.meta.total);
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
  }, [page, activeFilters]);

  const hasActiveFilters = Object.values(filters).some((v) => v.trim() !== "");
  const from = total === 0 ? 0 : (page - 1) * 20 + 1;
  const to = Math.min((page - 1) * 20 + rows.length, total);

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
        <div className="flex flex-col gap-3 border-b border-[#edf3f4] p-5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-3 text-[#9aafb5]"
            />
            <input
              value={filters.name}
              onChange={(e) => setFilter("name", e.target.value)}
              placeholder="Search by patient name"
              className="h-10 w-full rounded-lg border border-[#dce9eb] bg-[#fbfdfd] pl-9 pr-3 text-xs outline-none focus:border-[#36a99c]"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-bold ${
              filtersOpen || hasActiveFilters
                ? "border-[#36a99c] bg-[#e8f5f5] text-[#087888]"
                : "border-[#dce9eb] text-[#6d858e]"
            }`}
          >
            <Filter size={14} />
            Filters
            <ChevronDown
              size={13}
              className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {filtersOpen && (
          <div className="border-b border-[#edf3f4] bg-[#f8fbfb] px-5 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterInput
                label="Patient Reference No."
                value={filters.referenceNo}
                onChange={(v) => setFilter("referenceNo", v)}
                placeholder="e.g. REF-2024-001"
              />
              <FilterInput
                label="Hospital Registration No."
                value={filters.hospitalRegNo}
                onChange={(v) => setFilter("hospitalRegNo", v)}
                placeholder="MRD / CR / Unique ID"
              />
              <FilterInput
                label="Aadhaar Number"
                value={filters.aadhaar}
                onChange={(v) => setFilter("aadhaar", v)}
                placeholder="12-digit Aadhaar"
              />
              <FilterInput
                label="Mobile Number"
                value={filters.mobile}
                onChange={(v) => setFilter("mobile", v)}
                placeholder="10-digit mobile"
              />
              <FilterInput
                label="ICD-10"
                value={filters.icd10}
                onChange={(v) => setFilter("icd10", v)}
                placeholder="e.g. C50, C18.9"
              />
              <div className="grid grid-cols-2 gap-2">
                <FilterInput
                  label="Date of Entry From"
                  value={filters.dateFrom}
                  onChange={(v) => setFilter("dateFrom", v)}
                  type="date"
                />
                <FilterInput
                  label="To"
                  value={filters.dateTo}
                  onChange={(v) => setFilter("dateTo", v)}
                  type="date"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dce9eb] bg-white px-4 text-xs font-bold text-[#6d858e] disabled:opacity-40"
                >
                  <X size={14} /> Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <PatientTable rows={rows} />
        <div className="flex items-center justify-between border-t border-[#edf3f4] px-5 py-4 text-[11px] text-[#8ba0a6]">
          <span>
            Showing {from}–{to} of {total} patients
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

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[#dce9eb] bg-white px-3 text-xs text-[#244c5b] outline-none focus:border-[#36a99c]"
      />
    </label>
  );
}

/** Returns the latest non-undefined value after `ms` of no changes. */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDebounced(value), ms);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [value, ms]);
  return debounced;
}
