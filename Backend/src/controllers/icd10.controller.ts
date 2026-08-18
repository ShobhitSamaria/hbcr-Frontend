import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { icd10Service } from "../services/icd10.service.ts";
import { ok } from "../utils/response.ts";
import { parseIcdo10MapTopographyQuery, parseIcdo10SearchQuery } from "../validators/icd10.validator.ts";

export const icd10Controller = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const { q, types, limit } = parseIcdo10SearchQuery(req.query);
    const data = await icd10Service.search(q, types, limit);
    return ok(res, data, {
      meta: { query: q, types: types.length > 0 ? types : ["range", "code", "example", "rule"], count: data.length, limit },
    });
  }),

  /** GET /api/icd10/map-topography?code=C30.0 → ICD-10 suggestion for the
   *  selected ICD-O-3 topography code, or `null` when no reliable mapping
   *  exists (data: null, 200 — not an error). */
  mapTopography: asyncHandler(async (req: Request, res: Response) => {
    const { code } = parseIcdo10MapTopographyQuery(req.query);
    const data = await icd10Service.mapTopography(code);
    return ok(res, data, {
      meta: { code, found: data !== null },
    });
  }),
};
