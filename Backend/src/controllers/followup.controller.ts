import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { followUpService } from "../services/followup.service.ts";
import { created, ok } from "../utils/response.ts";
import { parseIdParam } from "../utils/httpError.ts";
import { searchFollowUpValidator } from "../validators/followup.validator.ts";

export const followUpController = {
  /** GET /api/followups/search?referenceNo=&hbcrRegNo=&hospitalRegNo= */
  searchPatients: asyncHandler(async (req: Request, res: Response) => {
    const query = searchFollowUpValidator(req.query);
    const hospitalId = req.hospitalId!;
    const data = await followUpService.searchPatients(query, hospitalId);
    return ok(res, data);
  }),

  /** GET /api/followups/registrations/:registrationId — header + existing visits. */
  getRegistrationDetail: asyncHandler(async (req: Request, res: Response) => {
    const registrationId = parseIdParam(req.params.registrationId, "registrationId");
    const hospitalId = req.hospitalId!;
    const data = await followUpService.getRegistrationDetail(registrationId, hospitalId);
    return ok(res, data);
  }),

  /** POST /api/followups — body validated by the route middleware. */
  create: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.hospitalId!;
    const data = await followUpService.create(req.body, hospitalId);
    return created(res, data, "Follow-up visit added");
  }),

  /** GET /api/followups/:id */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    const hospitalId = req.hospitalId!;
    const data = await followUpService.getById(id, hospitalId);
    return ok(res, data);
  }),
};
