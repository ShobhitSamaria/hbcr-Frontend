import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";
import { buildMeta, parsePagination } from "../utils/pagination.ts";
import { sequenceService } from "./sequence.service.ts";

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
      hbcrRegistrationNo?: string;
      hospitalId?: number; // Ignored — forced to the authenticated user's hospital
      referenceNo?: string;
      departmentName?: string;
      unitNumber?: string;
      hospitalRegistrationNo?: string;
      hospitalRegistrationNoType?: string;
      dateOfReporting?: Date;
      caseRegisteredThrough?: string;
      caseRegisteredThroughOther?: string;
      referralType?: string;
      referralFacilityName?: string;
      referralFacilityCity?: string;
      referralFacilityDistrict?: string;
      referralFacilityPincode?: string;
      referralFacilityHospitalLabNh?: string;
      referralFacilityRegDate?: Date;
      dateOfFirstDiagnosis?: Date;
      microscopicConfirmationLater?: boolean;
      anthropometricHeightCm?: number;
      anthropometricWeightKg?: number;
      maritalStatus?: string;
      maritalStatusOther?: string;
      education?: string;
      educationOther?: string;
      occupation?: string;
      status?: string;
      formCompletedBy?: string;
      formCompletionDate?: Date;
      remarks?: string;
      createdByUserId?: number;
    },
    /** Hospital id from the authenticated user — overrides any value in input. */
    reqHospitalId: number,
  ) {
    // Force hospitalId to the authenticated user's hospital — ignore any value
    // the client sends in the request body to prevent cross-hospital access.
    const hospitalId = reqHospitalId;

    const [patient, hospital] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } }),
      prisma.hospital.findUnique({ where: { id: hospitalId }, select: { id: true, centre: { select: { code: true } } } }),
    ]);
    if (!patient) throw httpErrors.notFound(`Patient ${patientId} not found`);
    if (!hospital) throw httpErrors.notFound(`Hospital ${hospitalId} not found`);

    // Always auto-generate Reference Number and Registration Number server-side.
    // Preview numbers from the frontend are for display only; generating here
    // prevents P2002 duplicate-key errors from concurrent submissions.
    const centreCode = hospital.centre?.code;
    if (!centreCode) {
      throw httpErrors.badRequest(`Hospital ${hospitalId} does not have a centre code configured for Reference Number generation`);
    }
    const numbers = await sequenceService.generateNumbers(hospitalId, centreCode);
    const referenceNo = numbers.referenceNo;
    const hbcrRegistrationNo = numbers.registrationNo;

    return prisma.registration.create({
      data: {
        patientId,
        hbcrRegistrationNo,
        hospitalId,
        ...(referenceNo !== undefined ? { referenceNo } : {}),
        ...(input.departmentName !== undefined ? { departmentName: input.departmentName } : {}),
        ...(input.unitNumber !== undefined ? { unitNumber: input.unitNumber } : {}),
        ...(input.hospitalRegistrationNo !== undefined
          ? { hospitalRegistrationNo: input.hospitalRegistrationNo }
          : {}),
        ...(input.hospitalRegistrationNoType !== undefined
          ? { hospitalRegistrationNoType: input.hospitalRegistrationNoType }
          : {}),
        ...(input.dateOfReporting !== undefined ? { dateOfReporting: input.dateOfReporting } : {}),
        ...(input.caseRegisteredThrough !== undefined
          ? { caseRegisteredThrough: input.caseRegisteredThrough as never }
          : {}),
        ...(input.caseRegisteredThroughOther !== undefined
          ? { caseRegisteredThroughOther: input.caseRegisteredThroughOther }
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
        ...(input.referralFacilityPincode !== undefined
          ? { referralFacilityPincode: input.referralFacilityPincode }
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
        ...(input.microscopicConfirmationLater !== undefined
          ? { microscopicConfirmationLater: input.microscopicConfirmationLater }
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
        ...(input.maritalStatusOther !== undefined
          ? { maritalStatusOther: input.maritalStatusOther }
          : {}),
        ...(input.education !== undefined ? { education: input.education as never } : {}),
        ...(input.educationOther !== undefined ? { educationOther: input.educationOther } : {}),
        ...(input.occupation !== undefined ? { occupation: input.occupation } : {}),
        ...(input.status !== undefined ? { status: input.status as never } : {}),
        ...(input.formCompletedBy !== undefined
          ? { formCompletedBy: input.formCompletedBy }
          : {}),
        ...(input.formCompletionDate !== undefined
          ? { formCompletionDate: input.formCompletionDate }
          : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
        ...(input.createdByUserId !== undefined
          ? { createdByUserId: input.createdByUserId }
          : {}),
      },
      include: FULL_INCLUDE,
    });
  },

  async getById(id: number, hospitalId: number) {
    const reg = await prisma.registration.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!reg) throw httpErrors.notFound(`Registration ${id} not found`);
    if (reg.hospitalId !== hospitalId) throw httpErrors.notFound(`Registration ${id} not found`);
    return reg;
  },

  async list(query: Record<string, unknown>, hospitalId: number) {
    const { page, limit, skip, take } = parsePagination(query, { defaultLimit: 20 });
    // Always scope to the logged-in user's hospital — ignore any hospitalId from query
    const where: Prisma.RegistrationWhereInput = { hospitalId };
    const status = typeof query.status === "string" ? query.status : undefined;
    const patientId =
      typeof query.patientId === "string" || typeof query.patientId === "number"
        ? Number(query.patientId)
        : undefined;
    const q = typeof query.q === "string" ? query.q.trim() : undefined;

    if (status) where.status = status as never;
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
    hospitalId: number,
  ) {
    const exists = await prisma.registration.findFirst({ where: { id, hospitalId }, select: { id: true } });
    if (!exists) throw httpErrors.notFound(`Registration ${id} not found`);
    return prisma.registration.update({
      where: { id },
      data: input as Prisma.RegistrationUpdateInput,
    });
  },

  async remove(id: number, hospitalId: number) {
    const exists = await prisma.registration.findFirst({ where: { id, hospitalId }, select: { id: true } });
    if (!exists) throw httpErrors.notFound(`Registration ${id} not found`);
    await prisma.registration.delete({ where: { id } });
  },

  async listForPatient(patientId: number, hospitalId: number) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) throw httpErrors.notFound(`Patient ${patientId} not found`);
    return prisma.registration.findMany({
      where: { patientId, hospitalId },
      orderBy: { id: "desc" },
      include: { hospital: { select: { id: true, name: true } } },
    });
  },
};
