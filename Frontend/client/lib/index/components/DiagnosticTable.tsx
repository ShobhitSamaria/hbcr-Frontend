import { useState } from "react";

type DiagnosticTableProps = {
  title: string;
  rows: string[];
};

export function DiagnosticTable({ title, rows }: DiagnosticTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div>
      <label className="mb-3 block text-xs font-bold text-[#486b77]">
        {title}
      </label>
      <div className="overflow-x-auto rounded-xl border border-[#e3edef]">
        <div className="grid min-w-[560px] grid-cols-[1fr_180px] bg-[#f7fbfb] px-4 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#9aafb5]">
          <span>Method</span>
          <span>Date</span>
        </div>
        {rows.map((row) => (
          <div
            key={row}
            className="grid min-w-[560px] grid-cols-[1fr_180px] items-center gap-4 border-t border-[#edf3f4] px-4 py-2.5 text-xs text-[#718991]"
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(row)}
                onChange={(e) =>
                  setSelected((items) =>
                    e.target.checked
                      ? [...items, row]
                      : items.filter((item) => item !== row),
                  )
                }
                className="h-3.5 w-3.5 rounded border-[#c9dce0] accent-[#0b7d87]"
              />
              {row === "Others" ? "Others (Specify + Date)" : row}
            </label>
            {row === "Others" && selected.includes(row) && (
              <input
                placeholder="Specify method"
                className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] outline-none focus:border-[#36a99c]"
              />
            )}
            <input
              type="date"
              disabled={!selected.includes(row)}
              className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] text-[#6e8790] outline-none focus:border-[#36a99c] disabled:cursor-not-allowed disabled:bg-[#f1f5f5] disabled:text-[#a9b8bc]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
