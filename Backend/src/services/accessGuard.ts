import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";

/**
 * Shared hospital-scoping guards for the New Registration module.
 *
 * Every patient / registration / diagnostic / pathology / treatment /
 * family-history record in the module is created and owned by a hospital.
 * These guards enforce that an authenticated user may only touch records of
 * their own hospital (the id attached to their login token).
 *
 * Convention: resources are "fresh" while a registration is being built
 * (a patient created but not yet linked to a registration). A fresh patient
 * has zero registrations and may be written by the hospital that is
 * currently building the registration — reads/writes on any patient that
 * already has a registration are restricted to hospitals that own one.
 */

/**
 * 404 unless a registration exists AND belongs to `hospitalId`.
 * Returns the registration row so callers can reuse it.
 */
export async function requireRegistrationInHospital(
  registrationId: number,
  hospitalId: number,
) {
  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, hospitalId: true },
  });
  if (!reg || reg.hospitalId !== hospitalId) {
    throw httpErrors.notFound(`Registration ${registrationId} not found`);
  }
  return reg;
}

/**
 * 404 unless the patient exists AND is accessible by `hospitalId`:
 *   - fresh patient (no registrations yet)  → accessible (in-flight creation)
 *   - patient with ≥ 1 registration         → must include this hospital
 */
export async function requirePatientInHospital(
  patientId: number,
  hospitalId: number,
) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true },
  });
  if (!patient) throw httpErrors.notFound(`Patient ${patientId} not found`);

  const owning = await prisma.registration.findMany({
    where: { patientId },
    select: { hospitalId: true },
    distinct: ["hospitalId"],
  });
  if (owning.length === 0) return; // fresh — no hospital has claimed it yet
  if (!owning.some((r) => r.hospitalId === hospitalId)) {
    throw httpErrors.notFound(`Patient ${patientId} not found`);
  }
}

/** Resolve a diagnostic method to its owning registration and enforce scope. */
export async function requireDiagnosticMethodInHospital(
  methodId: number,
  hospitalId: number,
) {
  const method = await prisma.diagnosticMethod.findUnique({
    where: { id: methodId },
    select: { registrationId: true },
  });
  if (!method) throw httpErrors.notFound(`Diagnostic method ${methodId} not found`);
  await requireRegistrationInHospital(method.registrationId, hospitalId);
}

/** Resolve a diagnostic procedure to its owning registration and enforce scope. */
export async function requireDiagnosticProcedureInHospital(
  procedureId: number,
  hospitalId: number,
) {
  const proc = await prisma.diagnosticProcedure.findUnique({
    where: { id: procedureId },
    select: { diagnosticMethod: { select: { registrationId: true } } },
  });
  if (!proc) throw httpErrors.notFound(`Diagnostic procedure ${procedureId} not found`);
  await requireRegistrationInHospital(
    proc.diagnosticMethod.registrationId,
    hospitalId,
  );
}

/** Resolve a treatment row to its owning registration and enforce scope. */
export async function requireTreatmentInHospital(
  treatmentId: number,
  hospitalId: number,
) {
  const t = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    select: { registrationId: true },
  });
  if (!t) throw httpErrors.notFound(`Treatment ${treatmentId} not found`);
  await requireRegistrationInHospital(t.registrationId, hospitalId);
}

/** Resolve a treatment modality to its owning registration and enforce scope. */
export async function requireTreatmentModalityInHospital(
  modalityId: number,
  hospitalId: number,
) {
  const m = await prisma.treatmentModalityDetail.findUnique({
    where: { id: modalityId },
    select: { treatment: { select: { registrationId: true } } },
  });
  if (!m) throw httpErrors.notFound(`Treatment modality ${modalityId} not found`);
  await requireRegistrationInHospital(m.treatment.registrationId, hospitalId);
}
