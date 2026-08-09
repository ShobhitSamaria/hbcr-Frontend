import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import {
  createTreatmentModalityValidator,
  createTreatmentValidator,
  updateTreatmentModalityValidator,
  updateTreatmentValidator,
} from "../validators/treatment.validator.ts";
import { treatmentController } from "../controllers/treatment.controller.ts";

export const treatmentRouter = Router();

// Treatments per registration
treatmentRouter.get(
  "/registrations/:registrationId/treatments",
  treatmentController.list,
);
treatmentRouter.post(
  "/registrations/:registrationId/treatments",
  validate(createTreatmentValidator),
  treatmentController.upsert,
);

// Top-level treatment by id
treatmentRouter.get("/treatments/:treatmentId", treatmentController.get);
treatmentRouter.patch(
  "/treatments/:treatmentId",
  validate(updateTreatmentValidator),
  treatmentController.update,
);
treatmentRouter.delete("/treatments/:treatmentId", treatmentController.remove);

// Modalities
treatmentRouter.get(
  "/treatments/:treatmentId/modalities",
  treatmentController.listModalities,
);
treatmentRouter.post(
  "/treatments/:treatmentId/modalities",
  validate(createTreatmentModalityValidator),
  treatmentController.upsertModality,
);
treatmentRouter.patch(
  "/treatment-modalities/:modalityId",
  validate(updateTreatmentModalityValidator),
  treatmentController.updateModality,
);
treatmentRouter.delete(
  "/treatment-modalities/:modalityId",
  treatmentController.deleteModality,
);
