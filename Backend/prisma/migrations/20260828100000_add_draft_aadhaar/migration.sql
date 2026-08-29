-- Add aadhaar column to drafts for search functionality
ALTER TABLE "hbcr.drafts" ADD COLUMN "aadhaar" VARCHAR(12);
