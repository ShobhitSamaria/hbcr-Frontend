import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { treatmentService } from "../services/treatment.service.ts";
import { created, noContent, ok } from "../utils/response.ts";
import { parseIdParam } from "../utils/httpError.ts";

export const treatmentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await treatmentService.listByRegistration(
        parseIdParam(req.params.registrationId),
      ),
    );
  }),
  upsert: asyncHandler(async (req: Request, res: Response) => {
    const result = await treatmentService.upsert(
      parseIdParam(req.params.registrationId),
      req.body,
    );
    return created(res, result, "Treatment saved");
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await treatmentService.get(parseIdParam(req.params.treatmentId)),
    );
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await treatmentService.update(
        parseIdParam(req.params.treatmentId),
        req.body,
      ),
      "Treatment updated",
    );
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await treatmentService.remove(parseIdParam(req.params.treatmentId));
    return noContent(res);
  }),

  // modalities
  listModalities: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await treatmentService.listModalities(parseIdParam(req.params.treatmentId)),
    );
  }),
  upsertModality: asyncHandler(async (req: Request, res: Response) => {
    const result = await treatmentService.upsertModality(
      parseIdParam(req.params.treatmentId),
      req.body,
    );
    return created(res, result, "Modality saved");
  }),
  updateModality: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await treatmentService.updateModality(
        parseIdParam(req.params.modalityId),
        req.body,
      ),
      "Modality updated",
    );
  }),
  deleteModality: asyncHandler(async (req: Request, res: Response) => {
    await treatmentService.deleteModality(parseIdParam(req.params.modalityId));
    return noContent(res);
  }),
};
