import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
} from "lucide-react";

type HeaderProps = {
  title: string;
  onMenu: () => void;
};

export function Header({ title, onMenu }: HeaderProps) {
  return (
    <header className="flex h-[76px] items-center justify-between border-b border-[#e4eef0] bg-white/80 px-5 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#94a9b1]">
            National Health Mission / HBCR
          </p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-[#103e54]">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-5">
        <div className="hidden items-center gap-2 rounded-lg bg-[#f4f8f8] px-3 py-2 text-[11px] font-semibold text-[#80969e] sm:flex">
          <CalendarDays size={14} className="text-[#0b7d87]" /> 18 June 2024{" "}
          <ChevronDown size={13} />
        </div>
        <button className="relative rounded-xl p-2.5 text-[#789099] hover:bg-slate-100">
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e77b64]" />
        </button>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9eff0] text-xs font-bold text-[#087888]">
          AS
        </div>
      </div>
    </header>
  );
}
