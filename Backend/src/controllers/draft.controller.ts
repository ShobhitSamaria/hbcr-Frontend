import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { draftService } from "../services/draft.service.ts";
import { created, noContent, ok } from "../utils/response.ts";
import { parseIdParam } from "../utils/httpError.ts";

export const draftController = {
  /** GET /api/drafts — list drafts for the logged-in user's hospital. */
  list: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = (req as any).hospitalId as number;
    const search = typeof req.query.q === "string" ? req.query.q : undefined;
    const drafts = await draftService.list(hospitalId, search);
    return ok(res, { items: drafts });
  }),

  /** GET /api/drafts/:id — get a single draft with full formData. */
  get: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = (req as any).hospitalId as number;
    const id = parseIdParam(req.params.id);
    const draft = await draftService.get(id, hospitalId);
    return ok(res, draft);
  }),

  /** POST /api/drafts — create or update a draft. */
  save: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = (req as any).hospitalId as number;
    const userId = (req as any).user?.id as number;
    const { id, formData, currentStep, patientName } = req.body;

    // Validate Aadhaar from formData — must be present for draft save
    const aadhaar = typeof formData?.["a). Aadhaar number"] === "string"
      ? formData["a). Aadhaar number"].trim()
      : "";
    if (!aadhaar) {
      return res.status(422).json({
        success: false,
        error: {
          message: "Aadhaar Number is required for draft",
          status: 422,
          details: [{ field: "a). Aadhaar number", message: "Aadhaar Number is required for draft" }],
        },
      });
    }

    const draft = await draftService.save(hospitalId, userId, {
      id,
      formData,
      currentStep,
      patientName,
    });
    return created(res, draft, "Draft saved");
  }),

  /** DELETE /api/drafts/:id — delete a draft. */
  remove: asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = (req as any).hospitalId as number;
    const id = parseIdParam(req.params.id);
    await draftService.remove(id, hospitalId);
    return noContent(res);
  }),
};
