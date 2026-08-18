#!/usr/bin/env -S npx tsx
/**
 * seed-icdo3-icd10.ts — one-time import of the ICD-O-3 Topography → ICD-10
 * site mapping into PostgreSQL. The JSON is produced by
 * scripts/generate-icdo3-icd10-mapping.mjs from the ICD-O-3 topography
 * numerical list:
 *
 *   scripts/output/icdo3-icd10-mapping.json
 *     -> hbcr.icdo3_icd10_mapping  (icdo3_code -> icd10_code identity rows)
 *
 * Usage:
 *   npx tsx scripts/seed-icdo3-icd10.ts            # import into the database
 *   npx tsx scripts/seed-icdo3-icd10.ts --dry-run  # parse + validate only (no DB)
 *
 * The mapping table is cleared first so the import is idempotent and
 * repeatable. No other HBCR table is touched — pure reference data, separate
 * from the patient/registration tables. C42.x is absent by design (no ICD-10
 * topography equivalent), so the UI shows no suggestion for those codes.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, "output", "icdo3-icd10-mapping.json");

interface MappingData {
  icdo3Code: string;
  icdo3Term: string;
  icd10Code: string;
  note: string | null;
}

interface Loaded {
  mappings: MappingData[];
  warnings: string[];
}

function load(): Loaded {
  const warnings: string[] = [];
  const doc = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as {
    meta?: unknown;
    count: number;
    entries: MappingData[];
  };

  const seen = new Set<string>();
  const mappings: MappingData[] = doc.entries.map((e, i) => {
    if (!e.icdo3Code || !e.icdo3Term || !e.icd10Code) {
      warnings.push(`entry ${i}: missing code/term`);
    }
    if (seen.has(e.icdo3Code)) warnings.push(`duplicate icdo3_code ${e.icdo3Code}`);
    seen.add(e.icdo3Code);
    return { ...e, note: e.note ?? null };
  });

  if (mappings.length !== doc.count) {
    warnings.push(`count mismatch: json says ${doc.count}, found ${mappings.length}`);
  }
  return { mappings, warnings };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { mappings, warnings } = load();

  for (const w of warnings) console.warn(`[seed-icdo3-icd10] warning: ${w}`);
  console.log(
    `[seed-icdo3-icd10] parsed ${mappings.length} mappings` +
      (warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? "s" : ""})` : ""),
  );

  if (dryRun) {
    console.log("[seed-icdo3-icd10] dry-run: no database connection made");
    return;
  }

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("../generated/prisma/client.ts");

  const adapter = new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://shobhitsamaria@localhost:5432/hbcr_db",
  });
  const prisma = new PrismaClient({ adapter });

  // Mapping table only — nothing else is touched.
  await prisma.icdo3Icd10Mapping.deleteMany();
  await prisma.icdo3Icd10Mapping.createMany({
    data: mappings.map((m, i) => ({
      icdo3Code: m.icdo3Code,
      icdo3Term: m.icdo3Term,
      icd10Code: m.icd10Code,
      note: m.note,
      sortOrder: i,
    })),
  });

  const count = await prisma.icdo3Icd10Mapping.count();
  console.log(`[seed-icdo3-icd10] import complete: ${count} mappings`);
  await prisma.$disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[seed-icdo3-icd10] failed:", e);
  process.exit(1);
});
