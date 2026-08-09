import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { patientService } from "../services/patient.service.ts";
import { created, noContent, ok } from "../utils/response.ts";
import { parseIdParam } from "../utils/httpError.ts";

export const patientController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const created_ = await patientService.create(req.body);
    return created(res, created_, "Patient created");
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await patientService.list(req.query as Record<string, unknown>);
    return ok(res, { items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    const patient = await patientService.getById(id);
    return ok(res, patient);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    const updated = await patientService.update(id, req.body);
    return ok(res, updated, "Patient updated");
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    await patientService.remove(id);
    return noContent(res);
  }),
};
