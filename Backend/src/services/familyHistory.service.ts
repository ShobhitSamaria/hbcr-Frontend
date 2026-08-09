import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";

export const familyHistoryService = {
  async get(registrationId: number) {
    const f = await prisma.familialCancerHistory.findUnique({ where: { registrationId } });
    if (!f)
      throw httpErrors.notFound(
        `Family history for registration ${registrationId} not found`,
      );
    return f;
  },

  async upsert(registrationId: number, data: Record<string, unknown>) {
    const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
    if (!reg) throw httpErrors.notFound(`Registration ${registrationId} not found`);

    const existing = await prisma.familialCancerHistory.findUnique({
      where: { registrationId },
    });
    if (existing) {
      return prisma.familialCancerHistory.update({
        where: { registrationId },
        data: data as never,
      });
    }
    return prisma.familialCancerHistory.create({
      data: { registrationId, ...(data as never) },
    });
  },

  async remove(registrationId: number) {
    const f = await prisma.familialCancerHistory.findUnique({ where: { registrationId } });
    if (!f)
      throw httpErrors.notFound(
        `Family history for registration ${registrationId} not found`,
      );
    await prisma.familialCancerHistory.delete({ where: { registrationId } });
  },
};

// Silence unused warnings on the ambient pass.
export const _internal = { internal: "ok" as const };
void _internal;
