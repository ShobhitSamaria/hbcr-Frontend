import type { Request, Response } from "express";
import {
  getDistricts,
  getPincodesByDistrict,
} from "../services/pincode.service.ts";

/**
 * GET /api/pincodes
 * Query params:
 *   - district (optional): filter pincodes by district name
 *
 * Without ?district → returns { success, data: { districts: string[] } }
 * With ?district=X  → returns { success, data: { district, pincodes: string[] } }
 */
export async function listPincodes(req: Request, res: Response) {
  try {
    const district = req.query.district as string | undefined;

    if (district && district.trim() !== "") {
      const pincodes = await getPincodesByDistrict(district.trim());
      return res.json({
        success: true,
        data: { district: district.trim(), pincodes },
      });
    }

    const districts = await getDistricts();
    return res.json({ success: true, data: { districts } });
  } catch (err) {
    console.error("Error fetching pincodes:", err);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch pincode data", status: 500 },
    });
  }
}
