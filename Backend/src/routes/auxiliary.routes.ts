import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.ts";
import { prisma } from "../db/prisma.ts";

export const auxRouter = Router();

// Dashboard tiles + charts
auxRouter.get("/dashboard/stats", dashboardController.stats);
auxRouter.get("/dashboard/monthly", dashboardController.monthly);
auxRouter.get("/dashboard/case-overview", dashboardController.caseOverview);
auxRouter.get("/dashboard/recent", dashboardController.recent);

// Centred lookups used by the UI dropdowns / selectors. These aren't
// required by the task but make the API easier to consume from the front-end.
auxRouter.get("/centres", async (_req, res, next) => {
  try {
    res.json({ success: true, data: await prisma.centre.findMany({ orderBy: { id: "asc" } }) });
  } catch (e) {
    next(e);
  }
});

auxRouter.get("/hospitals", async (_req, res, next) => {
  try {
    res.json({
      success: true,
      data: await prisma.hospital.findMany({
        orderBy: { id: "asc" },
        include: { centre: true },
      }),
    });
  } catch (e) {
    next(e);
  }
});

auxRouter.get("/users", async (_req, res, next) => {
  try {
    res.json({ success: true, data: await prisma.user.findMany({ orderBy: { id: "asc" } }) });
  } catch (e) {
    next(e);
  }
});
