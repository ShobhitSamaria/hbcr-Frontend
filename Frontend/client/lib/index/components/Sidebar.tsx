import {
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { Brand } from "./Brand";

type SidebarProps = {
  view: string;
  setView: (v: string) => void;
  close?: () => void;
};

const nav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "register", label: "New Registration", icon: FilePlus2 },
  { id: "records", label: "Patient Records", icon: ClipboardList },
];

export function Sidebar({ view, setView, close }: SidebarProps) {
  return (
    <aside className="flex h-full w-[250px] flex-col border-r border-[#dcebef] bg-white px-5 py-6">
      <div className="mb-11 flex items-center justify-between">
        <Brand />
        {close && (
          <button onClick={close} className="text-slate-400">
            <X size={20} />
          </button>
        )}
      </div>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#93a9b1]">
        Workspace
      </p>
      <nav className="space-y-1">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setView(id);
              close?.();
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition ${view === id ? "bg-[#e8f5f5] text-[#087888]" : "text-[#6c828c] hover:bg-slate-50 hover:text-[#103e54]"}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            {label}
            {id === "register" && (
              <span className="ml-auto rounded-full bg-[#f6b73c] px-2 py-0.5 text-[9px] font-extrabold text-white">
                NEW
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl bg-[#f2faf9] p-4">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0b7d87]">
          <ShieldCheck size={17} />
        </div>
        <p className="text-xs font-bold text-[#103e54]">Secure & compliant</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#78919a]">
          Your registry data is handled with care and privacy.
        </p>
      </div>
      <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9eff0] text-xs font-bold text-[#087888]">
          AS
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-[#103e54]">
            Dr. A. Srinivasan
          </p>
          <p className="text-[10px] text-[#8aa0a7]">Registry coordinator</p>
        </div>
        <Settings size={15} className="ml-auto text-slate-400" />
      </div>
    </aside>
  );
}
