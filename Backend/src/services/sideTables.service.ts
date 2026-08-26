import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";
import { validateIdNumberFormat } from "../validators/patientId.validator.ts";

/**
 * Services for the side tables hanging off hbcr.patients:
 *   - identifications (Aadhaar / ABHA / ...)
 *   - relatives (father / mother / spouse)
 *   - addresses (residential / permanent)
 *   - habits (smoking / ...)
 *   - comorbidities (tb / hypertension / ...)
 *
 * Every function requires a patientId and returns the freshly created/updated
 * row. The same pattern is used for update/delete by id.
 */
async function ensurePatient(patientId: number) {
  const p = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true },
  });
  if (!p) throw httpErrors.notFound(`Patient ${patientId} not found`);
}

export const sideTablesService = {
  // ---------- Identifications ----------
  async listIdentifiers(patientId: number) {
    await ensurePatient(patientId);
    return prisma.patientIdentification.findMany({
      where: { patientId },
      orderBy: { id: "asc" },
    });
  },
  async createIdentifier(patientId: number, data: { idType: string; number: string }) {
    await ensurePatient(patientId);
    // Validate ID number format based on type
    const formatError = validateIdNumberFormat(data.idType, data.number);
    if (formatError) throw httpErrors.badRequest(formatError);
    return prisma.patientIdentification.create({
      data: { patientId, idType: data.idType as never, number: data.number },
    });
  },
  async updateIdentifier(patientId: number, identifierId: number, data: { idType?: string; number?: string }) {
    const row = await prisma.patientIdentification.findUnique({ where: { id: identifierId } });
    if (!row || row.patientId !== patientId) throw httpErrors.notFound("Identification not found");
    // Validate ID number format if type or number is being updated
    const idType = data.idType ?? row.idType;
    const number = data.number ?? row.number;
    const formatError = validateIdNumberFormat(idType, number);
    if (formatError) throw httpErrors.badRequest(formatError);
    return prisma.patientIdentification.update({
      where: { id: identifierId },
      data: {
        ...(data.idType !== undefined ? { idType: data.idType as never } : {}),
        ...(data.number !== undefined ? { number: data.number } : {}),
      },
    });
  },
  async deleteIdentifier(patientId: number, identifierId: number) {
    const row = await prisma.patientIdentification.findUnique({ where: { id: identifierId } });
    if (!row || row.patientId !== patientId) throw httpErrors.notFound("Identification not found");
    await prisma.patientIdentification.delete({ where: { id: identifierId } });
  },

  // ---------- Relatives ----------
  async listRelatives(patientId: number) {
    await ensurePatient(patientId);
    return prisma.patientRelative.findMany({
      where: { patientId },
      orderBy: { id: "asc" },
    });
  },
  async createRelative(patientId: number, data: { relationship: string; name?: string; mobileNumber?: string }) {
    await ensurePatient(patientId);
    return prisma.patientRelative.create({
      data: { patientId, relationship: data.relationship as never, name: data.name, mobileNumber: data.mobileNumber },
    });
  },
  async updateRelative(patientId: number, relativeId: number, data: { name?: string; mobileNumber?: string }) {
    const row = await prisma.patientRelative.findUnique({ where: { id: relativeId } });
    if (!row || row.patientId !== patientId) throw httpErrors.notFound("Relative not found");
    return prisma.patientRelative.update({
      where: { id: relativeId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.mobileNumber !== undefined ? { mobileNumber: data.mobileNumber } : {}),
      },
    });
  },
  async deleteRelative(patientId: number, relativeId: number) {
    const row = await prisma.patientRelative.findUnique({ where: { id: relativeId } });
    if (!row || row.patientId !== patientId) throw httpErrors.notFound("Relative not found");
    await prisma.patientRelative.delete({ where: { id: relativeId } });
  },

  // ---------- Addresses ----------
  async listAddresses(patientId: number) {
    await ensurePatient(patientId);
    return prisma.patientAddress.findMany({
      where: { patientId },
      orderBy: { id: "asc" },
    });
  },
  async createAddress(patientId: number, data: Record<string, unknown>) {
    await ensurePatient(patientId);
    return prisma.patientAddress.create({
      data: { patientId, ...(data as never) },
    });
  },
  async updateAddress(patientId: number, addressId: number, data: Record<string, unknown>) {
    const row = await prisma.patientAddress.findUnique({ where: { id: addressId } });
    if (!row || row.patientId !== patientId) throw httpErrors.notFound("Address not found");
    return prisma.patientAddress.update({
      where: { id: addressId },
      data: data as never,
    });
  },
  async deleteAddress(patientId: number, addressId: number) {
    const row = await prisma.patientAddress.findUnique({ where: { id: addressId } });
    if (!row || row.patientId !== patientId) throw httpErrors.notFound("Address not found");
    await prisma.patientAddress.delete({ where: { id: addressId } });
  },

  // ---------- Habits ----------
  async listHabits(patientId: number) {
    await ensurePatient(patientId);
    return prisma.patientHabit.findMany({ where: { patientId }, orderBy: { id: "asc" } });
  },
  async createHabit(patientId: number, data: { habit: string; answer?: string; durationMonths?: number }) {
    await ensurePatient(patientId);
    return prisma.patientHabit.create({
      data: {
        patientId,
        habit: data.habit as never,
        answer: (data.answer ?? "NO") as never,
        durationMonths: data.durationMonths,
      },
    });
  },
  async updateHabit(patientId: number, habitId: number, data: { answer?: string; durationMonths?: number }) {
    const row = await prisma.patientHabit.findUnique({ where: { id: habitId } });
    if (!row || row.patientId !== patientId) throw httpErrors.notFound("Habit not found");
    return prisma.patientHabit.update({
      where: { id: habitId },
      data: {
        ...(data.answer !== undefined ? { answer: data.answer as never } : {}),
        ...(data.durationMonths !== undefined ? { durationMonths: data.durationMonths } : {}),
      },
    });
  },
  async deleteHabit(patientId: number, habitId: number) {
    const row = await prisma.patientHabit.findUnique({ where: { id: habitId } });
    if (!row || row.patientId !== patientId) throw httpErrors.notFound("Habit not found");
    await prisma.patientHabit.delete({ where: { id: habitId } });
  },

  // ---------- Comorbidities ----------
  async listComorbidities(patientId: number) {
    await ensurePatient(patientId);
    return prisma.patientComorbidity.findMany({
      where: { patientId },
      orderBy: { id: "asc" },
    });
  },
  async createComorbidity(patientId: number, data: { comorbidity: string; answer?: string; durationMonths?: number }) {
    await ensurePatient(patientId);
    return prisma.patientComorbidity.create({
      data: {
        patientId,
        comorbidity: data.comorbidity as never,
        answer: (data.answer ?? "NO") as never,
        durationMonths: data.durationMonths,
      },
    });
  },
  async updateComorbidity(patientId: number, comorbidityId: number, data: { answer?: string; durationMonths?: number }) {
    const row = await prisma.patientComorbidity.findUnique({ where: { id: comorbidityId } });
    if (!row || row.patientId !== patientId) throw httpErrors.notFound("Comorbidity not found");
    return prisma.patientComorbidity.update({
      where: { id: comorbidityId },
      data: {
        ...(data.answer !== undefined ? { answer: data.answer as never } : {}),
        ...(data.durationMonths !== undefined ? { durationMonths: data.durationMonths } : {}),
      },
    });
  },
  async deleteComorbidity(patientId: number, comorbidityId: number) {
    const row = await prisma.patientComorbidity.findUnique({ where: { id: comorbidityId } });
    if (!row || row.patientId !== patientId) throw httpErrors.notFound("Comorbidity not found");
    await prisma.patientComorbidity.delete({ where: { id: comorbidityId } });
  },
};
