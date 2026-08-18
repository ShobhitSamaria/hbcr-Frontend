-- Add auth columns to hbcr.users
-- Columns are added nullable first so pre-existing rows survive, then backfilled
-- and tightened to NOT NULL. Real credentials are set by prisma/seed.ts.

ALTER TABLE "hbcr.users" ADD COLUMN "username" VARCHAR(64);
ALTER TABLE "hbcr.users" ADD COLUMN "password_hash" VARCHAR(255);

-- Backfill a stable username for any pre-existing rows; seed.ts replaces these
-- with the intended hospital codes.
UPDATE "hbcr.users" SET "username" = 'hospital' || "id"::text WHERE "username" IS NULL;

-- Placeholder hash that can never verify; seed.ts replaces it.
UPDATE "hbcr.users" SET "password_hash" = '!seed-pending' WHERE "password_hash" IS NULL;

ALTER TABLE "hbcr.users" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "hbcr.users" ALTER COLUMN "password_hash" SET NOT NULL;

-- Prisma-generated constraint name, matches the @unique in schema.prisma
CREATE UNIQUE INDEX "hbcr.users_username_key" ON "hbcr.users"("username");

-- Index on hospital_id matches the @@index in schema.prisma
CREATE INDEX "idx_users_hospital" ON "hbcr.users"("hospital_id");
