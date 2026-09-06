import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";
import {
  requireRegistrationInHospital,
  requireTreatmentInHospital,
  requireTreatmentModalityInHospital,
} from "./accessGuard.ts";

export const treatmentService = {
  async listByRegistration(registrationId: number, hospitalId: number) {
    await requireRegistrationInHospital(registrationId, hospitalId);
    return prisma.treatment.findMany({
      where: { registrationId },
      orderBy: { id: "asc" },
      include: { modalities: { orderBy: { id: "asc" } } },
    });
  },

  async upsert(
    registrationId: number,
    hospitalId: number,
    data: { treatmentStage: string; [k: string]: unknown },
  ) {
    await requireRegistrationInHospital(registrationId, hospitalId);

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

  async get(treatmentId: number, hospitalId: number) {
    await requireTreatmentInHospital(treatmentId, hospitalId);
    const t = await prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: { modalities: { orderBy: { id: "asc" } } },
    });
    if (!t) throw httpErrors.notFound(`Treatment ${treatmentId} not found`);
    return t;
  },

  async update(treatmentId: number, hospitalId: number, data: Record<string, unknown>) {
    await requireTreatmentInHospital(treatmentId, hospitalId);
    const t = await prisma.treatment.findUnique({ where: { id: treatmentId } });
    if (!t) throw httpErrors.notFound(`Treatment ${treatmentId} not found`);
    return prisma.treatment.update({ where: { id: treatmentId }, data: data as never });
  },

  async remove(treatmentId: number, hospitalId: number) {
    await requireTreatmentInHospital(treatmentId, hospitalId);
    const t = await prisma.treatment.findUnique({ where: { id: treatmentId } });
    if (!t) throw httpErrors.notFound(`Treatment ${treatmentId} not found`);
    await prisma.treatment.delete({ where: { id: treatmentId } });
  },

  // -------- modalities --------

  async listModalities(treatmentId: number, hospitalId: number) {
    await requireTreatmentInHospital(treatmentId, hospitalId);
    return prisma.treatmentModalityDetail.findMany({
      where: { treatmentId },
      orderBy: { id: "asc" },
    });
  },

  async upsertModality(
    treatmentId: number,
    hospitalId: number,
    data: { modality: string; [k: string]: unknown },
  ) {
    await requireTreatmentInHospital(treatmentId, hospitalId);

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

  async updateModality(modalityId: number, hospitalId: number, data: Record<string, unknown>) {
    await requireTreatmentModalityInHospital(modalityId, hospitalId);
    const m = await prisma.treatmentModalityDetail.findUnique({ where: { id: modalityId } });
    if (!m) throw httpErrors.notFound(`Treatment modality ${modalityId} not found`);
    return prisma.treatmentModalityDetail.update({ where: { id: modalityId }, data: data as never });
  },

  async deleteModality(modalityId: number, hospitalId: number) {
    await requireTreatmentModalityInHospital(modalityId, hospitalId);
    const m = await prisma.treatmentModalityDetail.findUnique({ where: { id: modalityId } });
    if (!m) throw httpErrors.notFound(`Treatment modality ${modalityId} not found`);
    await prisma.treatmentModalityDetail.delete({ where: { id: modalityId } });
  },
};
