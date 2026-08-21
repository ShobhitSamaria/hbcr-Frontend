import type { Prisma } from "../../generated/prisma/client.ts";
import { Prisma as P } from "../../generated/prisma/client.ts";
import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";
import { buildMeta, parsePagination } from "../utils/pagination.ts";

/**
 * Fields that are read-only after patient creation.
 * These cannot be modified via the update endpoint.
 */
const PROTECTED_FIELDS = new Set([
  "fullName", "firstName", "middleName", "lastName",
  "age", "dateOfBirth", "gender",
]);

const SIDE_TABLES_INCLUDE = {
  identifications: true,
  relatives: true,
  addresses: true,
  habits: true,
  comorbidities: true,
  registrations: {
    include: {
      hospital: { select: { id: true, name: true } },
      pathologicalDiagnosis: true,
      familialCancerHistory: true,
    },
  },
} satisfies Prisma.PatientInclude;

export const patientService = {
  async create(input: {
    fullName: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    age?: number;
    dateOfBirth?: Date;
    gender: string;
    healthSchemeBeneficiary?: boolean;
    healthSchemeDetails?: string;
  }) {
    return prisma.patient.create({
      data: {
        fullName: input.fullName,
        firstName: input.firstName ?? null,
        middleName: input.middleName ?? null,
        lastName: input.lastName ?? null,
        age: input.age,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender as P.PatientUncheckedCreateInput["gender"],
        ...(input.healthSchemeBeneficiary !== undefined
          ? { healthSchemeBeneficiary: input.healthSchemeBeneficiary }
          : {}),
        ...(input.healthSchemeDetails !== undefined
          ? { healthSchemeDetails: input.healthSchemeDetails }
          : {}),
      },
    });
  },

  async getById(id: number, hospitalId: number) {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: SIDE_TABLES_INCLUDE,
    });
    if (!patient) throw httpErrors.notFound(`Patient ${id} not found`);
    // Ensure patient has at least one registration in the caller's hospital
    const hasAccess = patient.registrations?.some((r) => r.hospitalId === hospitalId);
    if (!hasAccess) throw httpErrors.notFound(`Patient ${id} not found`);
    return patient;
  },

  async list(query: Record<string, unknown>, hospitalId: number) {
    const { page, limit, skip, take } = parsePagination(query, { defaultLimit: 20 });

    const str = (key: string) =>
      typeof query[key] === "string" ? (query[key] as string).trim() : undefined;
    const search = str("search"); // legacy: full-name text search
    const name = str("name");
    const referenceNo = str("referenceNo");
    const hospitalRegNo = str("hospitalRegNo");
    const aadhaar = str("aadhaar");
    const mobile = str("mobile");
    const icd10 = str("icd10");
    const dateFrom = str("dateFrom");
    const dateTo = str("dateTo");
    const gender = str("gender");

    const and: Prisma.PatientWhereInput[] = [];

    // Patient-level filters.
    const nameTerm = name ?? search;
    if (nameTerm) {
      and.push({ fullName: { contains: nameTerm, mode: "insensitive" } });
    }
    if (gender) and.push({ gender: gender as P.PatientWhereInput["gender"] });

    // Aadhaar lives on the identifications side table (idType = AADHAAR).
    if (aadhaar) {
      and.push({
        identifications: {
          some: {
            idType: "AADHAAR",
            number: { contains: aadhaar, mode: "insensitive" },
          },
        },
      });
    }

    // Mobile number is captured on the address side tables (residential /
    // permanent). Match either.
    if (mobile) {
      and.push({
        addresses: {
          some: { mobileNumber: { contains: mobile, mode: "insensitive" } },
        },
      });
    }

    // Registration-level filters must all hold for a single registration of
    // the patient (reference no, hospital registration no, ICD-10 site, and
    // the date-of-entry range live on hbcr.registrations).
    const regAnd: Prisma.RegistrationWhereInput[] = [];
    if (referenceNo) {
      regAnd.push({ referenceNo: { contains: referenceNo, mode: "insensitive" } });
    }
    if (hospitalRegNo) {
      regAnd.push({
        hospitalRegistrationNo: { contains: hospitalRegNo, mode: "insensitive" },
      });
    }
    if (icd10) {
      regAnd.push({
        pathologicalDiagnosis: { icd10Site: { contains: icd10, mode: "insensitive" } },
      });
    }
    const entryRange: Prisma.DateTimeFilter = {};
    if (dateFrom && !Number.isNaN(new Date(dateFrom).getTime())) {
      entryRange.gte = new Date(`${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo && !Number.isNaN(new Date(dateTo).getTime())) {
      entryRange.lte = new Date(`${dateTo}T23:59:59.999Z`);
    }
    if (entryRange.gte || entryRange.lte) regAnd.push({ createdAt: entryRange });
    if (regAnd.length > 0) and.push({ registrations: { some: { AND: regAnd } } });

    // Hospital scoping: only show patients that have at least one registration in this hospital.
    and.push({ registrations: { some: { hospitalId } } });

    const where: Prisma.PatientWhereInput = and.length > 0 ? { AND: and } : {};

    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { id: "desc" },
        include: {
          identifications: true,
          registrations: {
            orderBy: { id: "desc" },
            take: 1,
            include: {
              hospital: {
                select: {
                  id: true,
                  name: true,
                },
              },
              pathologicalDiagnosis: {
                select: {
                  icd10Site: true,
                },
              },
            },
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      items,
      meta: buildMeta(total, page, limit),
    };
  },

  async update(
    id: number,
    input: {
      fullName?: string;
      firstName?: string;
      middleName?: string;
      lastName?: string;
      age?: number;
      dateOfBirth?: Date;
      gender?: string;
      healthSchemeBeneficiary?: boolean;
      healthSchemeDetails?: string;
    },
    hospitalId: number,
  ) {
    // Ensure patient exists and belongs to this hospital
    const exists = await prisma.patient.findFirst({
      where: { id, registrations: { some: { hospitalId } } },
      select: { id: true },
    });
    if (!exists) throw httpErrors.notFound(`Patient ${id} not found`);

    // Strip protected fields — these are read-only after creation
    const stripped = { ...input };
    for (const key of PROTECTED_FIELDS) {
      delete (stripped as Record<string, unknown>)[key];
    }

    return prisma.patient.update({
      where: { id },
      data: {
        ...(stripped.healthSchemeBeneficiary !== undefined
          ? { healthSchemeBeneficiary: stripped.healthSchemeBeneficiary }
          : {}),
        ...(stripped.healthSchemeDetails !== undefined
          ? { healthSchemeDetails: stripped.healthSchemeDetails }
          : {}),
      },
    });
  },

  /**
   * Check if a patient has any registrations — used to block side-table
   * mutations (identifications, relatives, addresses) for existing patients.
   */
  async hasRegistrations(patientId: number): Promise<boolean> {
    const count = await prisma.registration.count({ where: { patientId } });
    return count > 0;
  },

  async remove(id: number, hospitalId: number) {
    const exists = await prisma.patient.findFirst({
      where: { id, registrations: { some: { hospitalId } } },
      select: { id: true },
    });
    if (!exists) throw httpErrors.notFound(`Patient ${id} not found`);
    await prisma.patient.delete({ where: { id } });
  },
};

void SIDE_TABLES_INCLUDE;
