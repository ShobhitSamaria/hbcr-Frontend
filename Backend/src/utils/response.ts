/**
 * Standard JSON envelope used by every controller. Keeps responses uniform.
 *
 *   Success: { success: true, data, message?, meta? }
 *   Failure: { success: false, error: { message, status, details? } }
 */
export function ok(
  res: import("express").Response,
  data: unknown,
  init: { status?: number; message?: string; meta?: unknown } = {},
) {
  return res.status(init.status ?? 200).json({
    success: true,
    message: init.message,
    data,
    meta: init.meta,
  });
}

export function created(
  res: import("express").Response,
  data: unknown,
  message = "Created",
) {
  return ok(res, data, { status: 201, message });
}

export function noContent(res: import("express").Response) {
  return res.status(204).send();
}

export function fail(
  res: import("express").Response,
  status: number,
  message: string,
  details?: unknown,
) {
  return res.status(status).json({
    success: false,
    error: { message, status, details },
  });
}
