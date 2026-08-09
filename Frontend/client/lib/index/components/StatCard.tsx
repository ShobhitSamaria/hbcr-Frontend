import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  note: string;
  icon: any;
  tone: string;
};

export function StatCard({ label, value, note, icon: Icon, tone }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-[#e3edef] bg-white p-5 shadow-[0_5px_20px_rgba(25,73,89,.035)]"
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon size={19} />
        </div>
        <MoreHorizontal size={18} className="text-slate-300" />
      </div>
      <p className="mt-5 text-[12px] font-semibold text-[#81969d]">{label}</p>
      <div className="mt-1 flex items-end justify-between">
        <p className="text-[27px] font-extrabold tracking-tight text-[#103e54]">
          {value}
        </p>
        <span className="mb-1 text-[10px] font-bold text-[#28a28c]">
          {note}
        </span>
      </div>
    </motion.div>
  );
}
