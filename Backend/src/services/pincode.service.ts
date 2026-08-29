import { prisma } from "../db/prisma.ts";

/**
 * Get all unique district names, sorted alphabetically.
 */
export async function getDistricts(): Promise<string[]> {
  const rows = await prisma.pincodeDistrict.findMany({
    select: { district: true },
    distinct: ["district"],
    orderBy: { district: "asc" },
  });
  return rows.map((r) => r.district);
}

/**
 * Get all pincodes for a given district, sorted ascending.
 */
export async function getPincodesByDistrict(
  district: string
): Promise<string[]> {
  const rows = await prisma.pincodeDistrict.findMany({
    where: { district },
    select: { pincode: true },
    orderBy: { pincode: "asc" },
  });
  return rows.map((r) => r.pincode);
}

/**
 * Validate that a pincode belongs to the given district.
 * Returns the matching row if valid, null otherwise.
 */
export async function validatePincodeDistrict(
  pincode: string,
  district: string
): Promise<{ district: string; division: string; state: string } | null> {
  const row = await prisma.pincodeDistrict.findUnique({
    where: { pincode },
  });
  if (!row) return null;
  if (row.district !== district) return null;
  return { district: row.district, division: row.division, state: row.state };
}
