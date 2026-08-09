import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { registrationService } from "../services/registration.service.ts";
import { created, noContent, ok } from "../utils/response.ts";
import { parseIdParam } from "../utils/httpError.ts";

export const registrationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await registrationService.list(
      req.query as Record<string, unknown>,
    );
    return ok(res, items, { meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await registrationService.getById(parseIdParam(req.params.id)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    return created(
      res,
      await registrationService.create(parseIdParam(req.params.patientId), req.body),
      "Registration created",
    );
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await registrationService.update(parseIdParam(req.params.id), req.body),
      "Registration updated",
    );
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await registrationService.remove(parseIdParam(req.params.id));
    return noContent(res);
  }),

  listForPatient: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await registrationService.listForPatient(parseIdParam(req.params.patientId)),
    );
  }),
};
