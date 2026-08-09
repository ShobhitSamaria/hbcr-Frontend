import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import {
  createPathologyValidator,
  updatePathologyValidator,
} from "../validators/pathology.validator.ts";
import { pathologyController } from "../controllers/pathology.controller.ts";

export const pathologyRouter = Router();

// Single record per registration
pathologyRouter.get(
  "/registrations/:registrationId/pathological-diagnosis",
  pathologyController.get,
);
pathologyRouter.post(
  "/registrations/:registrationId/pathological-diagnosis",
  // POST works like PUT - the service always upserts.
  validate(createPathologyValidator),
  pathologyController.upsert,
);
pathologyRouter.patch(
  "/registrations/:registrationId/pathological-diagnosis",
  validate(updatePathologyValidator),
  pathologyController.upsert,
);
pathologyRouter.delete(
  "/registrations/:registrationId/pathological-diagnosis",
  pathologyController.remove,
);
