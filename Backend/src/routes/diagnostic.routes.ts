import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import {
  createDiagnosticMethodValidator,
  createDiagnosticProcedureValidator,
  updateDiagnosticMethodValidator,
  updateDiagnosticProcedureValidator,
} from "../validators/diagnostic.validator.ts";
import { diagnosticController } from "../controllers/diagnostic.controller.ts";

export const diagnosticRouter = Router();

// Methods by registration
diagnosticRouter.get(
  "/registrations/:registrationId/diagnostic-methods",
  diagnosticController.listMethods,
);
diagnosticRouter.post(
  "/registrations/:registrationId/diagnostic-methods",
  validate(createDiagnosticMethodValidator),
  diagnosticController.createMethod,
);

// Method by id (and procedures inside it)
diagnosticRouter.get("/diagnostic-methods/:methodId", diagnosticController.getMethod);
diagnosticRouter.patch(
  "/diagnostic-methods/:methodId",
  validate(updateDiagnosticMethodValidator),
  diagnosticController.updateMethod,
);
diagnosticRouter.delete("/diagnostic-methods/:methodId", diagnosticController.deleteMethod);

diagnosticRouter.get(
  "/diagnostic-methods/:methodId/procedures",
  diagnosticController.listProcedures,
);
diagnosticRouter.post(
  "/diagnostic-methods/:methodId/procedures",
  validate(createDiagnosticProcedureValidator),
  diagnosticController.createProcedure,
);

diagnosticRouter.patch(
  "/diagnostic-procedures/:procedureId",
  validate(updateDiagnosticProcedureValidator),
  diagnosticController.updateProcedure,
);
diagnosticRouter.delete(
  "/diagnostic-procedures/:procedureId",
  diagnosticController.deleteProcedure,
);
