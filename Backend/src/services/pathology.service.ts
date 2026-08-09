import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";

export const pathologyService = {
  async upsert(registrationId: number, data: Record<string, unknown>) {
    const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
    if (!reg) throw httpErrors.notFound(`Registration ${registrationId} not found`);

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

  async get(registrationId: number) {
    const p = await prisma.pathologicalDiagnosis.findUnique({
      where: { registrationId },
    });
    if (!p) throw httpErrors.notFound(`Pathological diagnosis for registration ${registrationId} not found`);
    return p;
  },

  async remove(registrationId: number) {
    const p = await prisma.pathologicalDiagnosis.findUnique({ where: { registrationId } });
    if (!p) throw httpErrors.notFound(`Pathological diagnosis for registration ${registrationId} not found`);
    await prisma.pathologicalDiagnosis.delete({ where: { registrationId } });
  },
};
