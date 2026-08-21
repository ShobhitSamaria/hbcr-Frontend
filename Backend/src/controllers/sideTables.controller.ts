import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { sideTablesService } from "../services/sideTables.service.ts";
import { created, noContent, ok } from "../utils/response.ts";
import { httpErrors, parseIdParam } from "../utils/httpError.ts";
import { patientService } from "../services/patient.service.ts";

function pid(req: Request) {
  return parseIdParam(req.params.patientId);
}

function childId(req: Request) {
  return parseIdParam(req.params.id);
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
      return ok(
        res,
        await sideTablesService.listIdentifiers(pid(req)),
      );
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      await assertWritable(pid(req), "identifiers");
      return created(
        res,
        await sideTablesService.createIdentifier(pid(req), req.body),
      );
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      await assertWritable(pid(req), "identifiers");
      return ok(
        res,
        await sideTablesService.updateIdentifier(pid(req), childId(req), req.body),
        "Identification updated",
      );
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await assertWritable(pid(req), "identifiers");
      await sideTablesService.deleteIdentifier(pid(req), childId(req));
      return noContent(res);
    }),
  },

  relatives: {
    list: asyncHandler(async (req: Request, res: Response) => {
      return ok(res, await sideTablesService.listRelatives(pid(req)));
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      await assertWritable(pid(req), "relatives");
      return created(res, await sideTablesService.createRelative(pid(req), req.body));
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      await assertWritable(pid(req), "relatives");
      return ok(
        res,
        await sideTablesService.updateRelative(pid(req), childId(req), req.body),
        "Relative updated",
      );
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await assertWritable(pid(req), "relatives");
      await sideTablesService.deleteRelative(pid(req), childId(req));
      return noContent(res);
    }),
  },

  addresses: {
    list: asyncHandler(async (req: Request, res: Response) => {
      return ok(res, await sideTablesService.listAddresses(pid(req)));
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      await assertWritable(pid(req), "addresses");
      return created(res, await sideTablesService.createAddress(pid(req), req.body));
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      await assertWritable(pid(req), "addresses");
      return ok(
        res,
        await sideTablesService.updateAddress(pid(req), childId(req), req.body),
        "Address updated",
      );
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await assertWritable(pid(req), "addresses");
      await sideTablesService.deleteAddress(pid(req), childId(req));
      return noContent(res);
    }),
  },

  habits: {
    list: asyncHandler(async (req: Request, res: Response) => {
      return ok(res, await sideTablesService.listHabits(pid(req)));
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      return created(res, await sideTablesService.createHabit(pid(req), req.body));
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      return ok(
        res,
        await sideTablesService.updateHabit(pid(req), childId(req), req.body),
        "Habit updated",
      );
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await sideTablesService.deleteHabit(pid(req), childId(req));
      return noContent(res);
    }),
  },

  comorbidities: {
    list: asyncHandler(async (req: Request, res: Response) => {
      return ok(res, await sideTablesService.listComorbidities(pid(req)));
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      return created(res, await sideTablesService.createComorbidity(pid(req), req.body));
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
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
      await sideTablesService.deleteComorbidity(pid(req), childId(req));
      return noContent(res);
    }),
  },
};

export const sideTablesController = wrap;
