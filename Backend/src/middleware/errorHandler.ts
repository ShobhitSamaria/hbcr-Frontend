import { Prisma } from "../../generated/prisma/client.ts";
import { httpErrors, HttpError } from "../utils/httpError.ts";
import { fail } from "../utils/response.ts";
import { config } from "../config/index.js";
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
      const raw = err.meta?.target;
      const target: string[] = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
      // Prisma constraint names follow: <table>_<field>_key — extract the field.
      const fields = target.map((t) => t.replace(/^\w+_/, "").replace(/_key$/, ""));
      const label = fields.length ? fields.join(", ") : "unknown field";

      // Provide a user-friendly message based on the field
      let userMessage = `A record with this value already exists (${label}).`;
      if (fields.some((f) => f.includes("registration_no"))) {
        userMessage = "A registration with this number already exists. Please try again.";
      } else if (fields.some((f) => f.includes("aadhaar"))) {
        userMessage = "A patient with this Aadhaar number already exists.";
      } else if (fields.some((f) => f.includes("username"))) {
        userMessage = "This username is already taken.";
      }

      return fail(res, 409, userMessage, {
        code: err.code,
        target: fields,
        constraint: target,
      });
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
    if (err.code === "P2004") {
      // Database constraint violation (CHECK, etc.)
      const msg = String(err.message || err.meta?.constraint || "");
      let userMessage = "The submitted data does not meet the required format.";
      if (msg.includes("hbcr_reg_no_format")) {
        userMessage = "Registration Number format is invalid.";
      } else if (msg.includes("referral_subfields")) {
        userMessage = "When referral type is 'Other Hospital', facility name and city are required.";
      } else if (msg.includes("fam_history_subfields")) {
        userMessage = "When family history is 'Yes', relationship and degree are required.";
      } else if (msg.includes("habit_duration")) {
        userMessage = "When habit answer is 'Yes', duration in months is required.";
      } else if (msg.includes("comorb_duration")) {
        userMessage = "When comorbidity answer is 'Yes', duration in months is required.";
      } else if (msg.includes("pin_format")) {
        userMessage = "Pin code must be a valid 6-digit Indian PIN code.";
      } else if (msg.includes("mobile_format")) {
        userMessage = "Mobile number must be a valid 10-digit Indian number starting with 6-9.";
      } else if (msg.includes("email_format")) {
        userMessage = "Email address format is invalid.";
      }
      return fail(res, 400, userMessage, { code: err.code, constraint: err.meta?.constraint });
    }
    return fail(res, 400, `Database error: ${err.message}`, { code: err.code });
  }

  // Handle raw PostgreSQL errors (e.g. CHECK constraint violations)
  if (err && typeof err === "object" && "code" in err) {
    const pgErr = err as { code: string; detail?: string; message?: string };
    if (pgErr.code === "23514") {
      // CHECK constraint violation — extract useful info from the message
      const msg = pgErr.message || "Validation failed";
      let userMessage = "The submitted data does not meet the required format.";
      if (msg.includes("hbcr_reg_no_format")) {
        userMessage = "Registration Number format is invalid.";
      } else if (msg.includes("referral_subfields")) {
        userMessage = "When referral type is 'Other Hospital', facility name and city are required.";
      } else if (msg.includes("fam_history_subfields")) {
        userMessage = "When family history is 'Yes', relationship and degree are required.";
      } else if (msg.includes("habit_duration")) {
        userMessage = "When habit answer is 'Yes', duration in months is required.";
      } else if (msg.includes("comorb_duration")) {
        userMessage = "When comorbidity answer is 'Yes', duration in months is required.";
      } else if (msg.includes("pin_format")) {
        userMessage = "Pin code must be a valid 6-digit Indian PIN code.";
      } else if (msg.includes("mobile_format")) {
        userMessage = "Mobile number must be a valid 10-digit Indian number starting with 6-9.";
      } else if (msg.includes("email_format")) {
        userMessage = "Email address format is invalid.";
      }
      return fail(res, 400, userMessage, { code: pgErr.code, detail: pgErr.detail });
    }
    if (pgErr.code === "23505") {
      // Unique constraint violation from raw SQL
      return fail(res, 409, "A record with this value already exists.", { code: pgErr.code, detail: pgErr.detail });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return fail(res, 400, `Invalid query input: ${err.message}`);
  }

  // Unknown -> log and surface a generic 500. In production the real error
  // message is never returned to the client (it can leak internals / data),
  // it is only written to the server log above.
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  const fallback = httpErrors.internal(
    config.nodeEnv === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Internal server error",
  );
  return fail(res, fallback.status, fallback.message);
}
