import {
  Activity,
  ArrowRight,
  Check,
  FilePlus2,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { apiRegistrationToRow, type PatientRow } from "../utils/apiRows";
import { PatientTable } from "./PatientTable";
import { StatCard } from "./StatCard";
import {
  CaseOverviewChart,
  MonthlyRegistrationsChart,
} from "./Charts";


type DashboardProps = {
  setView: (v: string) => void;
};

export function Dashboard({ setView }: DashboardProps) {
  const [stats, setStats] = useState<{
    totalPatients: number;
    newRegistrations: number;
    pendingCases: number;
    completedCases: number;
  } | null>(null);
  const [recent, setRecent] = useState<PatientRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const today = useMemo(() => formatToday(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, recentRegs] = await Promise.all([
          dashboardApi.stats(),
          dashboardApi.recent(5),
        ]);
        if (cancelled) return;
        setStats(s);
        setRecent(recentRegs.map(apiRegistrationToRow));
      } catch (e: unknown) {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = stats ? formatNumber(stats.totalPatients) : "…";
  const newR = stats ? formatNumber(stats.newRegistrations) : "…";
  const pending = stats ? formatNumber(stats.pendingCases) : "…";
  const completed = stats ? formatNumber(stats.completedCases) : "…";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-[#7d929a]">{today}</p>
          <h2 className="mt-1 text-[25px] font-extrabold tracking-tight text-[#103e54]">
            Hospital Name
          </h2>
          <p className="mt-1 text-sm text-[#82979e]">
            Here’s what’s happening in your cancer registry today.
          </p>
          {err && (
            <p className="mt-2 text-xs text-[#d04a4a]">
              Backend offline? {err}
            </p>
          )}
        </div>
        <button
          onClick={() => setView("register")}
          className="flex w-fit items-center gap-2 rounded-xl bg-[#0b7d87] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-teal-800/15 transition hover:bg-[#096c77]"
        >
          <FilePlus2 size={16} /> Register new patient <ArrowRight size={15} />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total patients"
          value={total}
          note="—"
          icon={Users}
          tone="bg-[#e3f4f2] text-[#087888]"
        />
        <StatCard
          label="New registrations"
          value={newR}
          note="last 30d"
          icon={UserRound}
          tone="bg-[#e9efff] text-[#5271c7]"
        />
        <StatCard
          label="Pending cases"
          value={pending}
          note="—"
          icon={Activity}
          tone="bg-[#fff3d9] text-[#d18a17]"
        />
        <StatCard
          label="Completed cases"
          value={completed}
          note="—"
          icon={Check}
          tone="bg-[#e8f6ec] text-[#38a064]"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <MonthlyRegistrationsChart />
        <CaseOverviewChart />
      </div>
      <div className="rounded-2xl border border-[#e3edef] bg-white shadow-[0_5px_20px_rgba(25,73,89,.035)]">
        <div className="flex items-center justify-between border-b border-[#edf3f4] px-5 py-4">
          <div>
            <h3 className="font-extrabold text-[#103e54]">Recent patients</h3>
            <p className="mt-1 text-xs text-[#8ba0a6]">
              Latest cases added to the registry
            </p>
          </div>
          <button
            onClick={() => setView("records")}
            className="flex items-center gap-1 text-xs font-bold text-[#0b7d87]"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>
        <PatientTable rows={recent.slice(0, 4)} compact />
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
