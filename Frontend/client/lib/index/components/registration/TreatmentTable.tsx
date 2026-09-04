import { useState } from "react";
import { treatmentRows } from "../../data";

type TreatmentTableProps = {
  title: string;
  disabled?: boolean;
  requiredChoice?: boolean;
  onSelectionChange?: (selectedRows: string[]) => void;
};

export function TreatmentTable({ title, disabled = false, requiredChoice = false, onSelectionChange }: TreatmentTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div>
      <label className="mb-3 block text-xs font-bold text-[#486b77]">
        {title}{requiredChoice && <span className="ml-0.5 text-[#d04a4a]">*</span>}
      </label>
      <div className="overflow-x-auto rounded-xl border border-[#e3edef]">
        <div className="grid min-w-[1050px] grid-cols-[170px_repeat(5,1fr)] gap-2 bg-[#f7fbfb] px-3 py-2 text-[10px] font-bold uppercase tracking-[.08em] text-[#9aafb5]">
          <span>Treatment modality</span>
          <span>Intention to treat</span>
          <span>Role</span>
          <span>Details</span>
          <span>Start date</span>
          <span>End date</span>
        </div>
        {treatmentRows.map((row) => {
          const surgery = row === "Surgery";
          const active = selected.includes(row);
          return (
            <div
              key={row}
              className="grid min-w-[1050px] grid-cols-[170px_repeat(5,1fr)] items-center gap-2 border-t border-[#edf3f4] px-3 py-2"
            >
              <label className="flex items-center gap-2 text-xs text-[#718991]">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={active}
                  onChange={(e) =>
                    setSelected((items) => {
                      const next = e.target.checked
                        ? [...items, row]
                        : items.filter((item) => item !== row);
                      onSelectionChange?.(next);
                      return next;
                    })
                  }
                  className="h-3.5 w-3.5 rounded border-[#c9dce0] accent-[#0b7d87]"
                />
                {row === "Others" ? "Others" : row}
              </label>
              {surgery ? (
                <>
                  <select
                    disabled={disabled || !active}
                    className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] text-[#6e8790] disabled:bg-[#f1f5f5]"
                  >
                    <option>Curative</option>
                    <option>Palliative</option>
                    <option>Symptomatic</option>
                    <option>Unknown</option>
                  </select>
                  <span />
                  <select
                    disabled={disabled || !active}
                    className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] text-[#6e8790] disabled:bg-[#f1f5f5]"
                  >
                    <option>Completed Treatment</option>
                    <option>Incomplete Treatment</option>
                    <option>Treatment advised but not accepted</option>
                  </select>
                  <input
                    disabled={disabled || !active}
                    type="date"
                    className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] disabled:bg-[#f1f5f5]"
                  />
                  <span />
                </>
              ) : (
                <>
                  <select
                    disabled={disabled || !active}
                    className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] text-[#6e8790] disabled:bg-[#f1f5f5]"
                  >
                    <option>Curative</option>
                    <option>Palliative</option>
                    <option>Symptomatic</option>
                    <option>Unknown</option>
                  </select>
                  <select
                    disabled={disabled || !active}
                    className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] text-[#6e8790] disabled:bg-[#f1f5f5]"
                  >
                    <option>Neo Adjuvant</option>
                    <option>Definitive</option>
                    <option>Concurrent</option>
                    <option>Unknown</option>
                  </select>
                  <select
                    disabled={disabled || !active}
                    className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] text-[#6e8790] disabled:bg-[#f1f5f5]"
                  >
                    <option>Completed Treatment</option>
                    <option>Incomplete Treatment</option>
                    <option>Treatment advised but not accepted</option>
                  </select>
                  <input
                    disabled={disabled || !active}
                    type="date"
                    className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] disabled:bg-[#f1f5f5]"
                  />
                  <input
                    disabled={disabled || !active}
                    type="date"
                    className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] disabled:bg-[#f1f5f5]"
                  />
                </>
              )}
              {row === "Others" && active && (
                <input
                  disabled={disabled}
                  placeholder="Specify treatment"
                  className="h-8 rounded-lg border border-[#dce9eb] bg-white px-2 text-[11px] outline-none focus:border-[#36a99c]"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
