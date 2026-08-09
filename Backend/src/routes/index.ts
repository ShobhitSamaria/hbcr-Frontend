import { Router } from "express";
import { patientRouter } from "./patient.routes.ts";
import { registrationRouter } from "./registration.routes.ts";
import { diagnosticRouter } from "./diagnostic.routes.ts";
import { pathologyRouter } from "./pathology.routes.ts";
import { familyHistoryRouter } from "./familyHistory.routes.ts";
import { treatmentRouter } from "./treatment.routes.ts";
import { auxRouter } from "./aux.routes.ts";
import { healthRouter } from "./health.routes.ts";

export const apiRouter = Router();

// /api/health*
apiRouter.use("/health", healthRouter);

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
