/**
 * Seed the PincodeDistrict reference table from the parsed PDF data.
 *
 * Usage:
 *   cd Backend && npx tsx prisma/seed-pincodes.ts
 *
 * The PDF path is relative to the project root (../Docs/pincode01.pdf).
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { execSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { config } from "../src/config/index.js";

const adapter = new PrismaPg({ connectionString: config.databaseUrl });
const prisma = new PrismaClient({ adapter });

const PDF_PATH = "/Users/shobhitsamaria/Desktop/DOITC Code/HBCR/Docs/pincode01.pdf";
const TMP_TXT = "/tmp/pincode_seed.txt";

interface PincodeRow {
  pincode: string;
  district: string;
  division: string;
  state: string;
}

function parsePdf(): PincodeRow[] {
  // Convert PDF to text using pdftotext
  try {
    execSync(`/opt/homebrew/bin/pdftotext "${PDF_PATH}" "${TMP_TXT}"`, { stdio: "pipe" });
  } catch {
    console.error(
      "ERROR: pdftotext not found. Install poppler: brew install poppler"
    );
    process.exit(1);
  }

  const content = readFileSync(TMP_TXT, "utf-8");
  const lines = content.split("\n");

  // Clean up temp file
  try {
    unlinkSync(TMP_TXT);
  } catch {
    // ignore
  }

  const rows: PincodeRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    // PIN codes are exactly 6 digits
    if (/^\d{6}$/.test(line)) {
      const pincode = line;
      // Read next non-empty lines for district, division, state
      const vals: string[] = [];
      let j = i + 1;
      while (j < lines.length && vals.length < 3) {
        const v = lines[j].trim();
        if (v) vals.push(v);
        j++;
      }
      const district = vals[0] || "";
      const division = vals[1] || "";
      const state = vals[2] || "RAJASTHAN";

      // Clean up district names that have division suffixes
      // e.g. "Hanumangarh Bikaner Division" → "Hanumangarh"
      // e.g. "Kotputli-Behro Jaipur Division" → "Kotputli-Behro"
      const cleanDistrict = district
        .replace(/\s+(Division|Division\s+.*)$/i, "")
        .trim();

      rows.push({ pincode, district: cleanDistrict, division, state });
      i = j;
    } else {
      i++;
    }
  }

  return rows;
}

async function main() {
  console.log("Parsing PDF:", PDF_PATH);
  const rows = parsePdf();
  console.log(`Found ${rows.length} pincode records`);

  // Deduplicate by pincode (just in case)
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    if (seen.has(r.pincode)) return false;
    seen.add(r.pincode);
    return true;
  });
  console.log(`Unique pincodes: ${unique.length}`);

  // Count districts
  const districts = new Set(unique.map((r) => r.district));
  console.log(`Districts: ${districts.size}`);
  for (const d of [...districts].sort()) {
    const count = unique.filter((r) => r.district === d).length;
    console.log(`  ${d}: ${count}`);
  }

  // Upsert all rows
  console.log("\nSeeding database...");
  let inserted = 0;

  for (const row of unique) {
    await prisma.pincodeDistrict.upsert({
      where: { pincode: row.pincode },
      update: {
        district: row.district,
        division: row.division,
        state: row.state,
      },
      create: {
        pincode: row.pincode,
        district: row.district,
        division: row.division,
        state: row.state,
      },
    });
    inserted++;
    if (inserted % 100 === 0) {
      console.log(`  ${inserted}/${unique.length} done`);
    }
  }

  console.log(`\nSeeded ${inserted} pincode-district records successfully!`);

  // Verify
  const total = await prisma.pincodeDistrict.count();
  const districtCount = await prisma.pincodeDistrict.groupBy({
    by: ["district"],
    _count: true,
  });
  console.log(`\nVerification:`);
  console.log(`  Total rows: ${total}`);
  console.log(`  Districts: ${districtCount.length}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
