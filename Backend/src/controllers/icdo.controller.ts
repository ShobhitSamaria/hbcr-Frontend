import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { icdoService } from "../services/icdo.service.ts";
import { ok } from "../utils/response.ts";
import { parseIcdoSearchQuery } from "../validators/icdo.validator.ts";

export const icdoController = {
  topography: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = parseIcdoSearchQuery(req.query);
    const data = await icdoService.searchTopography(q, limit);
    return ok(res, data, { meta: { query: q, count: data.length, limit } });
  }),

  morphology: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = parseIcdoSearchQuery(req.query);
    const data = await icdoService.searchMorphology(q, limit);
    return ok(res, data, { meta: { query: q, count: data.length, limit } });
  }),

  index: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = parseIcdoSearchQuery(req.query);
    const data = await icdoService.searchIndex(q, limit);
    return ok(res, data, { meta: { query: q, count: data.length, limit } });
  }),
};
