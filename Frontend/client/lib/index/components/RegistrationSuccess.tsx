import { motion } from "framer-motion";
import { Check } from "lucide-react";

type RegistrationSuccessProps = {
  setView: (v: string) => void;
};

export function RegistrationSuccess({ setView }: RegistrationSuccessProps) {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md rounded-3xl border border-[#d8efeb] bg-white p-10 text-center shadow-xl shadow-teal-900/5"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dff5ec] text-[#2fa06f]">
          <Check size={30} />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold text-[#103e54]">
          Registration complete
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#81969d]">
          HBCR-2024-0185 has been created and added to the registry.
        </p>
        <button
          onClick={() => setView("records")}
          className="mt-7 rounded-xl bg-[#0b7d87] px-5 py-3 text-xs font-bold text-white"
        >
          View patient records
        </button>
      </motion.div>
    </div>
  );
}
