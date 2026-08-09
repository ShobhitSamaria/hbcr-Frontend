import { Router } from "express";
import { healthController } from "../controllers/health.controller.ts";

// Mounted under `/api/health*` (the index router strips /health prefix).
// So the routes below resolve to /api/health, /api/health/live, etc.
export const healthRouter = Router();

healthRouter.get("/", healthController.ping);
healthRouter.get("/live", healthController.liveness);
healthRouter.get("/ready", healthController.readiness);
