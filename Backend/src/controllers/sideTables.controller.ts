import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { sideTablesService } from "../services/sideTables.service.ts";
import { created, noContent, ok } from "../utils/response.ts";
import { httpErrors, parseIdParam } from "../utils/httpError.ts";
import { patientService } from "../services/patient.service.ts";
import { validatePincodeDistrict } from "../services/pincode.service.ts";
import { requirePatientInHospital } from "../services/accessGuard.ts";

function pid(req: Request) {
  return parseIdParam(req.params.patientId);
}

function childId(req: Request) {
  return parseIdParam(req.params.id);
}

/**
 * Hospital scoping: every side-table request must target a patient the
 * caller's hospital owns (a patient with ≥ 1 registration in this hospital)
 * or a fresh patient (no registrations yet) that the hospital is currently
 * registering. Without this, any authenticated hospital could read or write
 * the Aadhaar / ABHA / address / relative data of another hospital's patients
 * by enumerating sequential patient ids.
 */
async function assertAccess(req: Request) {
  await requirePatientInHospital(pid(req), req.hospitalId!);
}

/**
 * Protected side tables that cannot be modified once a patient has
 * existing registrations: identifications, relatives, addresses.
 * Habits and comorbidities remain editable.
 */
const PROTECTED_TABLES = new Set(["identifiers", "relatives", "addresses"]);

async function assertWritable(patientId: number, table: string) {
  if (PROTECTED_TABLES.has(table)) {
    const hasRegs = await patientService.hasRegistrations(patientId);
    if (hasRegs) {
      throw httpErrors.badRequest(
        `Cannot modify ${table} — patient already has registrations.`,
      );
    }
  }
}

const wrap = {
  identifiers: {
    list: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      return ok(
        res,
        await sideTablesService.listIdentifiers(pid(req)),
      );
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await assertWritable(pid(req), "identifiers");
      return created(
        res,
        await sideTablesService.createIdentifier(pid(req), req.body),
      );
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await assertWritable(pid(req), "identifiers");
      return ok(
        res,
        await sideTablesService.updateIdentifier(pid(req), childId(req), req.body),
        "Identification updated",
      );
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await assertWritable(pid(req), "identifiers");
      await sideTablesService.deleteIdentifier(pid(req), childId(req));
      return noContent(res);
    }),
  },

  relatives: {
    list: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      return ok(res, await sideTablesService.listRelatives(pid(req)));
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await assertWritable(pid(req), "relatives");
      return created(res, await sideTablesService.createRelative(pid(req), req.body));
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await assertWritable(pid(req), "relatives");
      return ok(
        res,
        await sideTablesService.updateRelative(pid(req), childId(req), req.body),
        "Relative updated",
      );
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await assertWritable(pid(req), "relatives");
      await sideTablesService.deleteRelative(pid(req), childId(req));
      return noContent(res);
    }),
  },

  addresses: {
    list: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      return ok(res, await sideTablesService.listAddresses(pid(req)));
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await assertWritable(pid(req), "addresses");
      const { district, pinCode } = req.body as Record<string, unknown>;
      if (district && pinCode) {
        const valid = await validatePincodeDistrict(String(pinCode), String(district));
        if (!valid) {
          return res.status(422).json({
            success: false,
            error: {
              message: `PIN Code ${pinCode} does not belong to District ${district}`,
              status: 422,
            },
          });
        }
      }
      return created(res, await sideTablesService.createAddress(pid(req), req.body));
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await assertWritable(pid(req), "addresses");
      const { district, pinCode } = req.body as Record<string, unknown>;
      if (district && pinCode) {
        const valid = await validatePincodeDistrict(String(pinCode), String(district));
        if (!valid) {
          return res.status(422).json({
            success: false,
            error: {
              message: `PIN Code ${pinCode} does not belong to District ${district}`,
              status: 422,
            },
          });
        }
      }
      return ok(
        res,
        await sideTablesService.updateAddress(pid(req), childId(req), req.body),
        "Address updated",
      );
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await assertWritable(pid(req), "addresses");
      await sideTablesService.deleteAddress(pid(req), childId(req));
      return noContent(res);
    }),
  },

  habits: {
    list: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      return ok(res, await sideTablesService.listHabits(pid(req)));
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      return created(res, await sideTablesService.createHabit(pid(req), req.body));
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      return ok(
        res,
        await sideTablesService.updateHabit(pid(req), childId(req), req.body),
        "Habit updated",
      );
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await sideTablesService.deleteHabit(pid(req), childId(req));
      return noContent(res);
    }),
  },

  comorbidities: {
    list: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      return ok(res, await sideTablesService.listComorbidities(pid(req)));
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      return created(res, await sideTablesService.createComorbidity(pid(req), req.body));
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      return ok(
        res,
        await sideTablesService.updateComorbidity(
          pid(req),
          childId(req),
          req.body,
        ),
        "Comorbidity updated",
      );
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await assertAccess(req);
      await sideTablesService.deleteComorbidity(pid(req), childId(req));
      return noContent(res);
    }),
  },
};

export const sideTablesController = wrap;
