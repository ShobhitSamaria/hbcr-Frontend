import type { Hospital, User } from "../../generated/prisma/client.ts";

declare global {
  namespace Express {
    interface Request {
      /** Resolved by requireAuth: the authenticated user (with hospital). */
      user?: User & { hospital?: Hospital | null };
      /** Hospital id from the authenticated user, if any. */
      hospitalId?: number | null;
    }
  }
}

export {};
