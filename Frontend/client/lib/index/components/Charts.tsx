import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardApi } from "@/lib/api";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function MonthlyRegistrationsChart() {
  const [data, setData] = useState<Array<{ month: string; value: number }>>([]);

  useEffect(() => {
    let cancelled = false;
    dashboardApi.monthly(6).then((rows) => {
      if (cancelled) return;
      // API returns each row with a `bucketIndex` (start of 6-month window).
      // We render the window in chronological order using the month name.
      const ordered = [...rows].sort((a, b) => (a as any).bucketIndex - (b as any).bucketIndex);
      setData(ordered.map(({ month, value }) => ({ month, value })));
    }).catch(() => {
      // Empty array leaves the chart blank rather than crashing
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="rounded-2xl border border-[#e3edef] bg-white p-5 shadow-[0_5px_20px_rgba(25,73,89,.035)]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-extrabold text-[#103e54]">
            Monthly registrations
          </h3>
          <p className="mt-1 text-xs text-[#8ba0a6]">
            New patient cases reported in the last 6 months
          </p>
        </div>
        <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-[#748b93]">
          Last 6 months <ChevronDown size={13} />
        </button>
      </div>
      <div className="mt-6 h-[230px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-[#9aadb3]">
            No registrations yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={26}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9aadb3", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9aadb3", fontSize: 11 }}
                width={28}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "#f4faf9" }}
                contentStyle={{
                  border: "0",
                  borderRadius: "10px",
                  fontSize: 11,
                }}
              />
              <Bar dataKey="value" fill="#36a99c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function CaseOverviewChart() {
  const [counts, setCounts] = useState<{
    completed: number;
    pending: number;
    underReview: number;
    total: number;
  }>({ completed: 0, pending: 0, underReview: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    dashboardApi.caseOverview()
      .then((rows) => {
        if (cancelled) return;
        const completed = rows.find((r) => r.status === "COMPLETED")?.count ?? 0;
        const pending = rows.find((r) => r.status === "PENDING")?.count ?? 0;
        const active = rows.find((r) => r.status === "ACTIVE")?.count ?? 0;
        const total = completed + pending + active || 1;
        setCounts({
          completed,
          pending,
          underReview: active,
          total,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const completedPct = (counts.completed / counts.total) * 100;
  const pendingPct = ((counts.completed + counts.pending) / counts.total) * 100;

  const gradient = useMemo(
    () =>
      `conic-gradient(#36a99c 0 ${completedPct.toFixed(2)}%, #f3bd50 ${completedPct.toFixed(
        2,
      )}% ${pendingPct.toFixed(2)}%, #dcebed ${pendingPct.toFixed(2)}% 100%)`,
    [completedPct, pendingPct],
  );

  return (
    <div className="rounded-2xl border border-[#e3edef] bg-white p-5 shadow-[0_5px_20px_rgba(25,73,89,.035)]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-extrabold text-[#103e54]">Case overview</h3>
          <p className="mt-1 text-xs text-[#8ba0a6]">
            Current registry distribution
          </p>
        </div>
        <button className="text-xs font-bold text-[#0b7d87]">
          View report
        </button>
      </div>
      <div className="mt-7 flex items-center gap-6">
        <div
          className="relative flex h-32 w-32 items-center justify-center rounded-full"
          style={{ background: gradient }}
        >
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-2xl font-extrabold text-[#103e54]">
              {counts.total === 0 || counts.total === 1
                ? "—"
                : `${Math.round((counts.completed / counts.total) * 100)}%`}
            </span>
            <span className="text-[9px] font-semibold text-[#9aadb3]">
              completion
            </span>
          </div>
        </div>
        <div className="space-y-3 text-xs">
          <p className="flex items-center gap-2 font-semibold text-[#59747d]">
            <i className="h-2.5 w-2.5 rounded-full bg-[#36a99c]" />
            Completed <b className="ml-2 text-[#103e54]">{counts.completed}</b>
          </p>
          <p className="flex items-center gap-2 font-semibold text-[#59747d]">
            <i className="h-2.5 w-2.5 rounded-full bg-[#f3bd50]" />
            Pending <b className="ml-2 text-[#103e54]">{counts.pending}</b>
          </p>
          <p className="flex items-center gap-2 font-semibold text-[#59747d]">
            <i className="h-2.5 w-2.5 rounded-full bg-[#dcebed]" />
            Under review <b className="ml-2 text-[#103e54]">{counts.underReview}</b>
          </p>
        </div>
      </div>
    </div>
  );
}
