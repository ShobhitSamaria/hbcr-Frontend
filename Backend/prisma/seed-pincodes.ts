/**
 * Seed the PincodeDistrict reference table from rajasthan_pincodes.pdf.
 *
 * Usage:
 *   cd Backend && npx tsx prisma/seed-pincodes.ts
 *
 * The PDF path is relative to the project root (../Docs/rajasthan_pincodes.pdf).
 * Format: "DISTRICT   PIN_CODE" per line (UPPERCASE district, 6-digit pincode).
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { execSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import { config } from "../src/config/index.js";

const adapter = new PrismaPg({ connectionString: config.databaseUrl });
const prisma = new PrismaClient({ adapter });

const PDF_PATH = "/Users/shobhitsamaria/Desktop/DOITC Code/HBCR/Docs/rajasthan_pincodes.pdf";
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
    execSync(`/opt/homebrew/bin/pdftotext -layout "${PDF_PATH}" "${TMP_TXT}"`, { stdio: "pipe" });
  } catch {
    console.error(
      "ERROR: pdftotext not found. Install poppler: brew install poppler"
    );
    process.exit(1);
  }

  const content = readFileSync(TMP_TXT, "utf-8");

  // Clean up temp file
  try {
    unlinkSync(TMP_TXT);
  } catch {
    // ignore
  }

  const rows: PincodeRow[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    // Skip empty lines, header, form feeds
    if (!trimmed || trimmed.startsWith("District") || trimmed.startsWith("\f")) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;

    // Pincode is always the last token
    const pincode = parts[parts.length - 1];
    // District is everything before the pincode (handles multi-word like "SAWAI MADHOPUR")
    const districtRaw = parts.slice(0, -1).join(" ");

    // Validate pincode: must be 6 digits
    if (!/^\d{6}$/.test(pincode)) {
      // Fix 5-digit pincodes (add leading zero)
      if (/^\d{5}$/.test(pincode)) {
        rows.push({
          pincode: "0" + pincode,
          district: districtRaw,
          division: "N/A",
          state: "RAJASTHAN",
        });
      }
      // Skip non-numeric or invalid pincodes
      continue;
    } else {
      rows.push({
        pincode,
        district: districtRaw,
        division: "N/A",
        state: "RAJASTHAN",
      });
    }
  }

  return rows;
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

async function main() {
  console.log("Parsing PDF:", PDF_PATH);
  const raw = parsePdf();
  console.log(`Found ${raw.length} raw pincode records`);

  // Deduplicate by pincode
  const seen = new Set<string>();
  const unique = raw.filter((r) => {
    if (seen.has(r.pincode)) return false;
    seen.add(r.pincode);
    return true;
  });
  console.log(`Unique pincodes: ${unique.length}`);

  // Apply Title Case to district names
  const final = unique.map((r) => ({
    ...r,
    district: titleCase(r.district),
  }));

  // Count districts
  const districts = new Set(final.map((r) => r.district));
  console.log(`Districts: ${districts.size}`);
  for (const d of [...districts].sort()) {
    const count = final.filter((r) => r.district === d).length;
    console.log(`  ${d}: ${count}`);
  }

  // Delete existing data and insert fresh
  console.log("\nClearing existing data...");
  await prisma.pincodeDistrict.deleteMany();

  console.log("Seeding database...");
  let inserted = 0;

  // Batch insert for performance
  const BATCH_SIZE = 100;
  for (let i = 0; i < final.length; i += BATCH_SIZE) {
    const batch = final.slice(i, i + BATCH_SIZE);
    await prisma.pincodeDistrict.createMany({
      data: batch.map((r) => ({
        pincode: r.pincode,
        district: r.district,
        division: r.division,
        state: r.state,
      })),
      skipDuplicates: true,
    });
    inserted += batch.length;
    if (inserted % 200 === 0) {
      console.log(`  ${inserted}/${final.length} done`);
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
