#!/usr/bin/env -S npx tsx
/**
 * seed-icdo3.ts — one-time import of the ICD-O-3 reference data CSVs into
 * PostgreSQL. The CSVs are produced by scripts/parse-icdo3.mjs from
 * Docs/icd o3.pdf:
 *
 *   scripts/output/icdo3-topography.csv   -> hbcr.icdo_topography
 *   scripts/output/icdo3-morphology.csv   -> hbcr.icdo_morphology
 *   scripts/output/icdo3-index.csv        -> hbcr.icdo_index_entries
 *
 * Usage:
 *   npx tsx scripts/seed-icdo3.ts            # import into the database
 *   npx tsx scripts/seed-icdo3.ts --dry-run  # parse + validate only (no DB)
 *
 * The three ICD-O-3 tables are cleared first so the import is idempotent and
 * repeatable. No other HBCR table is touched — this is pure reference data,
 * kept separate from the patient/registration tables on purpose.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "output");

// ---------------------------------------------------------------------------
// Minimal RFC-4180 CSV parser (the parse-icdo3.mjs writer quotes any field
// containing a comma/quote, doubles embedded quotes, and joins arrays with
// " | " — no embedded newlines, so one CSV row == one physical line).
// ---------------------------------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      if (row.length || field !== "") {
        row.push(field);
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (row.length || field !== "") {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function readCsv(file: string): string[][] {
  const text = readFileSync(resolve(OUTPUT_DIR, file), "utf-8");
  const rows = parseCsv(text);
  // Drop the header row.
  return rows.slice(1).filter((r) => r.length > 1 || r[0] !== "");
}

function rowsToObjects(rows: string[][], header: string[]): Record<string, string>[] {
  return rows.map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h] = (r[i] ?? "").trim();
    });
    return obj;
  });
}

function parseBool(v: string): boolean {
  return v === "true";
}

function toInt(v: string, fallback = 0): number {
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

function splitList(v: string): string[] {
  return v
    ? v
        .split(" | ")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

// ---------------------------------------------------------------------------
// Row mapping (CSV column -> Prisma field)
// ---------------------------------------------------------------------------

const TOPO_HEADER = [
  "code",
  "term",
  "group_code",
  "group_name",
  "group_note",
  "synonyms",
  "sub_site_lead_in",
  "sub_sites",
  "sort_order",
];
const MORPH_HEADER = [
  "sort_order",
  "code",
  "behavior",
  "term",
  "synonyms",
  "site_restriction",
  "obs",
  "group_code",
  "group_name",
];
const INDEX_HEADER = [
  "sort_order",
  "page",
  "letter",
  "code",
  "code_type",
  "headword",
  "sub_headword",
  "term",
  "site_restriction",
  "obs",
  "see_snomed",
  "see_also",
  "is_headword_entry",
];

interface TopoData {
  code: string;
  term: string;
  synonyms: string[];
  subSiteLeadIn: string | null;
  subSites: string[];
  groupCode: string | null;
  groupName: string | null;
  groupNote: string | null;
  sortOrder: number;
}

interface MorphData {
  code: string;
  term: string;
  synonyms: string[];
  behavior: number | null;
  siteRestriction: string | null;
  isObsolete: boolean;
  groupCode: string | null;
  groupName: string | null;
  sortOrder: number;
}

interface IndexData {
  headword: string;
  term: string;
  code: string | null;
  codeType: "topography" | "morphology" | null;
  siteRestriction: string | null;
  seeAlso: string[];
  isObsolete: boolean;
  page: number;
  letter: string;
  subHeadword: string | null;
  seeSnomed: boolean;
  isHeadwordEntry: boolean;
  sortOrder: number;
}

function mapTopo(row: Record<string, string>): TopoData {
  return {
    code: row.code,
    term: row.term,
    synonyms: splitList(row.synonyms),
    subSiteLeadIn: row.sub_site_lead_in || null,
    subSites: splitList(row.sub_sites),
    groupCode: row.group_code || null,
    groupName: row.group_name || null,
    groupNote: row.group_note || null,
    sortOrder: toInt(row.sort_order),
  };
}

function mapMorph(row: Record<string, string>): MorphData {
  return {
    code: row.code,
    term: row.term,
    synonyms: splitList(row.synonyms),
    behavior: row.behavior ? toInt(row.behavior, -1) : null,
    siteRestriction: row.site_restriction || null,
    isObsolete: parseBool(row.obs),
    groupCode: row.group_code || null,
    groupName: row.group_name || null,
    sortOrder: toInt(row.sort_order),
  };
}

function mapIndex(row: Record<string, string>): IndexData {
  const code = row.code || null;
  const codeType = row.code_type || null;
  if (codeType !== null && codeType !== "topography" && codeType !== "morphology") {
    throw new Error(`unexpected code_type "${codeType}" (sort_order ${row.sort_order})`);
  }
  if (code && !codeType) {
    throw new Error(`index row has code "${code}" but no code_type (sort_order ${row.sort_order})`);
  }
  return {
    headword: row.headword,
    term: row.term,
    code,
    codeType,
    siteRestriction: row.site_restriction || null,
    seeAlso: splitList(row.see_also),
    isObsolete: parseBool(row.obs),
    page: toInt(row.page),
    letter: row.letter,
    subHeadword: row.sub_headword || null,
    seeSnomed: parseBool(row.see_snomed),
    isHeadwordEntry: parseBool(row.is_headword_entry),
    sortOrder: toInt(row.sort_order),
  };
}

// ---------------------------------------------------------------------------
// Validation (shared by --dry-run and the real import)
// ---------------------------------------------------------------------------

interface Loaded {
  topo: TopoData[];
  morph: MorphData[];
  index: IndexData[];
  warnings: string[];
}

function load(): Loaded {
  const warnings: string[] = [];
  const topo = rowsToObjects(readCsv("icdo3-topography.csv"), TOPO_HEADER).map(mapTopo);
  const morph = rowsToObjects(readCsv("icdo3-morphology.csv"), MORPH_HEADER).map(mapMorph);
  const index = rowsToObjects(readCsv("icdo3-index.csv"), INDEX_HEADER).map(mapIndex);

  // Invariant checks mirroring the parser QA pass.
  const dupTopo = new Set<string>();
  for (const e of topo) {
    if (!e.term) warnings.push(`topography ${e.code}: empty term`);
    if (dupTopo.has(e.code)) warnings.push(`topography: duplicate code ${e.code}`);
    dupTopo.add(e.code);
  }
  const dupMorph = new Set<string>();
  for (const e of morph) {
    if (!e.term) warnings.push(`morphology ${e.code}: empty term`);
    if (e.behavior !== null && (e.behavior < 0 || e.behavior > 9)) {
      warnings.push(`morphology ${e.code}: out-of-range behavior ${e.behavior}`);
    }
    if (dupMorph.has(e.code)) warnings.push(`morphology: duplicate code ${e.code}`);
    dupMorph.add(e.code);
  }
  for (const e of index) {
    if (!e.term && !e.seeSnomed) warnings.push(`index ${e.code ?? "?"}: empty term`);
    if (e.letter.length !== 1) warnings.push(`index sort_order ${e.sortOrder}: bad letter "${e.letter}"`);
    if (e.seeSnomed && e.code) warnings.push(`index sort_order ${e.sortOrder}: see-SNOMED row has code ${e.code}`);
  }
  return { topo, morph, index, warnings };
}

const CHUNK = 2000; // keep createMany parameter counts well under Postgres' 65535 limit

function chunked<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { topo, morph, index, warnings } = load();

  for (const w of warnings) console.warn(`[seed-icdo3] warning: ${w}`);
  console.log(
    `[seed-icdo3] parsed ${topo.length} topography, ${morph.length} morphology, ${index.length} index entries` +
      (warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? "s" : ""})` : ""),
  );

  if (dryRun) {
    console.log("[seed-icdo3] dry-run: no database connection made");
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

  // ICD-O-3 tables only — nothing else is touched.
  await prisma.icdoTopography.deleteMany();
  await prisma.icdoMorphology.deleteMany();
  await prisma.icdoIndexEntry.deleteMany();

  for (const batch of chunked(
    topo.map((e) => ({
      code: e.code,
      term: e.term,
      synonyms: e.synonyms,
      subSiteLeadIn: e.subSiteLeadIn,
      subSites: e.subSites,
      groupCode: e.groupCode,
      groupName: e.groupName,
      groupNote: e.groupNote,
      sortOrder: e.sortOrder,
    })),
    CHUNK,
  )) {
    await prisma.icdoTopography.createMany({ data: batch });
  }

  for (const batch of chunked(
    morph.map((e) => ({
      code: e.code,
      term: e.term,
      synonyms: e.synonyms,
      behavior: e.behavior,
      siteRestriction: e.siteRestriction,
      isObsolete: e.isObsolete,
      groupCode: e.groupCode,
      groupName: e.groupName,
      sortOrder: e.sortOrder,
    })),
    CHUNK,
  )) {
    await prisma.icdoMorphology.createMany({ data: batch });
  }

  for (const batch of chunked(
    index.map((e) => ({
      headword: e.headword,
      term: e.term,
      code: e.code,
      kind: e.codeType === null ? null : e.codeType === "topography" ? "TOPOGRAPHY" : "MORPHOLOGY",
      siteRestriction: e.siteRestriction,
      seeAlso: e.seeAlso,
      isObsolete: e.isObsolete,
      page: e.page,
      letter: e.letter,
      subHeadword: e.subHeadword,
      seeSnomed: e.seeSnomed,
      isHeadwordEntry: e.isHeadwordEntry,
      sortOrder: e.sortOrder,
    })),
    CHUNK,
  )) {
    await prisma.icdoIndexEntry.createMany({ data: batch });
  }

  const [t, m, i] = await Promise.all([
    prisma.icdoTopography.count(),
    prisma.icdoMorphology.count(),
    prisma.icdoIndexEntry.count(),
  ]);
  console.log(`[seed-icdo3] import complete: ${t} topography, ${m} morphology, ${i} index entries`);
  await prisma.$disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[seed-icdo3] failed:", e);
  process.exit(1);
});
