import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";
import {
  requireDiagnosticMethodInHospital,
  requireDiagnosticProcedureInHospital,
  requireRegistrationInHospital,
} from "./accessGuard.ts";

/**
 * Validate that at least one diagnostic method exists for a registration.
 * Called after all diagnostic methods have been submitted to ensure
 * the registration is not left without a diagnosis method.
 */
async function validateDiagnosticMethodsExist(registrationId: number) {
  const count = await prisma.diagnosticMethod.count({
    where: { registrationId },
  });
  if (count === 0) {
    throw httpErrors.badRequest("At least one method of diagnosis is required");
  }
}

export const diagnosticService = {
  async listMethods(registrationId: number, hospitalId: number) {
    await requireRegistrationInHospital(registrationId, hospitalId);
    return prisma.diagnosticMethod.findMany({
      where: { registrationId },
      orderBy: { id: "asc" },
      include: { procedures: { orderBy: { id: "asc" } } },
    });
  },

  async createMethod(
    registrationId: number,
    hospitalId: number,
    data: { method: string; clinicalOnlyDate?: Date },
  ) {
    await requireRegistrationInHospital(registrationId, hospitalId);
    return prisma.diagnosticMethod.create({
      data: {
        registrationId,
        method: data.method as never,
        clinicalOnlyDate: data.clinicalOnlyDate,
      },
    });
  },

  async getMethod(methodId: number, hospitalId: number) {
    await requireDiagnosticMethodInHospital(methodId, hospitalId);
    const method = await prisma.diagnosticMethod.findUnique({
      where: { id: methodId },
      include: { procedures: { orderBy: { id: "asc" } } },
    });
    if (!method) throw httpErrors.notFound(`Diagnostic method ${methodId} not found`);
    return method;
  },

  async updateMethod(
    methodId: number,
    hospitalId: number,
    data: { clinicalOnlyDate?: Date | null },
  ) {
    await requireDiagnosticMethodInHospital(methodId, hospitalId);
    const method = await prisma.diagnosticMethod.findUnique({ where: { id: methodId } });
    if (!method) throw httpErrors.notFound(`Diagnostic method ${methodId} not found`);
    return prisma.diagnosticMethod.update({
      where: { id: methodId },
      data: data as never,
    });
  },

  async deleteMethod(methodId: number, hospitalId: number) {
    await requireDiagnosticMethodInHospital(methodId, hospitalId);
    const method = await prisma.diagnosticMethod.findUnique({ where: { id: methodId } });
    if (!method) throw httpErrors.notFound(`Diagnostic method ${methodId} not found`);
    await prisma.diagnosticMethod.delete({ where: { id: methodId } });
  },

  /**
   * Validate that at least one diagnostic method exists for a registration.
   * Exposed for external callers (e.g. registration service post-submission check).
   */
  async validateMethodsExist(registrationId: number, hospitalId: number) {
    await requireRegistrationInHospital(registrationId, hospitalId);
    await validateDiagnosticMethodsExist(registrationId);
  },

  // -------- procedures --------

  async listProcedures(methodId: number, hospitalId: number) {
    await requireDiagnosticMethodInHospital(methodId, hospitalId);
    return prisma.diagnosticProcedure.findMany({
      where: { diagnosticMethodId: methodId },
      orderBy: { id: "asc" },
    });
  },

  async createProcedure(
    methodId: number,
    hospitalId: number,
    data: { procedureName: string; isOthers?: boolean; othersSpecify?: string; procedureDate?: Date },
  ) {
    await requireDiagnosticMethodInHospital(methodId, hospitalId);
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

  async updateProcedure(procedureId: number, hospitalId: number, data: Record<string, unknown>) {
    await requireDiagnosticProcedureInHospital(procedureId, hospitalId);
    const proc = await prisma.diagnosticProcedure.findUnique({ where: { id: procedureId } });
    if (!proc) throw httpErrors.notFound(`Diagnostic procedure ${procedureId} not found`);
    return prisma.diagnosticProcedure.update({ where: { id: procedureId }, data: data as never });
  },

  async deleteProcedure(procedureId: number, hospitalId: number) {
    await requireDiagnosticProcedureInHospital(procedureId, hospitalId);
    const proc = await prisma.diagnosticProcedure.findUnique({ where: { id: procedureId } });
    if (!proc) throw httpErrors.notFound(`Diagnostic procedure ${procedureId} not found`);
    await prisma.diagnosticProcedure.delete({ where: { id: procedureId } });
  },
};
