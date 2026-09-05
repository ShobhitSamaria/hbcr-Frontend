import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { pathologyService } from "../services/pathology.service.ts";
import { created, noContent, ok } from "../utils/response.ts";
import { parseIdParam } from "../utils/httpError.ts";

export const pathologyController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await pathologyService.get(parseIdParam(req.params.registrationId), req.hospitalId!),
    );
  }),
  upsert: asyncHandler(async (req: Request, res: Response) => {
    const result = await pathologyService.upsert(
      parseIdParam(req.params.registrationId),
      req.hospitalId!,
      req.body,
    );
    return created(res, result, "Pathological diagnosis saved");
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await pathologyService.remove(parseIdParam(req.params.registrationId), req.hospitalId!);
    return noContent(res);
  }),
};
