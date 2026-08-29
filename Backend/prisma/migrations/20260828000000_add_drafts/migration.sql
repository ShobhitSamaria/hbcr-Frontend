-- CreateDrafts
CREATE TABLE "hbcr.drafts" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "created_by_user_id" INTEGER NOT NULL,
    "form_data" JSONB NOT NULL DEFAULT '{}',
    "patient_name" VARCHAR(256),
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_drafts_hospital" ON "hbcr.drafts"("hospital_id");
CREATE INDEX "idx_drafts_user" ON "hbcr.drafts"("created_by_user_id");

ALTER TABLE "hbcr.drafts" ADD CONSTRAINT "drafts_hospital_id_fkey"
    FOREIGN KEY ("hospital_id") REFERENCES "hbcr.hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hbcr.drafts" ADD CONSTRAINT "drafts_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "hbcr.users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
