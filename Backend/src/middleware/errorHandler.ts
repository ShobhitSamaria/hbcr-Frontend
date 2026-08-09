import { Prisma } from "../../generated/prisma/client.ts";
import { httpErrors, HttpError } from "../utils/httpError.ts";
import { fail } from "../utils/response.ts";
import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  return fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  // Our own typed HTTP errors win
  if (err instanceof HttpError) {
    return fail(res, err.status, err.message, err.details);
  }

  // Prisma known request errors (record not found, unique conflict, FK violation, ...)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[]) ?? [];
      return fail(
        res,
        409,
        `Unique constraint failed on: ${target.join(", ") || "unknown field"}`,
        { code: err.code, target },
      );
    }
    if (err.code === "P2025") {
      return fail(res, 404, "Record not found", { code: err.code });
    }
    if (err.code === "P2003") {
      const field = (err.meta?.field_name as string) ?? "unknown";
      return fail(
        res,
        409,
        `Foreign key constraint failed on: ${field}`,
        { code: err.code, field },
      );
    }
    return fail(res, 400, `Database error: ${err.message}`, { code: err.code });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return fail(res, 400, `Invalid query input: ${err.message}`);
  }

  // Unknown -> log and surface a generic 500
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  const fallback = httpErrors.internal(
    err instanceof Error ? err.message : "Internal server error",
  );
  return fail(res, fallback.status, fallback.message);
}
