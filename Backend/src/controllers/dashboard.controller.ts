import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { dashboardService } from "../services/dashboard.service.ts";
import { ok } from "../utils/response.ts";

export const dashboardController = {
  stats: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await dashboardService.getStats(req.hospitalId!));
  }),
  monthly: asyncHandler(async (req: Request, res: Response) => {
    const months = Number(req.query.months) || 6;
    return ok(res, await dashboardService.getMonthlyRegistrations(req.hospitalId!, months));
  }),
  caseOverview: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await dashboardService.getCaseOverview(req.hospitalId!));
  }),
  recent: asyncHandler(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5;
    return ok(res, await dashboardService.getRecent(req.hospitalId!, limit));
  }),
};
