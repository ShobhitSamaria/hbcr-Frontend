import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";

export type FollowUpCreateInput = {
  registrationId: number;
  dateOfFollowUp: Date;
  methodOfFollowUp: string;
  methodOfFollowUpOther?: string;
  vitalStatus: string;
  diseaseStatus?: string;
  diseaseStatusOther?: string;
  dateOfFirstRecurrence?: Date;
  treatmentGiven?: boolean;
  treatmentType?: string;
  dateOfDeath?: Date;
  placeOfDeath?: string;
  placeOfDeathOther?: string;
  sourceOfDeathInfo?: string;
  sourceOfDeathInfoOther?: string;
  causeIa?: string;
  causeIb?: string;
  causeIc?: string;
  causeIi?: string;
  icd10Ucod?: string;
  majorCauseGroupUcod?: string;
  formCompletedBy?: string;
  formCompletedByDesignation?: string;
  formCompletedByContact?: string;
  dateOfCompletion?: Date;
  treatments?: {
    modality: string;
    startDate?: Date;
    endDate?: Date;
  }[];
};

/**
 * Follow-up module service. Follow-ups hang off a single HBCR registration
 * (one row per visit, `visitNo` sequenced per registration). The validator
 * has already stripped inapplicable conditional fields, so this layer only
 * persists what it receives — plus the computed next visit number.
 */
