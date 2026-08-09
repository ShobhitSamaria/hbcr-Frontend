import { Check } from "lucide-react";
import { stepLabels } from "../data";

type RegistrationStepperProps = {
  step: number;
};

export function RegistrationStepper({ step }: RegistrationStepperProps) {
  return (
    <div className="mb-7 flex items-center justify-between gap-2">
      {stepLabels.map((x, i) => (
        <div key={x} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${step > i + 1 ? "bg-[#36a99c] text-white" : step === i + 1 ? "bg-[#0b7d87] text-white shadow-md shadow-teal-800/20" : "bg-[#edf4f4] text-[#9aafb5]"}`}
          >
            {step > i + 1 ? <Check size={15} /> : i + 1}
          </div>
          <span
            className={`hidden text-[11px] font-bold sm:block ${step === i + 1 ? "text-[#0b7d87]" : "text-[#96aab0]"}`}
          >
            {x}
          </span>
          {i < 2 && (
            <div
              className={`mx-1 h-px flex-1 ${step > i + 1 ? "bg-[#36a99c]" : "bg-[#e5eeee]"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
