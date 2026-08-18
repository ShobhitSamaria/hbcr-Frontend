import { Router } from "express";
import { icd10Controller } from "../controllers/icd10.controller.ts";

// Mounted under /api/icd10* (after requireAuth in the index router).
// Read-only ICD-10 reference lookups (ranges, codes from examples, examples,
// rules) backed by the workbook-derived tables; nothing here writes to the
// database. Query validation happens inside the controller.
export const icd10Router = Router();

icd10Router.get("/search", icd10Controller.search);

// ICD-O-3 Topography → ICD-10 suggestion for field 24 (23.1 selection).
icd10Router.get("/map-topography", icd10Controller.mapTopography);
