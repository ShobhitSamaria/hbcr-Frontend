import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import {
  createPatientValidator,
  updatePatientValidator,
} from "../validators/patient.validator.ts";
import { patientController } from "../controllers/patient.controller.ts";
import { SideTablesController } from "./sideTables.routes.ts";

export const patientRouter = Router();

patientRouter.get("/", patientController.list);
patientRouter.post("/", validate(createPatientValidator), patientController.create);
patientRouter.get("/:id", patientController.getById);
patientRouter.patch("/:id", validate(updatePatientValidator), patientController.update);
patientRouter.delete("/:id", patientController.remove);

// /:patientId/side/...
patientRouter.use("/:patientId/side", SideTablesController);
