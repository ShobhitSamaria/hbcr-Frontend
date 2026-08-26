import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { auxApi, healthApi } from "@/lib/api";
import { FormStateProvider, useFormStateOptional } from "@/lib/formState";
import { ValidationProvider, useValidation } from "@/lib/validationContext";
import {
  mapValidationDetailsToErrors,
} from "@/lib/registration/apiErrorMap";
import { stepForLabels } from "@/lib/registration/steps";
import { validateStep1 } from "@/lib/registration/step1Rules";
import { validateStep2 } from "@/lib/registration/step2Rules";
import { validateStep3 } from "@/lib/registration/step3Rules";
import { submitRegistration } from "../utils/registrationSubmit";
import { stepLabels } from "../data";
import { RegistrationStepper } from "./RegistrationStepper";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { Step1Identifying } from "./registration/Step1Identifying";
import { Step2Diagnostic } from "./registration/Step2Diagnostic";
import { ClinicalTreatment } from "./registration/ClinicalTreatment";
import { error } from "node:console";

type RegistrationProps = {
  setView: (v: string) => void;
};

export function Registration({ setView }: RegistrationProps) {
  return (
    <FormStateProvider>
      <ValidationProvider>
        <RegistrationInner setView={setView} />
      </ValidationProvider>
    </FormStateProvider>
  );
}

