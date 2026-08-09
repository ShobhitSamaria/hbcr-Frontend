import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";

async function ensureRegistration(id: number) {
  const reg = await prisma.registration.findUnique({ where: { id }, select: { id: true } });
  if (!reg) throw httpErrors.notFound(`Registration ${id} not found`);
}

export const treatmentService = {
  async listByRegistration(registrationId: number) {
    await ensureRegistration(registrationId);
    return prisma.treatment.findMany({
      where: { registrationId },
      orderBy: { id: "asc" },
      include: { modalities: { orderBy: { id: "asc" } } },
    });
  },

  async upsert(
    registrationId: number,
    data: { treatmentStage: string; [k: string]: unknown },
  ) {
    await ensureRegistration(registrationId);

    const existing = await prisma.treatment.findFirst({
      where: { registrationId, treatmentStage: data.treatmentStage as never },
    });

    const rest = { ...data };
    delete (rest as { treatmentStage?: string }).treatmentStage;

    if (existing) {
      return prisma.treatment.update({
        where: { id: existing.id },
        data: rest as never,
      });
    }
    return prisma.treatment.create({
      data: { registrationId, ...(data as never) },
    });
  },

  async get(treatmentId: number) {
    const t = await prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: { modalities: { orderBy: { id: "asc" } } },
    });
    if (!t) throw httpErrors.notFound(`Treatment ${treatmentId} not found`);
    return t;
  },

  async update(treatmentId: number, data: Record<string, unknown>) {
    const t = await prisma.treatment.findUnique({ where: { id: treatmentId } });
    if (!t) throw httpErrors.notFound(`Treatment ${treatmentId} not found`);
    return prisma.treatment.update({ where: { id: treatmentId }, data: data as never });
  },

  async remove(treatmentId: number) {
    const t = await prisma.treatment.findUnique({ where: { id: treatmentId } });
    if (!t) throw httpErrors.notFound(`Treatment ${treatmentId} not found`);
    await prisma.treatment.delete({ where: { id: treatmentId } });
  },

  // -------- modalities --------

  async listModalities(treatmentId: number) {
    const t = await prisma.treatment.findUnique({ where: { id: treatmentId } });
    if (!t) throw httpErrors.notFound(`Treatment ${treatmentId} not found`);
    return prisma.treatmentModalityDetail.findMany({
      where: { treatmentId },
      orderBy: { id: "asc" },
    });
  },

  async upsertModality(
    treatmentId: number,
    data: { modality: string; [k: string]: unknown },
  ) {
    const t = await prisma.treatment.findUnique({ where: { id: treatmentId } });
    if (!t) throw httpErrors.notFound(`Treatment ${treatmentId} not found`);

    const existing = await prisma.treatmentModalityDetail.findFirst({
      where: { treatmentId, modality: data.modality as never },
    });
    const rest = { ...data };
    delete (rest as { modality?: string }).modality;

    if (existing) {
      return prisma.treatmentModalityDetail.update({
        where: { id: existing.id },
        data: rest as never,
      });
    }
    return prisma.treatmentModalityDetail.create({
      data: { treatmentId, ...(data as never) },
    });
  },

  async updateModality(modalityId: number, data: Record<string, unknown>) {
    const m = await prisma.treatmentModalityDetail.findUnique({ where: { id: modalityId } });
    if (!m) throw httpErrors.notFound(`Treatment modality ${modalityId} not found`);
    return prisma.treatmentModalityDetail.update({ where: { id: modalityId }, data: data as never });
  },

  async deleteModality(modalityId: number) {
    const m = await prisma.treatmentModalityDetail.findUnique({ where: { id: modalityId } });
    if (!m) throw httpErrors.notFound(`Treatment modality ${modalityId} not found`);
    await prisma.treatmentModalityDetail.delete({ where: { id: modalityId } });
  },
};
