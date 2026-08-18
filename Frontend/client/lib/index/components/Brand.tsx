import { HeartPulse } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b6b79] text-white shadow-lg shadow-teal-900/15">
        <HeartPulse size={21} strokeWidth={2.5} />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#f6b73c]" />
      </div>
      <div>
        <p className="text-[15px] font-extrabold leading-none tracking-tight text-[#103e54]">
          RAJASTHAN HBCR
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#6b8792]">
          Cancer Registry Portal
        </p>
      </div>
    </div>
  );
}
