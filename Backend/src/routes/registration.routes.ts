import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import {
  createRegistrationValidator,
  updateRegistrationValidator,
} from "../validators/registration.validator.ts";
import { registrationController } from "../controllers/registration.controller.ts";

export const registrationRouter = Router();

// Every route uses the FULL path. The router is mounted under `/api` so the
// prefix here is what resolves in the final URL.

// Preview next Reference Number and Registration Number for a hospital
registrationRouter.get(
  "/registrations/preview-numbers/:hospitalId",
  registrationController.previewNumbers,
);

registrationRouter.get("/registrations", registrationController.list);

registrationRouter.get(
  "/patients/:patientId/registrations",
  registrationController.listForPatient,
);
registrationRouter.post(
  "/patients/:patientId/registrations",
  validate(createRegistrationValidator),
  registrationController.create,
);

registrationRouter.get("/registrations/:id", registrationController.getById);
registrationRouter.patch(
  "/registrations/:id",
  validate(updateRegistrationValidator),
  registrationController.update,
);
registrationRouter.delete("/registrations/:id", registrationController.remove);
