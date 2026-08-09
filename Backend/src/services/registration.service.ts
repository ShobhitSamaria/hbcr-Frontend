import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";
import { buildMeta, parsePagination } from "../utils/pagination.ts";

const FULL_INCLUDE = {
  hospital: { select: { id: true, name: true } },
  pathologicalDiagnosis: true,
  familialCancerHistory: true,
  diagnosticMethods: {
    include: { procedures: { orderBy: { id: "asc" as const } } },
  },
  treatments: {
    include: {
      modalities: { orderBy: { id: "asc" as const } },
    },
    orderBy: { id: "asc" as const },
  },
} satisfies Prisma.RegistrationInclude;

export const registrationService = {
  async create(
    patientId: number,
    input: {
      hbcrRegistrationNo: string;
      hospitalId: number;
      departmentName?: string;
      unitNumber?: string;
      hospitalRegistrationNo?: string;
      dateOfReporting?: Date;
      caseRegisteredThrough?: string;
      referralType?: string;
      referralFacilityName?: string;
      referralFacilityCity?: string;
      referralFacilityDistrict?: string;
      referralFacilityHospitalLabNh?: string;
      referralFacilityRegDate?: Date;
      dateOfFirstDiagnosis?: Date;
      anthropometricHeightCm?: number;
      anthropometricWeightKg?: number;
      maritalStatus?: string;
      education?: string;
      status?: string;
      formCompletedBy?: string;
      formCompletionDate?: Date;
      createdByUserId?: number;
    },
  ) {
    // Patient must exist; hospital must exist (Prisma also enforces via FK)
    const [patient, hospital] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } }),
      prisma.hospital.findUnique({ where: { id: input.hospitalId }, select: { id: true } }),
    ]);
    if (!patient) throw httpErrors.notFound(`Patient ${patientId} not found`);
    if (!hospital) throw httpErrors.notFound(`Hospital ${input.hospitalId} not found`);

    return prisma.registration.create({
      data: {
        patientId,
        hbcrRegistrationNo: input.hbcrRegistrationNo,
        hospitalId: input.hospitalId,
        ...(input.departmentName !== undefined ? { departmentName: input.departmentName } : {}),
        ...(input.unitNumber !== undefined ? { unitNumber: input.unitNumber } : {}),
        ...(input.hospitalRegistrationNo !== undefined
          ? { hospitalRegistrationNo: input.hospitalRegistrationNo }
          : {}),
        ...(input.dateOfReporting !== undefined ? { dateOfReporting: input.dateOfReporting } : {}),
        ...(input.caseRegisteredThrough !== undefined
          ? { caseRegisteredThrough: input.caseRegisteredThrough as never }
          : {}),
        ...(input.referralType !== undefined
          ? { referralType: input.referralType as never }
          : {}),
        ...(input.referralFacilityName !== undefined
          ? { referralFacilityName: input.referralFacilityName }
          : {}),
        ...(input.referralFacilityCity !== undefined
          ? { referralFacilityCity: input.referralFacilityCity }
          : {}),
        ...(input.referralFacilityDistrict !== undefined
          ? { referralFacilityDistrict: input.referralFacilityDistrict }
          : {}),
        ...(input.referralFacilityHospitalLabNh !== undefined
          ? { referralFacilityHospitalLabNh: input.referralFacilityHospitalLabNh }
          : {}),
        ...(input.referralFacilityRegDate !== undefined
          ? { referralFacilityRegDate: input.referralFacilityRegDate }
          : {}),
        ...(input.dateOfFirstDiagnosis !== undefined
          ? { dateOfFirstDiagnosis: input.dateOfFirstDiagnosis }
          : {}),
        ...(input.anthropometricHeightCm !== undefined
          ? { anthropometricHeightCm: input.anthropometricHeightCm }
          : {}),
        ...(input.anthropometricWeightKg !== undefined
          ? { anthropometricWeightKg: input.anthropometricWeightKg }
          : {}),
        ...(input.maritalStatus !== undefined
          ? { maritalStatus: input.maritalStatus as never }
          : {}),
        ...(input.education !== undefined ? { education: input.education as never } : {}),
        ...(input.status !== undefined ? { status: input.status as never } : {}),
        ...(input.formCompletedBy !== undefined
          ? { formCompletedBy: input.formCompletedBy }
          : {}),
        ...(input.formCompletionDate !== undefined
          ? { formCompletionDate: input.formCompletionDate }
          : {}),
        ...(input.createdByUserId !== undefined
          ? { createdByUserId: input.createdByUserId }
          : {}),
      },
      include: FULL_INCLUDE,
    });
  },

  async getById(id: number) {
    const reg = await prisma.registration.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!reg) throw httpErrors.notFound(`Registration ${id} not found`);
    return reg;
  },

  async list(query: Record<string, unknown>) {
    const { page, limit, skip, take } = parsePagination(query, { defaultLimit: 20 });
    const where: Prisma.RegistrationWhereInput = {};
    const status = typeof query.status === "string" ? query.status : undefined;
    const hospitalId =
      typeof query.hospitalId === "string" || typeof query.hospitalId === "number"
        ? Number(query.hospitalId)
        : undefined;
    const patientId =
      typeof query.patientId === "string" || typeof query.patientId === "number"
        ? Number(query.patientId)
        : undefined;
    const q = typeof query.q === "string" ? query.q.trim() : undefined;

    if (status) where.status = status as never;
    if (hospitalId && Number.isFinite(hospitalId)) where.hospitalId = hospitalId;
    if (patientId && Number.isFinite(patientId)) where.patientId = patientId;
    if (q) where.hbcrRegistrationNo = { contains: q, mode: "insensitive" };

    const [items, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: { id: "desc" },
        skip,
        take,
        include: {
          hospital: { select: { id: true, name: true } },
          patient: { select: { id: true, fullName: true, age: true, gender: true } },
        },
      }),
      prisma.registration.count({ where }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async update(
    id: number,
    input: Record<string, unknown>,
  ) {
    const exists = await prisma.registration.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw httpErrors.notFound(`Registration ${id} not found`);
    return prisma.registration.update({
      where: { id },
      data: input as Prisma.RegistrationUpdateInput,
    });
  },

  async remove(id: number) {
    const exists = await prisma.registration.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw httpErrors.notFound(`Registration ${id} not found`);
    await prisma.registration.delete({ where: { id } });
  },

  async listForPatient(patientId: number) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) throw httpErrors.notFound(`Patient ${patientId} not found`);
    return prisma.registration.findMany({
      where: { patientId },
      orderBy: { id: "desc" },
      include: { hospital: { select: { id: true, name: true } } },
    });
  },
};
