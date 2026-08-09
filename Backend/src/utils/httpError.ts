/**
 * Thrown anywhere a controller or service wants to short-circuit with an HTTP
 * error code + a safe message. The error middleware converts this into a
 * proper JSON response with the right status.
 */
export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export const httpErrors = {
  badRequest: (msg = "Bad request", details?: unknown) =>
    new HttpError(400, msg, details),
  notFound: (msg = "Not found") => new HttpError(404, msg),
  conflict: (msg = "Conflict", details?: unknown) =>
    new HttpError(409, msg, details),
  unprocessable: (msg = "Unprocessable entity", details?: unknown) =>
    new HttpError(422, msg, details),
  internal: (msg = "Internal server error") => new HttpError(500, msg),
};

/**
 * Parse a path/query `id` segment into a positive integer. Throws 400
 * when the value is missing or invalid.
 */
export function parseIdParam(value: unknown, name = "id"): number {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new HttpError(400, `Invalid ${name}: ${value}`);
  }
  return n;
}
