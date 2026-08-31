import { Router } from "express";
import { authController } from "../controllers/auth.controller.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import { validateLogin } from "../validators/auth.validator.ts";

export const authRouter = Router();

// POST /api/auth/login — public (credentials in Authorization header or body)
authRouter.post("/login", validateLogin, authController.login);

// GET /api/auth/me — validates an existing token and returns the session
authRouter.get("/me", requireAuth, authController.me);

// POST /api/auth/logout — clears the httpOnly auth cookie
authRouter.post("/logout", authController.logout);
