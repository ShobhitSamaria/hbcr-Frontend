import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError.ts";

/**
 * Generic validator helper: pass a function that throws on invalid input.
 * Body / query / params are normalised into a single object the validator
 * sees, so the signature is consistent across routes.
 *
 * Example:
 *   router.post("/patients", validate(createPatientValidator), handler)
 */
export function validate<T>(
  validator: (input: T) => T | Promise<T>,
  source: "body" | "query" | "params" = "body",
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const value = await validator(req[source] as T);
      // Replace the original with the cleaned value so handlers see the
      // normalised shape (e.g. trimmed strings, coerced numbers).
      (req as unknown as Record<string, unknown>)[source] = value;
      next();
    } catch (e) {
      if (e instanceof HttpError) return next(e);
      next(
        new HttpError(
          400,
          "Validation failed",
          e instanceof Error ? e.message : "Unknown validation error",
        ),
      );
    }
  };
}