export const followUpService = {
  /**
   * Search registrations by Reference Number / HBCR Registration Number /
   * Hospital Registration Number (registration-level) and Aadhaar / Phone
   * Number (patient-level) — any combination, case-insensitive contains.
   * Returns flat patient rows the follow-up records screen can display.
   */
  async searchPatients(query: {
    referenceNo?: string;
    aadhaar?: string;
    phone?: string;
  }, hospitalId: number) {
    const and: Prisma.RegistrationWhereInput[] = [];
    if (query.referenceNo) {
      and.push({ referenceNo: { contains: query.referenceNo, mode: "insensitive" } });
    }
    // Patient-level filters (Aadhaar lives on the identifications side table;
    // phone on the address side tables — same semantics as Patient Records).
    if (query.aadhaar) {
      and.push({
        patient: {
          identifications: {
            some: {
              idType: "AADHAAR",
              number: { contains: query.aadhaar, mode: "insensitive" },
            },
          },
        },
      });
    }
    if (query.phone) {
      and.push({
        patient: {
          addresses: {
            some: { mobileNumber: { contains: query.phone, mode: "insensitive" } },
          },
        },
      });
    }
    // Always scope to the logged-in user's hospital
    and.push({ hospitalId });

    const rows = await prisma.registration.findMany({
      where: { AND: and },
      orderBy: { id: "desc" },
      take: 50,
      include: {
        patient: { select: { id: true, fullName: true, age: true, gender: true } },
        pathologicalDiagnosis: { select: { icd10Site: true } },
        _count: { select: { followUps: true } },
      },
    });

    return rows.map((r) => ({
      registrationId: r.id,
      referenceNo: r.referenceNo,
      patientId: r.patient.id,
      patientName: r.patient.fullName,
      patientAge: r.patient.age,
      patientGender: r.patient.gender,
      icd10Code: r.pathologicalDiagnosis?.icd10Site ?? null,
      visitCount: r._count.followUps,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  /**
   * Everything the records screen needs once a patient is picked: read-only
   * header info, the ICD-10 site code, and every existing visit (ordered by
   * visit number) with its treatment rows.
   */
  async getRegistrationDetail(registrationId: number, hospitalId: number) {
    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        patient: {
          select: {
            id: true, fullName: true, age: true, gender: true,
            firstName: true, middleName: true, lastName: true,
            dateOfBirth: true,
            relatives: true,
            addresses: true,
            habits: true,
            comorbidities: true,
            identifications: true,
          },
        },
        pathologicalDiagnosis: { select: { icd10Site: true } },
        followUps: {
          orderBy: { visitNo: "asc" },
          include: { treatments: { orderBy: { modality: "asc" } } },
        },
      },
    });
    if (!reg) throw httpErrors.notFound(`Registration ${registrationId} not found`);
    if (reg.hospitalId !== hospitalId) throw httpErrors.notFound(`Registration ${registrationId} not found`);
    return {
      registrationId: reg.id,
      hbcrRegistrationNo: reg.hbcrRegistrationNo,
      referenceNo: reg.referenceNo,
      hospitalRegistrationNo: reg.hospitalRegistrationNo,
      patient: reg.patient,
      icd10Code: reg.pathologicalDiagnosis?.icd10Site ?? null,
      visits: reg.followUps,
      nextVisitNo: (reg.followUps[reg.followUps.length - 1]?.visitNo ?? 0) + 1,
    };
  },

  /**
   * Create a follow-up visit. The next `visitNo` is computed inside the same
   * transaction as the insert so two rapid submissions can't double-book the
   * same number (the [registrationId, visitNo] unique index is the final
   * guard). Existing visits are never touched.
   */
  async create(input: FollowUpCreateInput, hospitalId: number) {
    const reg = await prisma.registration.findUnique({
      where: { id: input.registrationId },
      select: { id: true, hospitalId: true },
    });
    if (!reg || reg.hospitalId !== hospitalId) {
      throw httpErrors.notFound(`Registration ${input.registrationId} not found`);
    }

    return prisma.$transaction(async (tx) => {
      const last = await tx.followUp.findFirst({
        where: { registrationId: input.registrationId },
        orderBy: { visitNo: "desc" },
        select: { visitNo: true },
      });
      const visitNo = (last?.visitNo ?? 0) + 1;

      const data: Prisma.FollowUpUncheckedCreateInput = {
        registrationId: input.registrationId,
        visitNo,
        dateOfFollowUp: input.dateOfFollowUp,
        methodOfFollowUp: input.methodOfFollowUp as Prisma.FollowUpUncheckedCreateInput["methodOfFollowUp"],
        ...(input.methodOfFollowUpOther !== undefined ? { methodOfFollowUpOther: input.methodOfFollowUpOther } : {}),
        vitalStatus: input.vitalStatus as Prisma.FollowUpUncheckedCreateInput["vitalStatus"],
        ...(input.diseaseStatus !== undefined
          ? { diseaseStatus: input.diseaseStatus as Prisma.FollowUpUncheckedCreateInput["diseaseStatus"] }
          : {}),
        ...(input.diseaseStatusOther !== undefined ? { diseaseStatusOther: input.diseaseStatusOther } : {}),
        ...(input.dateOfFirstRecurrence !== undefined
          ? { dateOfFirstRecurrence: input.dateOfFirstRecurrence }
          : {}),
        ...(input.treatmentGiven !== undefined ? { treatmentGiven: input.treatmentGiven } : {}),
        ...(input.treatmentType !== undefined
          ? { treatmentType: input.treatmentType as Prisma.FollowUpUncheckedCreateInput["treatmentType"] }
          : {}),
        ...(input.dateOfDeath !== undefined ? { dateOfDeath: input.dateOfDeath } : {}),
        ...(input.placeOfDeath !== undefined
          ? { placeOfDeath: input.placeOfDeath as Prisma.FollowUpUncheckedCreateInput["placeOfDeath"] }
          : {}),
        ...(input.placeOfDeathOther !== undefined ? { placeOfDeathOther: input.placeOfDeathOther } : {}),
        ...(input.sourceOfDeathInfo !== undefined
          ? { sourceOfDeathInfo: input.sourceOfDeathInfo as Prisma.FollowUpUncheckedCreateInput["sourceOfDeathInfo"] }
          : {}),
        ...(input.sourceOfDeathInfoOther !== undefined ? { sourceOfDeathInfoOther: input.sourceOfDeathInfoOther } : {}),
        ...(input.causeIa !== undefined ? { causeIa: input.causeIa } : {}),
        ...(input.causeIb !== undefined ? { causeIb: input.causeIb } : {}),
        ...(input.causeIc !== undefined ? { causeIc: input.causeIc } : {}),
        ...(input.causeIi !== undefined ? { causeIi: input.causeIi } : {}),
        ...(input.icd10Ucod !== undefined ? { icd10Ucod: input.icd10Ucod } : {}),
        ...(input.majorCauseGroupUcod !== undefined
          ? { majorCauseGroupUcod: input.majorCauseGroupUcod }
          : {}),
        ...(input.formCompletedBy !== undefined ? { formCompletedBy: input.formCompletedBy } : {}),
        ...(input.formCompletedByDesignation !== undefined ? { formCompletedByDesignation: input.formCompletedByDesignation } : {}),
        ...(input.formCompletedByContact !== undefined ? { formCompletedByContact: input.formCompletedByContact } : {}),
        ...(input.dateOfCompletion !== undefined ? { dateOfCompletion: input.dateOfCompletion } : {}),
        ...(input.treatments && input.treatments.length > 0
          ? {
              treatments: {
                create: input.treatments.map((t) => ({
                  modality: t.modality as Prisma.FollowUpTreatmentUncheckedCreateInput["modality"],
                  startDate: t.startDate,
                  endDate: t.endDate,
                })),
              },
            }
          : {}),
      };

      return tx.followUp.create({
        data,
        include: { treatments: { orderBy: { modality: "asc" } } },
      });
    });
  },

  /** Single follow-up with its treatment rows (retrieval API). */
  async getById(id: number, hospitalId: number) {
    const followUp = await prisma.followUp.findUnique({
      where: { id },
      include: { treatments: { orderBy: { modality: "asc" } }, registration: { select: { hospitalId: true } } },
    });
    if (!followUp) throw httpErrors.notFound(`Follow-up ${id} not found`);
    if (followUp.registration.hospitalId !== hospitalId) throw httpErrors.notFound(`Follow-up ${id} not found`);
    return followUp;
  },
};
