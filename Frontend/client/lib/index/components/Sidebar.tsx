import {
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Brand } from "./Brand";

type SidebarProps = {
  view: string;
  setView: (v: string) => void;
  close?: () => void;
};

const FORM_CHILDREN = [
  { id: "register", label: "New Registration", icon: FilePlus2 },
  { id: "records", label: "Patient Records", icon: ClipboardList },
  { id: "drafts", label: "Drafts", icon: ClipboardList },
];

export function Sidebar({ view, setView, close }: SidebarProps) {
  const { session, logout } = useAuth();
  const user = session?.user;
  const hospitalName = session?.hospital?.name;

  // "Form" section is open by default if current view is a child
  const [formOpen, setFormOpen] = useState(() =>
    FORM_CHILDREN.some((c) => c.id === view)
  );

  const isFormChild = FORM_CHILDREN.some((c) => c.id === view);

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
        {/* Dashboard */}
        <button
          onClick={() => {
            setView("dashboard");
            close?.();
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition ${view === "dashboard" ? "bg-[#e8f5f5] text-[#087888]" : "text-[#6c828c] hover:bg-slate-50 hover:text-[#103e54]"}`}
        >
          <LayoutDashboard size={18} strokeWidth={1.8} />
          Dashboard
        </button>

        {/* Form (expandable) */}
        <button
          onClick={() => setFormOpen(!formOpen)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition ${isFormChild ? "bg-[#e8f5f5] text-[#087888]" : "text-[#6c828c] hover:bg-slate-50 hover:text-[#103e54]"}`}
        >
          <FolderOpen size={18} strokeWidth={1.8} />
          Form
          <span className="ml-auto">
            {formOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        {formOpen && (
          <div className="ml-4 space-y-1 border-l-2 border-[#e4edef] pl-3">
            {FORM_CHILDREN.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setView(id);
                  close?.();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold transition ${view === id ? "bg-[#e8f5f5] text-[#087888]" : "text-[#6c828c] hover:bg-slate-50 hover:text-[#103e54]"}`}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Follow-up */}
        <button
          onClick={() => {
            setView("followup");
            close?.();
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition ${view === "followup" ? "bg-[#e8f5f5] text-[#087888]" : "text-[#6c828c] hover:bg-slate-50 hover:text-[#103e54]"}`}
        >
          <CalendarCheck size={18} strokeWidth={1.8} />
          Follow-up
        </button>
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d9eff0] text-xs font-bold text-[#087888]">
          {user?.initials ?? "AS"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-[#103e54]">
            {user?.fullName ?? "Registry user"}
          </p>
          <p className="truncate text-[10px] text-[#8aa0a7]">
            {hospitalName ?? user?.role ?? "Registry coordinator"}
          </p>
        </div>
        <button
          onClick={logout}
          title="Log out"
          className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
