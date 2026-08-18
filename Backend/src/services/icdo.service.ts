import { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../db/prisma.ts";

/**
 * Read-only search over the ICD-O-3 reference tables (populated by
 * `npm run seed:icdo3`). Three endpoints share one strategy:
 *
 *   - Search by CODE: `code ILIKE 'q%'` (case-insensitive prefix), so both
 *     exact codes ("C30.0") and partial codes ("C30") work.
 *   - Search by TERM/NAME: every whitespace-separated token of `q` must
 *     appear (case-insensitive, substring) somewhere in the entry's text
 *     (term + synonyms + group name for the numerical lists; headword +
 *     sub-headword + term for the alphabetic index). This gives the
 *     "internal nose" -> C30.0 style fuzzy matching.
 *
 * Results are capped by `limit` (1..50) and ranked: exact code first, then
 * code prefix, then term-prefix, then the rest (code asc).
 */

export type IcdoTopoHit = {
  code: string;
  term: string;
  synonyms: string[];
  groupCode: string | null;
  groupName: string | null;
};

export type IcdoMorphHit = {
  code: string;
  term: string;
  synonyms: string[];
  behavior: number | null;
  siteRestriction: string | null;
  groupName: string | null;
};

export type IcdoIndexHit = {
  code: string | null;
  kind: "topography" | "morphology" | null;
  headword: string;
  subHeadword: string | null;
  term: string;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/** Escape ILIKE wildcards so user input is matched literally. */
function escapeLike(v: string): string {
  return v.replace(/[\\%_]/g, "\\$&");
}

/** WHERE clause: code-prefix match OR all tokens present in the text. */
function searchWhere(q: string, textExpr: Prisma.Sql): Prisma.Sql {
  const ors: Prisma.Sql[] = [Prisma.sql`code ILIKE ${escapeLike(q) + "%"}`];
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 0) {
    const ands = tokens.map(
      (t) => Prisma.sql`${textExpr} ILIKE ${"%" + escapeLike(t) + "%"}`,
    );
    ors.push(Prisma.sql`(${Prisma.join(ands, " AND ")})`);
  }
  return Prisma.sql`(${Prisma.join(ors, " OR ")})`;
}

/** Ranking: exact code (0) < code prefix (1) < term prefix (2) < other (3). */
function rankOrder(q: string): Prisma.Sql {
  return Prisma.sql`CASE
    WHEN code ILIKE ${escapeLike(q)} THEN 0
    WHEN code ILIKE ${escapeLike(q) + "%"} THEN 1
    WHEN term ILIKE ${escapeLike(q) + "%"} THEN 2
    ELSE 3
  END`;
}

function capLimit(limit: number): number {
  return Math.min(Math.max(limit, 1), MAX_LIMIT);
}

const TOPO_TEXT = Prisma.sql`(term || ' ' || coalesce(array_to_string(synonyms, ' '), '') || ' ' || coalesce(group_name, ''))`;
const MORPH_TEXT = Prisma.sql`(term || ' ' || coalesce(array_to_string(synonyms, ' '), '') || ' ' || coalesce(group_name, ''))`;
const INDEX_TEXT = Prisma.sql`(headword || ' ' || coalesce(sub_headword, '') || ' ' || term)`;

export const icdoService = {
  async searchTopography(q: string, limit = DEFAULT_LIMIT): Promise<IcdoTopoHit[]> {
    const rows = await prisma.$queryRaw<
      {
        code: string;
        term: string;
        synonyms: string[] | null;
        groupCode: string | null;
        groupName: string | null;
      }[]
    >(Prisma.sql`
      SELECT code, term, synonyms,
             group_code AS "groupCode",
             group_name AS "groupName"
      FROM "hbcr.icdo_topography"
      WHERE ${searchWhere(q, TOPO_TEXT)}
      ORDER BY ${rankOrder(q)}, code ASC
      LIMIT ${capLimit(limit)}
    `);
    return rows.map((r) => ({
      code: r.code,
      term: r.term,
      synonyms: r.synonyms ?? [],
      groupCode: r.groupCode,
      groupName: r.groupName,
    }));
  },

  async searchMorphology(q: string, limit = DEFAULT_LIMIT): Promise<IcdoMorphHit[]> {
    const rows = await prisma.$queryRaw<
      {
        code: string;
        term: string;
        synonyms: string[] | null;
        behavior: number | null;
        siteRestriction: string | null;
        groupName: string | null;
      }[]
    >(Prisma.sql`
      SELECT code, term, synonyms, behavior,
             site_restriction AS "siteRestriction",
             group_name AS "groupName"
      FROM "hbcr.icdo_morphology"
      WHERE ${searchWhere(q, MORPH_TEXT)}
      ORDER BY ${rankOrder(q)}, code ASC
      LIMIT ${capLimit(limit)}
    `);
    return rows.map((r) => ({
      code: r.code,
      term: r.term,
      synonyms: r.synonyms ?? [],
      behavior: r.behavior,
      siteRestriction: r.siteRestriction,
      groupName: r.groupName,
    }));
  },

  async searchIndex(q: string, limit = DEFAULT_LIMIT): Promise<IcdoIndexHit[]> {
    const rows = await prisma.$queryRaw<
      {
        code: string | null;
        kind: "topography" | "morphology" | null;
        headword: string;
        subHeadword: string | null;
        term: string;
      }[]
    >(Prisma.sql`
      SELECT code, kind, headword,
             sub_headword AS "subHeadword",
             term
      FROM "hbcr.icdo_index_entries"
      WHERE ${searchWhere(q, INDEX_TEXT)}
      ORDER BY ${rankOrder(q)}, headword ASC, term ASC
      LIMIT ${capLimit(limit)}
    `);
    return rows.map((r) => ({
      code: r.code,
      kind: r.kind,
      headword: r.headword,
      subHeadword: r.subHeadword,
      term: r.term,
    }));
  },
};
