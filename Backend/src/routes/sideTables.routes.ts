import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import {
  createPatientIdentificationValidator,
  updatePatientIdentificationValidator,
} from "../validators/patientId.validator.ts";
import {
  createAddressValidator,
  updateAddressValidator,
} from "../validators/address.validator.ts";
import {
  createRelativeValidator,
  updateRelativeValidator,
} from "../validators/relative.validator.ts";
import {
  createHabitValidator,
  updateHabitValidator,
} from "../validators/habit.validator.ts";
import {
  createComorbidityValidator,
  updateComorbidityValidator,
} from "../validators/comorbidity.validator.ts";
import { sideTablesController } from "../controllers/sideTables.controller.ts";

export const SideTablesController = Router({ mergeParams: true });

// Identifications   /:patientId/side/identifications
SideTablesController.get("/identifications", sideTablesController.identifiers.list);
SideTablesController.post(
  "/identifications",
  validate(createPatientIdentificationValidator),
  sideTablesController.identifiers.create,
);
SideTablesController.patch(
  "/identifications/:id",
  validate(updatePatientIdentificationValidator),
  sideTablesController.identifiers.update,
);
SideTablesController.delete(
  "/identifications/:id",
  sideTablesController.identifiers.remove,
);

// Relatives
SideTablesController.get("/relatives", sideTablesController.relatives.list);
SideTablesController.post(
  "/relatives",
  validate(createRelativeValidator),
  sideTablesController.relatives.create,
);
SideTablesController.patch(
  "/relatives/:id",
  validate(updateRelativeValidator),
  sideTablesController.relatives.update,
);
SideTablesController.delete(
  "/relatives/:id",
  sideTablesController.relatives.remove,
);

// Addresses
SideTablesController.get("/addresses", sideTablesController.addresses.list);
SideTablesController.post(
  "/addresses",
  validate(createAddressValidator),
  sideTablesController.addresses.create,
);
SideTablesController.patch(
  "/addresses/:id",
  validate(updateAddressValidator),
  sideTablesController.addresses.update,
);
SideTablesController.delete(
  "/addresses/:id",
  sideTablesController.addresses.remove,
);

// Habits
SideTablesController.get("/habits", sideTablesController.habits.list);
SideTablesController.post(
  "/habits",
  validate(createHabitValidator),
  sideTablesController.habits.create,
);
SideTablesController.patch(
  "/habits/:id",
  validate(updateHabitValidator),
  sideTablesController.habits.update,
);
SideTablesController.delete(
  "/habits/:id",
  sideTablesController.habits.remove,
);

// Comorbidities
SideTablesController.get("/comorbidities", sideTablesController.comorbidities.list);
SideTablesController.post(
  "/comorbidities",
  validate(createComorbidityValidator),
  sideTablesController.comorbidities.create,
);
SideTablesController.patch(
  "/comorbidities/:id",
  validate(updateComorbidityValidator),
  sideTablesController.comorbidities.update,
);
SideTablesController.delete(
  "/comorbidities/:id",
  sideTablesController.comorbidities.remove,
);
