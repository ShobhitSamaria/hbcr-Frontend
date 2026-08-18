import { Router } from "express";
import { authController } from "../controllers/auth.controller.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import { validate } from "../middleware/validate.ts";
import { validateLogin } from "../validators/auth.validator.ts";

export const authRouter = Router();

// POST /api/auth/login — public
authRouter.post("/login", validate(validateLogin), authController.login);

// GET /api/auth/me — validates an existing token and returns the session
authRouter.get("/me", requireAuth, authController.me);
