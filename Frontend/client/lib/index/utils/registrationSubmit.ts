/**
 * Orchestrator-friendly submission pipeline. Lives in a single function so the
 * registration component stays clean and we can reuse it from anywhere (eg. a
 * future "Resubmit" flow).
 */
import {
  diagnosticApi,
  familyHistoryApi,
  pathologyApi,
  patientApi,
  registrationApi,
  sideApi,
  treatmentApi,
} from "@/lib/api";
import {
  extractAddresses,
  extractComorbidities,
  extractDiagnosticMethods,
  extractFamilyHistory,
  extractHabits,
  extractIdentifications,
  extractPatient,
  extractPathology,
  extractRelatives,
  extractRegistration,
} from "@/lib/utils/hbcrForm";

export type SubmitContext = {
  /** Pre-existing patientId (e.g. when editing); if omitted we create a new patient. */
  existingPatientId?: number;
  hospitalId: number;
  values: Record<string, unknown>;
};

export type SubmitResult = {
  patientId: number;
  registrationId: number;
};

/**
 * Sends the full Step-1 / 2 / 3 payload to the backend. The orchestrator
 * awaits this before `setSubmitted(true)`.
 */
export async function submitRegistration(
  ctx: SubmitContext,
): Promise<SubmitResult> {
  const v = ctx.values;

  // 1. Patient (skip if editing)
  let patientId = ctx.existingPatientId ?? 0;
  if (!patientId) {
    const p = extractPatient(v);
    if (!p.fullName) {
      throw new Error("Patient name is required (field 9)");
    }
    const created = await patientApi.create({
      fullName: p.fullName,
      firstName: p.firstName ?? undefined,
      middleName: p.middleName ?? undefined,
      lastName: p.lastName ?? undefined,
      age: p.age ?? undefined,
      dateOfBirth: p.dateOfBirth ?? undefined,
      gender: p.gender,
      healthSchemeBeneficiary: p.healthSchemeBeneficiary,
      healthSchemeDetails: p.healthSchemeDetails ?? undefined,
    });
    patientId = created.id;
  }

  // 2. Side tables (best-effort; missing fields are skipped)
  const addresses = extractAddresses(v);
  for (const a of addresses) {
    try { await sideApi.addresses.upsert(patientId, a.addressType, a); } catch { /* ignore duplicates */ }
  }
  for (const r of extractRelatives(v)) {
    try { await sideApi.relatives.create(patientId, r); } catch { /* ignore */ }
  }
  for (const h of extractHabits(v)) {
    try { await sideApi.habits.create(patientId, h); } catch { /* ignore */ }
  }
  for (const c of extractComorbidities(v)) {
    try { await sideApi.comorbidities.create(patientId, c); } catch { /* ignore */ }
  }
  for (const id of extractIdentifications(v)) {
    try { await sideApi.identifications.create(patientId, id); } catch { /* ignore */ }
  }

  // 3. Registration
  const regInput = extractRegistration(v, ctx.hospitalId);
  const reg = await registrationApi.create(patientId, regInput);
  const registrationId = reg.id;

  // 4. Pathology (Step 2)
  const pathology = extractPathology(v);
  if (Object.values(pathology).some((x) => x !== undefined && x !== null)) {
    try { await pathologyApi.upsert(registrationId, pathology); } catch { /* ignore */ }
  }

  // 5. Family history (Step 1)
  const fh = extractFamilyHistory(v);
  if (fh.familyHistory) {
    try { await familyHistoryApi.upsert(registrationId, fh); } catch { /* ignore */ }
  }

  // 6. Diagnostic methods (Step 2) - create one row per checked method. We
  // don't capture sub-procedure rows here because those are managed in the
  // DiagnosticTable sub-component (out of scope for this integration).
  const dm = extractDiagnosticMethods(v);
  for (const method of dm.methods) {
    try {
      await diagnosticApi.createMethod(registrationId, {
        method: method.toUpperCase().replace(/ /g, "_"),
        clinicalOnlyDate: dm.clinicalDate ?? undefined,
      });
    } catch { /* ignore */ }
  }

  return { patientId, registrationId };
}
