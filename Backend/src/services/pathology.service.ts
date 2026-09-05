import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";
import { requireRegistrationInHospital } from "./accessGuard.ts";

export const pathologyService = {
  async upsert(registrationId: number, hospitalId: number, data: Record<string, unknown>) {
    await requireRegistrationInHospital(registrationId, hospitalId);

    const existing = await prisma.pathologicalDiagnosis.findUnique({
      where: { registrationId },
    });

    if (existing) {
      return prisma.pathologicalDiagnosis.update({
        where: { registrationId },
        data: data as never,
      });
    }
    return prisma.pathologicalDiagnosis.create({
      data: { registrationId, ...(data as never) },
    });
  },

  async get(registrationId: number, hospitalId: number) {
    await requireRegistrationInHospital(registrationId, hospitalId);
    const p = await prisma.pathologicalDiagnosis.findUnique({
      where: { registrationId },
    });
    if (!p) throw httpErrors.notFound(`Pathological diagnosis for registration ${registrationId} not found`);
    return p;
  },

  async remove(registrationId: number, hospitalId: number) {
    await requireRegistrationInHospital(registrationId, hospitalId);
    const p = await prisma.pathologicalDiagnosis.findUnique({ where: { registrationId } });
    if (!p) throw httpErrors.notFound(`Pathological diagnosis for registration ${registrationId} not found`);
    await prisma.pathologicalDiagnosis.delete({ where: { registrationId } });
  },
};
