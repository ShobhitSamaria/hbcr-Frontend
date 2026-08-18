import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import { followUpController } from "../controllers/followup.controller.ts";
import { createFollowUpValidator } from "../validators/followup.validator.ts";

// Mounted under /api/followups* (after requireAuth in the index router).
// Search + retrieval are GET; creating a visit is a single POST that never
// touches existing visits.
export const followUpRouter = Router();

followUpRouter.get("/search", followUpController.searchPatients);
followUpRouter.get("/registrations/:registrationId", followUpController.getRegistrationDetail);
followUpRouter.post("/", validate(createFollowUpValidator), followUpController.create);
followUpRouter.get("/:id", followUpController.getById);
