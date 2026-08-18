import type { Prisma } from "../../generated/prisma/client.ts";
import { Prisma as P } from "../../generated/prisma/client.ts";
import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";
import { buildMeta, parsePagination } from "../utils/pagination.ts";

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

  async getById(id: number) {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: SIDE_TABLES_INCLUDE,
    });
    if (!patient) throw httpErrors.notFound(`Patient ${id} not found`);
    return patient;
  },

  async list(query: Record<string, unknown>) {
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

    const where: Prisma.PatientWhereInput = and.length > 0 ? { AND: and } : {};

    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { id: "desc" },
        include: {
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
  ) {
    // Ensure patient exists first (so we can return 404 cleanly)
    const exists = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw httpErrors.notFound(`Patient ${id} not found`);

    return prisma.patient.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.middleName !== undefined ? { middleName: input.middleName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.age !== undefined ? { age: input.age } : {}),
        ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth } : {}),
        ...(input.gender !== undefined
          ? { gender: input.gender as P.PatientUncheckedUpdateInput["gender"] }
          : {}),
        ...(input.healthSchemeBeneficiary !== undefined
          ? { healthSchemeBeneficiary: input.healthSchemeBeneficiary }
          : {}),
        ...(input.healthSchemeDetails !== undefined
          ? { healthSchemeDetails: input.healthSchemeDetails }
          : {}),
      },
    });
  },

  async remove(id: number) {
    const exists = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw httpErrors.notFound(`Patient ${id} not found`);
    await prisma.patient.delete({ where: { id } });
  },
};

void SIDE_TABLES_INCLUDE;
