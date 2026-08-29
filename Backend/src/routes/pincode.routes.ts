import { Router } from "express";
import { listPincodes } from "../controllers/pincode.controller.ts";

export const pincodeRouter = Router();

pincodeRouter.get("/", listPincodes);
