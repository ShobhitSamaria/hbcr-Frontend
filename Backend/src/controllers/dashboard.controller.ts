import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { dashboardService } from "../services/dashboard.service.ts";
import { ok } from "../utils/response.ts";

export const dashboardController = {
  stats: asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, await dashboardService.getStats());
  }),
  monthly: asyncHandler(async (req: Request, res: Response) => {
    const months = Number(req.query.months) || 6;
    return ok(res, await dashboardService.getMonthlyRegistrations(months));
  }),
  caseOverview: asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, await dashboardService.getCaseOverview());
  }),
  recent: asyncHandler(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5;
    return ok(res, await dashboardService.getRecent(limit));
  }),
};