function RegistrationInner({ setView }: RegistrationProps) {
  const { session } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step1's local-state items that ARE already controlled in the UI - we
  // keep them here AND write into the form-capture context as a sibling
  // effect. These four pieces are exactly the ones that the original
  // Registration.tsx orchestrator already lifted up out of Step1.
  const [referral, setReferral] = useState("Self");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sameAddress, setSameAddress] = useState(false);
  const [familyHistory, setFamilyHistory] = useState("No");

  const ctx = useFormStateOptional();
  const validation = useValidation();

  // Sync the four orchestrator-owned fields into the form-state context.
  useEffect(() => { ctx?.set("7. Type of referral", referral); }, [referral]);
  useEffect(() => {
    // Persist which unique IDs are selected so we can persist later.
    ctx?.set("_selectedIds", [...selectedIds]);
  }, [selectedIds]);
  useEffect(() => { ctx?.set("_sameAddress", sameAddress); }, [sameAddress]);
  useEffect(() => {
    ctx?.set(
      "19. Relationship to Cancer / Degree of Relationship",
      familyHistory,
    );
  }, [familyHistory]);

  /**
   * Build a snapshot of every value the validators might read: the form
   * state (ref) merged with the locally-lifted fields that the
   * orchestrator owns. This keeps the validators unaware of where each
   * value came from.
   */
  const buildSnapshot = (): Record<string, unknown> => {
    const snap = { ...(ctx?.values.current ?? {}) };
    // Belt-and-braces: lifted fields are also written via the effect above,
    // but reading from the ref directly avoids races on the first render.
    snap["7. Type of referral"] = referral || snap["7. Type of referral"];
    snap["_selectedIds"] = selectedIds;
    snap["_sameAddress"] = sameAddress;
    snap[
      "19. Relationship to Cancer / Degree of Relationship"
    ] = familyHistory || snap[
      "19. Relationship to Cancer / Degree of Relationship"
    ];
    return snap;
  };

  /**
   * Run the per-step validator. If any errors are present, push them into
   * the validation context (which highlights the fields) and return false.
   * Returns true when the step is clean.
   */
  const validateCurrentStep = (): boolean => {
    const snap = buildSnapshot();
    let errs: Record<string, string> = {};
    if (step === 1) errs = validateStep1(snap);
    else if (step === 2) errs = validateStep2(snap);
    else if (step === 3) errs = validateStep3(snap);
    if (Object.keys(errs).length > 0) {
      validation.setErrors(errs);
      // Scroll the first error into view for a clearer UX.
      const firstLabel = Object.keys(errs)[0];
      requestAnimationFrame(() => scrollToLabel(firstLabel));
      return false;
    }
    // Clean step — wipe any stale errors for the labels in this step so
    // the user isn't left with red borders after fixing them.
    validation.clearAll();
    return true;
  };

  const scrollToLabel = (label: string) => {
    const el = document.querySelector<HTMLElement>(
      `[data-error="true"], [name="${cssEscape(label)}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    setStep((s) => s - 1);
  };

  /**
   * Submission: re-validate every step. If anything is wrong, jump to the
   * first step that has errors and highlight them. Otherwise call the
   * orchestrator's submit pipeline; on a backend 422, map the response
   * details back to UI labels.
   */
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    // Run step 3 first because that's what the user is currently on.
    if (!validateCurrentStep()) {
      setSubmitting(false);
      return;
    }
    const snap = buildSnapshot();
    const e1 = validateStep1(snap);
    const e2 = validateStep2(snap);
    const e3 = validateStep3(snap);
    if (Object.keys(e1).length > 0) {
      validation.setErrors(e1);
      setStep(1);
      requestAnimationFrame(() => scrollToLabel(Object.keys(e1)[0]));
      setSubmitting(false);
      return;
    }
    if (Object.keys(e2).length > 0) {
      validation.setErrors(e2);
      setStep(2);
      requestAnimationFrame(() => scrollToLabel(Object.keys(e2)[0]));
      setSubmitting(false);
      return;
    }
    if (Object.keys(e3).length > 0) {
      validation.setErrors(e3);
      setStep(3);
      requestAnimationFrame(() => scrollToLabel(Object.keys(e3)[0]));
      setSubmitting(false);
      return;
    }

    try {
      await healthApi.ready();
      // Save against the logged-in hospital so a multi-hospital backend
      // records the institution whose name/code were auto-populated above.
      const hospitals = await auxApi.hospitals();
      const hospitalId = session?.hospital?.id ?? hospitals[0]?.id;
      if (!hospitalId) {
        throw new Error("No hospital is registered on the backend.");
      }
      const values = ctx?.values.current ?? {};
      await submitRegistration({ hospitalId, values });
      setSubmitted(true);
    } catch (e) {
      // Try to map a backend 422 onto UI fields. If we get a clean
      // mapping, jump to the earliest affected step. Otherwise surface
      // the error as a banner.
      const apiErr = e as Error & {
        status?: number;
        fields?: { field?: string; message: string }[];
      };
      const mapped = mapValidationDetailsToErrors(apiErr.fields);
      if (apiErr.status === 422 && Object.keys(mapped).length > 0) {
        validation.setErrors(mapped);
        const target = stepForLabels(Object.keys(mapped));
        setStep(target);
        requestAnimationFrame(() => scrollToLabel(Object.keys(mapped)[0]));
      } else {
        setSubmitError(
          apiErr instanceof Error ? apiErr.message : "Could not save registration",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <RegistrationSuccess setView={setView} />;
  }

  console.log("validation.errors:", validation.errors);
console.log("error keys:", Object.keys(validation.errors));


  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => setView("dashboard")}
            className="mb-2 flex items-center gap-1 text-xs font-bold text-[#0b7d87]"
          >
            <ChevronLeft size={14} /> Back to dashboard
          </button>
          <h2 className="text-[25px] font-extrabold tracking-tight text-[#103e54]">
            New patient registration
          </h2>
          <p className="mt-1 text-sm text-[#82979e]">
            Capture complete clinical details for a new HBCR case.
          </p>
          {submitError && (
            <p className="mt-2 text-xs text-[#d04a4a]" role="alert">
              {submitError}
            </p>
          )}
        </div>
        <span className="rounded-lg bg-[#e8f5f5] px-3 py-2 text-[11px] font-bold text-[#087888]">
          Draft saved just now
        </span>
      </div>
      <div className="rounded-2xl border border-[#e3edef] bg-white px-5 py-5 shadow-[0_5px_20px_rgba(25,73,89,.035)] sm:px-7">
        <RegistrationStepper step={step} />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="mb-6 border-b border-[#edf3f4] pb-4">
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#36a99c]">
                Step {step} of 3
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-[#103e54]">
                {stepLabels[step - 1]}
              </h3>
            </div>
            {step === 1 && (
              <Step1Identifying
                referral={referral}
                setReferral={setReferral}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                sameAddress={sameAddress}
                setSameAddress={setSameAddress}
              />
            )}
            {step === 2 && (
              <Step2Diagnostic
                familyHistory={familyHistory}
                setFamilyHistory={setFamilyHistory}
              />
            )}
            {step === 3 && <ClinicalTreatment />}
          </motion.div>
        </AnimatePresence>
        {Object.keys(validation.errors).length > 0 &&(
          <div
            className="mt-4 rounded-xl border border-[#d04a4a]/30 bg-[#fdecec] px-4 py-3 text-xs text-[#a4302f]"
            role="alert"
            aria-live="polite"
          >
            <strong className="block text-[11px] font-bold uppercase tracking-wide">
              Please fix the highlighted fields
            </strong>
            <span className="block">
              {Object.keys(validation.errors)} field
              {Object.keys(validation.errors).length === 1 ? "" : "s"} need
              attention before continuing.
            </span>
          </div>
        )}
        <div className="mt-8 flex justify-between border-t border-[#edf3f4] pt-5">
          <button
            disabled={step === 1}
            onClick={goPrev}
            className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-xs font-bold text-[#789099] disabled:invisible"
          >
            <ChevronLeft size={15} /> Previous
          </button>
          {step < 3 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 rounded-xl bg-[#0b7d87] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-teal-800/15"
            >
              Save & continue <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#0b7d87] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-teal-800/15 disabled:opacity-60"
            >
              <Check size={15} />
              {submitting ? "Submitting…" : "Submit registration"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Tiny CSS.escape polyfill — used to safely build a `[name="..."]`
 * selector. We can't use the global one in older test environments.
 */
function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}
