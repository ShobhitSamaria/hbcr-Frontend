import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";
import { requireRegistrationInHospital } from "./accessGuard.ts";

export const familyHistoryService = {
  async get(registrationId: number, hospitalId: number) {
    await requireRegistrationInHospital(registrationId, hospitalId);
    const f = await prisma.familialCancerHistory.findUnique({ where: { registrationId } });
    if (!f)
      throw httpErrors.notFound(
        `Family history for registration ${registrationId} not found`,
      );
    return f;
  },

  async upsert(registrationId: number, hospitalId: number, data: Record<string, unknown>) {
    await requireRegistrationInHospital(registrationId, hospitalId);

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

  async remove(registrationId: number, hospitalId: number) {
    await requireRegistrationInHospital(registrationId, hospitalId);
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
