-- CreateTable: Reference table for Rajasthan district ↔ pincode mapping
-- Note: Uses "hbcr." prefix in public schema (consistent with other tables)
CREATE TABLE "hbcr"."pincode_districts" (
    "id" SERIAL NOT NULL,
    "pincode" VARCHAR(6) NOT NULL,
    "district" VARCHAR(64) NOT NULL,
    "division" VARCHAR(64) NOT NULL,
    "state" VARCHAR(64) NOT NULL DEFAULT 'RAJASTHAN',

    CONSTRAINT "pincode_districts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on pincode
CREATE UNIQUE INDEX "pincode_districts_pincode_key" ON "hbcr"."pincode_districts"("pincode");

-- CreateIndex: Index on district for fast lookup
CREATE INDEX "idx_pincode_districts_district" ON "hbcr"."pincode_districts"("district");
