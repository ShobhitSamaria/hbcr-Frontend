import { prisma } from "../db/prisma.ts";
import { httpErrors } from "../utils/httpError.ts";

/** Extract Aadhaar number from form data for search indexing. */
function extractAadhaar(formData: Record<string, unknown>): string | null {
  // Form state key is "a). Aadhaar number"
  const val = formData["a). Aadhaar number"];
  if (typeof val === "string" && val.trim()) return val.trim();
  return null;
}

export const draftService = {
  /** List all drafts for a hospital, with optional search. */
  async list(hospitalId: number, search?: string) {
    const where: any = { hospitalId };
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { patientName: { contains: q, mode: "insensitive" } },
        { aadhaar: { contains: q, mode: "insensitive" } },
      ];
    }
    return prisma.draft.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        patientName: true,
        aadhaar: true,
        currentStep: true,
        createdAt: true,
        updatedAt: true,
        createdByUser: { select: { fullName: true, initials: true } },
      },
    });
  },

  /** Get a single draft by ID (hospital-scoped). */
  async get(draftId: number, hospitalId: number) {
    const draft = await prisma.draft.findUnique({ where: { id: draftId } });
    if (!draft || draft.hospitalId !== hospitalId) {
      throw httpErrors.notFound("Draft not found");
    }
    return draft;
  },

  /** Create or update a draft. If `id` is provided, update; otherwise create. */
  async save(
    hospitalId: number,
    userId: number,
    input: {
      id?: number;
      formData: Record<string, unknown>;
      currentStep: number;
      patientName?: string;
    },
  ) {
    if (input.id) {
      // Update existing draft — verify ownership
      const existing = await prisma.draft.findUnique({ where: { id: input.id } });
      if (!existing || existing.hospitalId !== hospitalId) {
        throw httpErrors.notFound("Draft not found");
      }
      const aadhaar = extractAadhaar(input.formData);
      return prisma.draft.update({
        where: { id: input.id },
        data: {
          formData: input.formData,
          currentStep: input.currentStep,
          patientName: input.patientName ?? existing.patientName,
          aadhaar,
        },
      });
    }

    // Extract Aadhaar from formData for search indexing
    const aadhaar = extractAadhaar(input.formData);

    // Create new draft
    return prisma.draft.create({
      data: {
        hospitalId,
        createdByUserId: userId,
        formData: input.formData,
        currentStep: input.currentStep,
        patientName: input.patientName,
        aadhaar,
      },
    });
  },

  /** Delete a draft (hospital-scoped). */
  async remove(draftId: number, hospitalId: number) {
    const draft = await prisma.draft.findUnique({ where: { id: draftId } });
    if (!draft || draft.hospitalId !== hospitalId) {
      throw httpErrors.notFound("Draft not found");
    }
    return prisma.draft.delete({ where: { id: draftId } });
  },
};
