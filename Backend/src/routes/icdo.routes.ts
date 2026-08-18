import { Router } from "express";
import { icdoController } from "../controllers/icdo.controller.ts";

// Mounted under /api/icdo* (after requireAuth in the index router).
// Read-only ICD-O-3 reference lookups; nothing here writes to the database.
// Query validation happens inside the controller (see icdo.validator.ts).
export const icdoRouter = Router();

icdoRouter.get("/topography", icdoController.topography);
icdoRouter.get("/morphology", icdoController.morphology);
icdoRouter.get("/index", icdoController.index);
