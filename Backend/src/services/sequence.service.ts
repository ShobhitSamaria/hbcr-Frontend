import { prisma } from "../db/prisma.ts";

/**
 * Generates Reference Number and Registration Number for a hospital.
 *
 * Reference Number format: {hospital_code}{5-digit sequence}
 *   Example: Hospital code "961", first patient → "96100001"
 *
 * Registration Number format: {last 2 digits of year}{last 5 digits of Reference Number}
 *   Example: Year 2026, Reference Number "96100001" → "2600001"
 *
 * Sequence generation uses PostgreSQL's atomic UPDATE ... RETURNING to ensure
 * no duplicate numbers can be generated even with concurrent requests.
 */
export const sequenceService = {
  /**
   * Generate the next Reference Number and Registration Number for a hospital.
   * Uses atomic database operations to ensure uniqueness.
   *
   * @param hospitalId - The hospital ID
   * @param hospitalCode - The hospital code (e.g., "961")
   * @returns Object containing referenceNo and registrationNo
   */
  async generateNumbers(
    hospitalId: number,
    hospitalCode: string,
  ): Promise<{ referenceNo: string; registrationNo: string }> {
    // Use a transaction with raw SQL for atomic sequence generation.
    // This uses PostgreSQL's UPDATE ... RETURNING to atomically increment
    // the sequence and return the new value, preventing race conditions.
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the sequence row and atomically increment it.
      // Using raw SQL for atomicity - ON CONFLICT DO UPDATE with RETURNING.
      const rows = await tx.$queryRaw<{ next_sequence: number }[]>`
        INSERT INTO "hbcr.hospital_sequences" ("hospital_id", "next_sequence", "created_at", "updated_at")
        VALUES (${hospitalId}, 2, NOW(), NOW())
        ON CONFLICT ("hospital_id") DO UPDATE
        SET "next_sequence" = "hbcr.hospital_sequences"."next_sequence" + 1,
            "updated_at" = NOW()
        RETURNING "next_sequence"
      `;

      if (!rows || rows.length === 0) {
        throw new Error(`Failed to generate sequence for hospital ${hospitalId}`);
      }

      // The sequence returned is the NEXT value (already incremented),
      // so we use it directly. Sequence starts at 1, first call returns 2
      // but we want 1, so we subtract 1 on first insert.
      const sequence = rows[0].next_sequence - 1;

      // Format Reference Number: hospital code + 5-digit zero-padded sequence
      // Example: "961" + "00001" = "96100001"
      const referenceNo = `${hospitalCode}${String(sequence).padStart(5, "0")}`;

      // Format Registration Number: last 2 digits of year + last 5 digits of Reference Number
      // Example: Year 2026, reference "96100001" → "26" + "00001" = "2600001"
      const currentYear = new Date().getFullYear();
      const yearSuffix = String(currentYear).slice(-2);
      const lastFiveDigits = referenceNo.slice(-5);
      const registrationNo = `${yearSuffix}${lastFiveDigits}`;

      return { referenceNo, registrationNo };
    });

    return result;
  },

  /**
   * Get the current sequence number for a hospital (for preview/display purposes).
   * Does NOT increment the sequence.
   */
  async getCurrentSequence(hospitalId: number): Promise<number> {
    const row = await prisma.$queryRaw<{ next_sequence: number }[]>`
      SELECT "next_sequence" FROM "hbcr.hospital_sequences"
      WHERE "hospital_id" = ${hospitalId}
    `;

    if (!row || row.length === 0) {
      return 1; // No sequence yet, first one will be 1
    }

    return row[0].next_sequence;
  },

  /**
   * Preview what the next Reference Number and Registration Number would be.
   * Does NOT increment the sequence - for display purposes only.
   */
  async previewNumbers(
    hospitalId: number,
    hospitalCode: string,
  ): Promise<{ referenceNo: string; registrationNo: string }> {
    const currentSeq = await this.getCurrentSequence(hospitalId);
    const referenceNo = `${hospitalCode}${String(currentSeq).padStart(5, "0")}`;
    const currentYear = new Date().getFullYear();
    const yearSuffix = String(currentYear).slice(-2);
    const lastFiveDigits = referenceNo.slice(-5);
    const registrationNo = `${yearSuffix}${lastFiveDigits}`;

    return { referenceNo, registrationNo };
  },
};
