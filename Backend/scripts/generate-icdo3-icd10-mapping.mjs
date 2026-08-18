#!/usr/bin/env node
/**
 * generate-icdo3-icd10-mapping.mjs — builds the maintainable ICD-O-3
 * Topography → ICD-10 site mapping artifact from the ICD-O-3 topography
 * numerical list.
 *
 *   input : scripts/output/icdo3-topography.json  (from parse-icdo3.mjs)
 *   output: scripts/output/icdo3-icd10-mapping.json
 *
 * Mapping rule
 * ------------
 * The ICD-O-3 topography axis is derived from ICD-10 Chapter II, so every
 * topography code C00.0–C80.9 maps to the IDENTICAL ICD-10 code (e.g. ICD-O-3
 * C30.0 "Nasal cavity" → ICD-10 C30.0). The one deliberate exclusion:
 *
 *   C42.x  Haematopoietic and reticuloendothelial systems
 *
 * ICD-10 has no topography for these (they are coded to the morphology-based
 * C81–C96 categories), so NO ICD-10 suggestion is produced for C42.x — the
 * UI shows nothing rather than an invented mapping.
 *
 * The output JSON is a plain, editable reference table: add/remove/edit rows
 * to adjust the mapping later without touching code. It is imported by
 * `npm run seed:icdo3:icd10`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = resolve(__dirname, "output", "icdo3-topography.json");
const OUTPUT = resolve(__dirname, "output", "icdo3-icd10-mapping.json");

// ICD-O-3 topography codes that have NO ICD-10 topography equivalent.
// (ICD-10 codes these neoplasms through morphology, C81–C96.)
const NO_ICD10_EQUIVALENT = new Set(["C42.0", "C42.1", "C42.2", "C42.3", "C42.4"]);

const doc = JSON.parse(readFileSync(INPUT, "utf-8"));
const entries = Array.isArray(doc.entries) ? doc.entries : [];

const mapped = [];
const excluded = [];
for (const e of entries) {
  const code = String(e.code ?? "").trim().toUpperCase();
  if (!code) continue;
  if (NO_ICD10_EQUIVALENT.has(code)) {
    excluded.push({ code, term: e.term ?? "" });
    continue;
  }
  mapped.push({
    icdo3Code: code,
    icdo3Term: (e.term ?? "").trim(),
    icd10Code: code, // identity mapping — ICD-O-3 topography is ICD-10 C00–C80
    note: null,
  });
}

mapped.sort((a, b) => a.icdo3Code.localeCompare(b.icdo3Code));

const out = {
  source: "ICD-O-3, Third Edition, First Revision (WHO) — topography numerical list",
  mappingRule:
    "Identity mapping: ICD-O-3 topography codes C00.0–C80.9 map to the identical ICD-10 code " +
    "(the ICD-O-3 topography axis is derived from ICD-10 Chapter II). Excluded: C42.x " +
    "(haematopoietic and reticuloendothelial systems) — ICD-10 has no topography equivalent, " +
    "so no suggestion is produced for those codes.",
  count: mapped.length,
  excludedCount: excluded.length,
  excluded,
  entries: mapped,
};

writeFileSync(OUTPUT, JSON.stringify(out, null, 2) + "\n");

console.log(
  `[generate-icdo3-icd10-mapping] wrote ${mapped.length} mappings to ${OUTPUT}`,
);
console.log(
  `[generate-icdo3-icd10-mapping] excluded ${excluded.length} (no ICD-10 equivalent): ${excluded
    .map((e) => e.code)
    .join(", ")}`,
);
