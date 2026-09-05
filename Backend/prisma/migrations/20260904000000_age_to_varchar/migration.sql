-- AlterTable: widen age column from SMALLINT to VARCHAR(32)
ALTER TABLE "hbcr.patients" ALTER COLUMN "age" TYPE VARCHAR(32);
