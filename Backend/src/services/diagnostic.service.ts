import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";

async function ensureRegistration(id: number) {
  const reg = await prisma.registration.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!reg) throw httpErrors.notFound(`Registration ${id} not found`);
}

export const diagnosticService = {
  async listMethods(registrationId: number) {
    await ensureRegistration(registrationId);
    return prisma.diagnosticMethod.findMany({
      where: { registrationId },
      orderBy: { id: "asc" },
      include: { procedures: { orderBy: { id: "asc" } } },
    });
  },

  async createMethod(
    registrationId: number,
    data: { method: string; clinicalOnlyDate?: Date },
  ) {
    await ensureRegistration(registrationId);
    return prisma.diagnosticMethod.create({
      data: {
        registrationId,
        method: data.method as never,
        clinicalOnlyDate: data.clinicalOnlyDate,
      },
    });
  },

  async getMethod(methodId: number) {
    const method = await prisma.diagnosticMethod.findUnique({
      where: { id: methodId },
      include: { procedures: { orderBy: { id: "asc" } } },
    });
    if (!method) throw httpErrors.notFound(`Diagnostic method ${methodId} not found`);
    return method;
  },

  async updateMethod(
    methodId: number,
    data: { clinicalOnlyDate?: Date | null },
  ) {
    const method = await prisma.diagnosticMethod.findUnique({ where: { id: methodId } });
    if (!method) throw httpErrors.notFound(`Diagnostic method ${methodId} not found`);
    return prisma.diagnosticMethod.update({
      where: { id: methodId },
      data: data as never,
    });
  },

  async deleteMethod(methodId: number) {
    const method = await prisma.diagnosticMethod.findUnique({ where: { id: methodId } });
    if (!method) throw httpErrors.notFound(`Diagnostic method ${methodId} not found`);
    await prisma.diagnosticMethod.delete({ where: { id: methodId } });
  },

  // -------- procedures --------

  async listProcedures(methodId: number) {
    const method = await prisma.diagnosticMethod.findUnique({ where: { id: methodId } });
    if (!method) throw httpErrors.notFound(`Diagnostic method ${methodId} not found`);
    return prisma.diagnosticProcedure.findMany({
      where: { diagnosticMethodId: methodId },
      orderBy: { id: "asc" },
    });
  },

  async createProcedure(
    methodId: number,
    data: { procedureName: string; isOthers?: boolean; othersSpecify?: string; procedureDate?: Date },
  ) {
    const method = await prisma.diagnosticMethod.findUnique({ where: { id: methodId } });
    if (!method) throw httpErrors.notFound(`Diagnostic method ${methodId} not found`);
    return prisma.diagnosticProcedure.create({
      data: {
        diagnosticMethodId: methodId,
        procedureName: data.procedureName,
        isOthers: data.isOthers ?? false,
        othersSpecify: data.othersSpecify,
        procedureDate: data.procedureDate,
      },
    });
  },

  async updateProcedure(procedureId: number, data: Record<string, unknown>) {
    const proc = await prisma.diagnosticProcedure.findUnique({ where: { id: procedureId } });
    if (!proc) throw httpErrors.notFound(`Diagnostic procedure ${procedureId} not found`);
    return prisma.diagnosticProcedure.update({ where: { id: procedureId }, data: data as never });
  },

  async deleteProcedure(procedureId: number) {
    const proc = await prisma.diagnosticProcedure.findUnique({ where: { id: procedureId } });
    if (!proc) throw httpErrors.notFound(`Diagnostic procedure ${procedureId} not found`);
    await prisma.diagnosticProcedure.delete({ where: { id: procedureId } });
  },
};
