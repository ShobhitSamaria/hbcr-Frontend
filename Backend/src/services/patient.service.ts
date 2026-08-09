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
  async create(input: { fullName: string; age?: number; dateOfBirth?: Date; gender: string }) {
    return prisma.patient.create({
      data: {
        fullName: input.fullName,
        age: input.age,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender as P.PatientUncheckedCreateInput["gender"],
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
    const search = typeof query.search === "string" ? query.search.trim() : undefined;
    const gender =
      typeof query.gender === "string" && query.gender ? query.gender : undefined;

    const where: Prisma.PatientWhereInput = {
      AND: [
        search
          ? {
              fullName: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {},
        gender ? { gender: gender as P.PatientWhereInput["gender"] } : {},
      ],
    };

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
    input: { fullName?: string; age?: number; dateOfBirth?: Date; gender?: string },
  ) {
    // Ensure patient exists first (so we can return 404 cleanly)
    const exists = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw httpErrors.notFound(`Patient ${id} not found`);

    return prisma.patient.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.age !== undefined ? { age: input.age } : {}),
        ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth } : {}),
        ...(input.gender !== undefined
          ? { gender: input.gender as P.PatientUncheckedUpdateInput["gender"] }
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
