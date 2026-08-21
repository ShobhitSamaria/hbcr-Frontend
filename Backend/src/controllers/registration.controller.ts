import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { registrationService } from "../services/registration.service.ts";
import { sequenceService } from "../services/sequence.service.ts";
import { prisma } from "../db/prisma.ts";
import { created, noContent, ok, fail } from "../utils/response.ts";
import { parseIdParam, httpErrors } from "../utils/httpError.ts";

export const registrationController = {
  /**
   * GET /api/registrations/preview-numbers/:hospitalId
   * Preview the next Reference Number and Registration Number for a hospital
   * without incrementing the sequence. For display purposes only.
   */
  previewNumbers: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = parseIdParam(req.params.hospitalId);
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { id: true, name: true, centre: { select: { code: true } } },
    });
    if (!hospital) throw httpErrors.notFound(`Hospital ${hospitalId} not found`);
    if (!hospital.centre?.code) throw httpErrors.badRequest(`Hospital ${hospitalId} does not have a centre code configured`);

    // Centre code is used as the prefix for Reference Number generation.
    const centreCode = hospital.centre.code;
    const numbers = await sequenceService.previewNumbers(hospitalId, centreCode);
    return ok(res, {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      centreCode,
      referenceNo: numbers.referenceNo,
      registrationNo: numbers.registrationNo,
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.hospitalId!;
    const { items, meta } = await registrationService.list(
      req.query as Record<string, unknown>,
      hospitalId,
    );
    return ok(res, items, { meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.hospitalId!;
    return ok(res, await registrationService.getById(parseIdParam(req.params.id), hospitalId));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.hospitalId!;
    return created(
      res,
      await registrationService.create(parseIdParam(req.params.patientId), req.body, hospitalId),
      "Registration created",
    );
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.hospitalId!;
    return ok(
      res,
      await registrationService.update(parseIdParam(req.params.id), req.body, hospitalId),
      "Registration updated",
    );
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.hospitalId!;
    await registrationService.remove(parseIdParam(req.params.id), hospitalId);
    return noContent(res);
  }),

  listForPatient: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.hospitalId!;
    return ok(
      res,
      await registrationService.listForPatient(parseIdParam(req.params.patientId), hospitalId),
    );
  }),
};
