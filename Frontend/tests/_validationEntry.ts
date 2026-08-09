// Re-export entry point for the validation tests so we can bundle the three
// step validators into a single ESM module without outdir conflicts.
export { validateStep1 } from "../client/lib/registration/step1Rules";
export { validateStep2 } from "../client/lib/registration/step2Rules";
export { validateStep3 } from "../client/lib/registration/step3Rules";
