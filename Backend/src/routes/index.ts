import { Router } from "express";
import { patientRouter } from "./patient.routes.ts";
import { registrationRouter } from "./registration.routes.ts";
import { diagnosticRouter } from "./diagnostic.routes.ts";
import { pathologyRouter } from "./pathology.routes.ts";
import { familyHistoryRouter } from "./familyHistory.routes.ts";
import { treatmentRouter } from "./treatment.routes.ts";
import { followUpRouter } from "./followup.routes.ts";
import { auxRouter } from "./aux.routes.ts";
import { healthRouter } from "./health.routes.ts";
import { authRouter } from "./auth.routes.ts";
import { icdoRouter } from "./icdo.routes.ts";
import { icd10Router } from "./icd10.routes.ts";
import { draftRouter } from "./draft.routes.ts";
import { pincodeRouter } from "./pincode.routes.ts";
import { registrationController } from "../controllers/registration.controller.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

export const apiRouter = Router();

// /api/health* — public (monitoring / liveness probes)
apiRouter.use("/health", healthRouter);

// /api/auth* — login is public; /me protects itself
apiRouter.use("/auth", authRouter);

// /api/registrations/preview-numbers — public, no auth needed (display only)
apiRouter.get(
  "/registrations/preview-numbers/:hospitalId",
  registrationController.previewNumbers,
);

// Everything else requires a valid login token. This guards the dashboard,
// patient, registration and reference-data endpoints against unauthenticated
// access; the UI additionally redirects to /login.
apiRouter.use(requireAuth);

// /api/patients...
apiRouter.use("/patients", patientRouter);

// /api/centres, /api/hospitals, /api/users, /api/dashboard/*
// Mounted last because they have implicit /:id routes they need to win over.
apiRouter.use(auxRouter);

// Everything else uses full paths under root /api
apiRouter.use(registrationRouter);
apiRouter.use(diagnosticRouter);
apiRouter.use(pathologyRouter);
apiRouter.use(familyHistoryRouter);
apiRouter.use(treatmentRouter);

// /api/followups* — active follow-up module (search / visits / create)
apiRouter.use("/followups", followUpRouter);

// /api/drafts* — save draft for incomplete registrations
apiRouter.use(draftRouter);

// /api/icdo/* — read-only ICD-O-3 reference lookups (topography / morphology / index)
apiRouter.use("/icdo", icdoRouter);

// /api/icd10/* — read-only ICD-10 reference lookups (ranges / codes / examples / rules)
apiRouter.use("/icd10", icd10Router);

// /api/pincodes — Rajasthan district ↔ pincode reference data
apiRouter.use("/pincodes", pincodeRouter);
