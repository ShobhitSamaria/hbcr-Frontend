import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import {
  createFamilyHistoryValidator,
  updateFamilyHistoryValidator,
} from "../validators/familyHistory.validator.ts";
import { familyHistoryController } from "../controllers/familyHistory.controller.ts";

export const familyHistoryRouter = Router();

familyHistoryRouter.get(
  "/registrations/:registrationId/family-history",
  familyHistoryController.get,
);
familyHistoryRouter.post(
  "/registrations/:registrationId/family-history",
  validate(createFamilyHistoryValidator),
  familyHistoryController.upsert,
);
familyHistoryRouter.patch(
  "/registrations/:registrationId/family-history",
  validate(updateFamilyHistoryValidator),
  familyHistoryController.upsert,
);
familyHistoryRouter.delete(
  "/registrations/:registrationId/family-history",
  familyHistoryController.remove,
);
