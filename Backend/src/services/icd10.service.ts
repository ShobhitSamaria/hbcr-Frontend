import { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../db/prisma.ts";
import type { Icdo10Kind } from "../validators/icd10.validator.ts";

/**
 * Read-only search over the ICD-10 reference tables (populated by
 * `npm run seed:icd10` from Docs/ICD10_Cancer_Topography_Morphology.xlsx).
 *
 * The workbook is ICD-10 Volume 2 instruction-manual content: it defines code
 * RANGES + category names, coding rules and worked examples, but contains NO
 * code-to-description mappings. The search works over four internal sources
 * (ranges, example code mentions, examples and rules) but returns a single
 * display-ready shape — `{ code, description }` — where `description` is the
 * workbook's own text for that entry: the category name for a range, the
 * worked-example scenario for an example-derived code. Internal fields
 * (kind, example number, rule reference, source sheet, ...) are used only to
 * rank and merge results and are deliberately not exposed to clients.
 */

export type Icdo10SearchHit = {
  /** The ICD-10 code the UI can store (null for rule rows and for worked
   *  examples that print more than one code — those have no single value). */
  code: string | null;
  /** The workbook's own description for this entry (range category name or
   *  worked-example scenario). */
  description: string;
};

/** Individual code as typed in the lookup, e.g. "C34" or "C71.9". */
const CODE_RE = /^[CD]\d{2}(?:\.\d+)?$/;
/** Range code from the workbook, e.g. "C00–C75" or "C71" (en-dash separator). */
const RANGE_RE = /^([CD])(\d{2})[–-]([CD])(\d{2})$/;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/** Escape ILIKE wildcards so user input is matched literally. */
function escapeLike(v: string): string {
  return v.replace(/[\\%_]/g, "\\$&");
}

/** All tokens of `q` must appear (case-insensitive, substring) in `expr`. */
function allTokensWhere(q: string, expr: Prisma.Sql): Prisma.Sql {
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return Prisma.sql`false`;
  const ands = tokens.map(
    (t) => Prisma.sql`${expr} ILIKE ${"%" + escapeLike(t) + "%"}`,
  );
  return Prisma.sql`(${Prisma.join(ands, " AND ")})`;
}

function capLimit(limit: number): number {
  return Math.min(Math.max(limit, 1), MAX_LIMIT);
}

/** Does `q` (an individual code) fall inside this workbook range? */
function rangeContains(rangeCode: string, q: string): boolean {
  if (!CODE_RE.test(q)) return false;
  const base = q.slice(0, 3).toUpperCase(); // e.g. "C71" from "C71.9"

  const single = /^([CD])\d{2}$/.exec(rangeCode);
  if (single) {
    // Single-code range (e.g. "C71"): matches the code itself or a subdivision.
    return base === rangeCode.toUpperCase();
  }
  const pair = RANGE_RE.exec(rangeCode);
  if (!pair) return false;
  const digits = Number.parseInt(q.slice(1), 10);
  return (
    q[0].toUpperCase() === pair[1] &&
    digits >= Number(pair[2]) &&
    digits <= Number(pair[4])
  );
}

function rankRange(range: { code: string; title: string }, q: string): number {
  const code = range.code.toUpperCase();
  if (code === q) return 0;
  if (code.startsWith(q) || q.startsWith(code)) return 1;
  if (rangeContains(code, q)) return 2;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.every((t) => range.title.toLowerCase().includes(t.toLowerCase()))) {
    return 3;
  }
  return 4;
}

export const icd10Service = {
  async search(
    q: string,
    kinds: Icdo10Kind[],
    limit = DEFAULT_LIMIT,
  ): Promise<Icdo10SearchHit[]> {
    const enabled = new Set(kinds.length > 0 ? kinds : (["range", "code", "example", "rule"] as Icdo10Kind[]));
    const cap = capLimit(limit);
    const hits: Icdo10SearchHit[] = [];

    // ---- range: fetch all (19 rows) and rank in JS so containment and
    // subdivision matching can use the printed range codes exactly.
    if (enabled.has("range")) {
      const rows = await prisma.$queryRaw<{ code: string; title: string }[]>(
        Prisma.sql`
        SELECT code, title
        FROM "hbcr.icd10_ranges"
        ORDER BY sort_order ASC
      `,
      );
      const ranked = rows
        .map((r) => ({ ...r, rank: rankRange(r, q) }))
        .filter((r) => r.rank <= 3)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, cap)
        .map((r) => ({ code: r.code, description: r.title }));
      hits.push(...ranked);
    }

    // ---- code mentions: code-prefix OR scenario-token match.
    if (enabled.has("code")) {
      const rows = await prisma.$queryRaw<{ code: string; scenario: string }[]>(
        Prisma.sql`
        SELECT code, scenario
        FROM "hbcr.icd10_code_mentions"
        WHERE code ILIKE ${escapeLike(q) + "%"}
           OR ${allTokensWhere(q, Prisma.sql`scenario`)}
        ORDER BY CASE
          WHEN code ILIKE ${escapeLike(q)} THEN 0
          WHEN code ILIKE ${escapeLike(q) + "%"} THEN 1
          ELSE 2
        END, sort_order ASC
        LIMIT ${cap}
      `,
      );
      hits.push(
        ...rows.map((r) => ({ code: r.code, description: r.scenario })),
      );
    }

    // ---- examples: scenario or printed result text token match.
    if (enabled.has("example")) {
      const rows = await prisma.$queryRaw<
        { scenario: string; codes: string[] | null }[]
      >(Prisma.sql`
        SELECT scenario, codes
        FROM "hbcr.icd10_examples"
        WHERE ${allTokensWhere(q, Prisma.sql`scenario`)}
           OR ${allTokensWhere(q, Prisma.sql`result_text`)}
        ORDER BY example_no ASC
        LIMIT ${cap}
      `);
      hits.push(
        ...rows.map((r) => ({
          // Only examples that print exactly one code have a single selectable value.
          code: r.codes && r.codes.length === 1 ? r.codes[0] : null,
          description: r.scenario,
        })),
      );
    }

    // ---- rules: title or body token match.
    if (enabled.has("rule")) {
      const rows = await prisma.$queryRaw<{ title: string }[]>(Prisma.sql`
        SELECT title
        FROM "hbcr.icd10_rules"
        WHERE ${allTokensWhere(q, Prisma.sql`title`)}
           OR ${allTokensWhere(q, Prisma.sql`text`)}
        ORDER BY rule_id ASC
        LIMIT ${cap}
      `);
      hits.push(
        ...rows.map((r) => ({ code: null, description: r.title })),
      );
    }

    return hits.slice(0, cap);
  },

  /**
   * Look up the ICD-10 site suggested for an ICD-O-3 topography code
   * (field 23.1 → field 24). The ICD-O-3 topography axis is derived from
   * ICD-10 Chapter II, so C00.0–C80.9 map to the identical ICD-10 code; the
   * mapping table (hbcr.icdo3_icd10_mapping) holds editable rows. Codes with
   * no reliable mapping (e.g. C42.x haematopoietic/reticuloendothelial)
   * return null so the UI shows no suggestion instead of an invented one.
   */
  async mapTopography(icdo3Code: string) {
    const row = await prisma.icdo3Icd10Mapping.findUnique({
      where: { icdo3Code },
      select: {
        icdo3Code: true,
        icdo3Term: true,
        icd10Code: true,
        note: true,
      },
    });
    if (!row) return null;
    return {
      icdo3Code: row.icdo3Code,
      icdo3Term: row.icdo3Term,
      icd10Code: row.icd10Code,
      note: row.note,
    };
  },
};
