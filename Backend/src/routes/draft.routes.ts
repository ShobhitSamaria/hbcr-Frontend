import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import { saveDraftValidator } from "../validators/draft.validator.ts";
import { draftController } from "../controllers/draft.controller.ts";

export const draftRouter = Router();

draftRouter.get("/drafts", draftController.list);
draftRouter.get("/drafts/:id", draftController.get);
draftRouter.post("/drafts", validate(saveDraftValidator), draftController.save);
draftRouter.delete("/drafts/:id", draftController.remove);
