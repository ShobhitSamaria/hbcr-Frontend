#!/usr/bin/env -S npx tsx
/**
 * seed-icd10.ts — one-time import of the ICD-10 reference data into
 * PostgreSQL. The JSON is produced by scripts/extract-icd10-workbook.py from
 * Docs/ICD10_Cancer_Topography_Morphology.xlsx:
 *
 *   scripts/output/icd10-reference.json
 *     -> hbcr.icd10_ranges         (code ranges + category names)
 *     -> hbcr.icd10_rules          (rule blocks A, B, C-F, G)
 *     -> hbcr.icd10_examples       (worked examples)
 *     -> hbcr.icd10_code_mentions  (per-example individual code mentions)
 *
 * Usage:
 *   npx tsx scripts/seed-icd10.ts            # import into the database
 *   npx tsx scripts/seed-icd10.ts --dry-run  # parse + validate only (no DB)
 *
 * The four ICD-10 tables are cleared first so the import is idempotent and
 * repeatable. No other HBCR table is touched — this is pure reference data,
 * kept separate from the patient/registration tables on purpose.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, "output", "icd10-reference.json");

// ---------------------------------------------------------------------------
// Data shapes (mirror scripts/extract-icd10-workbook.py)
// ---------------------------------------------------------------------------

interface RangeData {
  code: string;
  title: string;
  source: string;
  sortOrder: number;
}

interface RuleData {
  ruleId: string;
  title: string;
  text: string;
  source: string;
}

interface ExampleData {
  exampleNo: string;
  rule: string;
  scenario: string;
  resultText: string;
  codes: string[];
}

interface MentionData {
  code: string;
  exampleNo: string;
  rule: string;
  scenario: string;
  sortOrder: number;
}

interface Loaded {
  ranges: RangeData[];
  rules: RuleData[];
  examples: ExampleData[];
  mentions: MentionData[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Load + validate
// ---------------------------------------------------------------------------

function load(): Loaded {
  const warnings: string[] = [];
  const doc = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as {
    meta: { source: string };
    ranges: Omit<RangeData, "sortOrder" | "source">[];
    rules: RuleData[];
    examples: ExampleData[];
    codeMentions: Omit<MentionData, "sortOrder">[];
  };

  const seenRanges = new Set<string>();
  const ranges: RangeData[] = doc.ranges.map((r, i) => {
    if (seenRanges.has(r.code)) warnings.push(`range: duplicate code ${r.code}`);
    seenRanges.add(r.code);
    if (!r.title) warnings.push(`range ${r.code}: empty title`);
    return { ...r, source: "ICD-10 workbook", sortOrder: i };
  });

  const seenRules = new Set<string>();
  const rules: RuleData[] = doc.rules.map((r) => {
    if (seenRules.has(r.ruleId)) warnings.push(`rule: duplicate id ${r.ruleId}`);
    seenRules.add(r.ruleId);
    if (!r.text) warnings.push(`rule ${r.ruleId}: empty text`);
    return r;
  });

  const seenExamples = new Set<string>();
  const examples: ExampleData[] = doc.examples.map((e) => {
    if (seenExamples.has(e.exampleNo)) warnings.push(`example: duplicate no ${e.exampleNo}`);
    seenExamples.add(e.exampleNo);
    if (!e.scenario || !e.resultText) {
      warnings.push(`example ${e.exampleNo}: empty scenario/resultText`);
    }
    if (e.codes.length === 0) {
      warnings.push(`example ${e.exampleNo}: no printed codes (informational)`);
    }
    return e;
  });

  const mentions: MentionData[] = doc.codeMentions.map((m, i) => {
    if (!m.code || !m.scenario) warnings.push(`mention ${i}: empty code/scenario`);
    return { ...m, sortOrder: i };
  });

  return { ranges, rules, examples, mentions, warnings };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { ranges, rules, examples, mentions, warnings } = load();

  for (const w of warnings) console.warn(`[seed-icd10] warning: ${w}`);
  console.log(
    `[seed-icd10] parsed ${ranges.length} ranges, ${rules.length} rules, ` +
      `${examples.length} examples, ${mentions.length} code mentions` +
      (warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? "s" : ""})` : ""),
  );

  if (dryRun) {
    console.log("[seed-icd10] dry-run: no database connection made");
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

  // ICD-10 reference tables only — nothing else is touched.
  await prisma.icdo10CodeMention.deleteMany();
  await prisma.icdo10Example.deleteMany();
  await prisma.icdo10Rule.deleteMany();
  await prisma.icdo10Range.deleteMany();

  await prisma.icdo10Range.createMany({ data: ranges });
  await prisma.icdo10Rule.createMany({ data: rules });
  await prisma.icdo10Example.createMany({ data: examples });
  await prisma.icdo10CodeMention.createMany({ data: mentions });

  const [ra, ru, ex, me] = await Promise.all([
    prisma.icdo10Range.count(),
    prisma.icdo10Rule.count(),
    prisma.icdo10Example.count(),
    prisma.icdo10CodeMention.count(),
  ]);
  console.log(
    `[seed-icd10] import complete: ${ra} ranges, ${ru} rules, ${ex} examples, ${me} code mentions`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[seed-icd10] failed:", e);
  process.exit(1);
});
