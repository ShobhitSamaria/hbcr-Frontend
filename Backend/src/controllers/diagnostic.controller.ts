import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { diagnosticService } from "../services/diagnostic.service.ts";
import { created, noContent, ok } from "../utils/response.ts";
import { parseIdParam } from "../utils/httpError.ts";

export const diagnosticController = {
  listMethods: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await diagnosticService.listMethods(parseIdParam(req.params.registrationId)),
    );
  }),

  /**
   * Validate that at least one diagnostic method exists for a registration.
   * Called by the frontend after all methods have been submitted.
   */
  validateMethods: asyncHandler(async (req: Request, res: Response) => {
    await diagnosticService.validateMethodsExist(parseIdParam(req.params.registrationId));
    return ok(res, { valid: true }, "Diagnostic methods validated");
  }),

  createMethod: asyncHandler(async (req: Request, res: Response) => {
    return created(
      res,
      await diagnosticService.createMethod(
        parseIdParam(req.params.registrationId),
        req.body,
      ),
    );
  }),

  getMethod: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await diagnosticService.getMethod(parseIdParam(req.params.methodId)));
  }),

  updateMethod: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await diagnosticService.updateMethod(
        parseIdParam(req.params.methodId),
        req.body as { clinicalOnlyDate?: Date | null },
      ),
      "Diagnostic method updated",
    );
  }),

  deleteMethod: asyncHandler(async (req: Request, res: Response) => {
    await diagnosticService.deleteMethod(parseIdParam(req.params.methodId));
    return noContent(res);
  }),

  listProcedures: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await diagnosticService.listProcedures(parseIdParam(req.params.methodId)),
    );
  }),

  createProcedure: asyncHandler(async (req: Request, res: Response) => {
    return created(
      res,
      await diagnosticService.createProcedure(
        parseIdParam(req.params.methodId),
        req.body,
      ),
    );
  }),

  updateProcedure: asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      await diagnosticService.updateProcedure(
        parseIdParam(req.params.procedureId),
        req.body,
      ),
      "Procedure updated",
    );
  }),

  deleteProcedure: asyncHandler(async (req: Request, res: Response) => {
    await diagnosticService.deleteProcedure(parseIdParam(req.params.procedureId));
    return noContent(res);
  }),
};
