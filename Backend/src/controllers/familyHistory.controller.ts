import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { familyHistoryService } from "../services/familyHistory.service.ts";
import { created, noContent, ok } from "../utils/response.ts";
import { parseIdParam } from "../utils/httpError.ts";

export const familyHistoryController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await familyHistoryService.get(parseIdParam(req.params.registrationId), req.hospitalId!),
    );
  }),
  upsert: asyncHandler(async (req: Request, res: Response) => {
    const result = await familyHistoryService.upsert(
      parseIdParam(req.params.registrationId),
      req.hospitalId!,
      req.body,
    );
    return created(res, result, "Family history saved");
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await familyHistoryService.remove(parseIdParam(req.params.registrationId), req.hospitalId!);
    return noContent(res);
  }),
};
