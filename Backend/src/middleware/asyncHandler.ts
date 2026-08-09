import type { NextFunction, Request, Response } from "express";

/**
 * Wraps an async controller to forward rejections to `next()` so the global
 * error middleware can format the response.
 */
export function asyncHandler<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Fn extends (req: Request, res: Response, next: NextFunction) => Promise<any> | any,
>(fn: Fn) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
