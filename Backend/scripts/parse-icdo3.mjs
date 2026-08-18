#!/usr/bin/env node
/**
 * parse-icdo3.mjs — extract ICD-O-3 reference data from the official WHO PDF.
 *
 *   Source: /Users/shobhitsamaria/Desktop/DOITC Code/HBCR/Docs/icd o3.pdf
 *           ("International Classification of Diseases for Oncology", 3rd ed.,
 *            1st revision — 252 pages, text layer intact)
 *
 * Pipeline:
 *   1. Shell out to `pdftotext -bbox` (poppler) for word-level coordinates.
 *      The book is set in two text columns with no reliable x grid, so plain
 *      `-layout` text is NOT enough — the parser rebuilds lines/columns from
 *      per-word x/y positions.
 *   2. Split each page into its two columns via the fixed page gutter
 *      (GUTTER_X). Single-column lines (incl. full-width note paragraphs)
 *      go wholly to the column of their first token.
 *   3. Walk lines top-to-bottom (left column first, then right) with GLOBAL
 *      state for the numerical lists (groups legitimately span columns and
 *      pages, e.g. C69/C71 or 805-808) and PER-COLUMN state for the
 *      alphabetic index (each column is an independent headword flow).
 *   4. Emit structured JSON/CSV.
 *
 * Sections (pdf page numbers):
 *   topography : 42-60   (Numerical list of C-codes)
 *   morphology : 62-102  (Numerical list of xxxx/x codes; p61 is the
 *                         behavior-code table, p103 blank)
 *   index      : 104-225 (Alphabetic index; Appendix 1 starts p226)
 *
 * CLI:
 *   node scripts/parse-icdo3.mjs [--pdf <path>] [--section topography|morphology|index] \
 *       [--limit <n>] [--sample] [--format json|csv] [--out <path>]
 *
 * No database/API is touched by this script; it only writes data files.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PDF = "/Users/shobhitsamaria/Desktop/DOITC Code/HBCR/Docs/icd o3.pdf";

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { pdf: process.env.ICDO3_PDF || DEFAULT_PDF, section: "topography", limit: 0, format: "json", out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--pdf") opts.pdf = next();
    else if (a === "--section") opts.section = next();
    else if (a === "--limit") opts.limit = parseInt(next(), 10);
    else if (a === "--sample") opts.limit = 25;
    else if (a === "--format") opts.format = next();
    else if (a === "--out") opts.out = next();
    else if (a === "--help" || a === "-h") { usage(); process.exit(0); }
    else { console.error(`[parse-icdo3] unknown option: ${a}`); usage(); process.exit(1); }
  }
  if (!["json", "csv"].includes(opts.format)) { console.error("[parse-icdo3] --format must be json or csv"); process.exit(1); }
  if (!["topography", "morphology", "index"].includes(opts.section)) {
    console.error(`[parse-icdo3] --section must be topography|morphology|index (got "${opts.section}")`);
    process.exit(1);
  }
  return opts;
}

function usage() {
  console.log(`Usage:
  node scripts/parse-icdo3.mjs [options]

Options:
  --pdf <path>     ICD-O-3 PDF (default: ${DEFAULT_PDF})
  --section <s>    topography | morphology | index
  --limit <n>      emit only the first n entries (0 = all)
  --sample         shorthand for --limit 25 (output name gains a -sample suffix)
  --format <fmt>   json | csv
  --out <path>     output file (default: scripts/output/icdo3-<section>[-sample].<json|csv>)
`);
}

// ---------------------------------------------------------------------------
// PDF text extraction (pdftotext -bbox)
// ---------------------------------------------------------------------------

function extractBboxXml(pdfPath) {
  const stat = statSync(pdfPath);
  const hash = createHash("md5").update(`${pdfPath}:${stat.mtimeMs}:${stat.size}`).digest("hex").slice(0, 12);
  const cacheDir = resolve(tmpdir(), "hbcr-icdo3");
  const cacheFile = resolve(cacheDir, `icdo3-${hash}.xml`);

  if (existsSync(cacheFile)) {
    console.log(`[parse-icdo3] using cached bbox: ${cacheFile}`);
    return readFileSync(cacheFile, "utf-8");
  }

  let pdftotext;
  try {
    pdftotext = execFileSync("which", ["pdftotext"], { encoding: "utf-8" }).trim();
  } catch {
    console.error(
      "[parse-icdo3] 'pdftotext' (poppler-utils) was not found on PATH.\n" +
      "  Install poppler (e.g. `brew install poppler`) or provide pre-extracted\n" +
      "  bbox XML via --bbox and re-run.",
    );
    process.exit(1);
  }

  mkdirSync(cacheDir, { recursive: true });
  console.log(`[parse-icdo3] extracting text via ${pdftotext} (one-time, cached afterwards)...`);
  execFileSync(pdftotext, ["-bbox", pdfPath, cacheFile], { stdio: "inherit" });
  return readFileSync(cacheFile, "utf-8");
}

// ---------------------------------------------------------------------------
// bbox XML -> pages of words
// ---------------------------------------------------------------------------

function decodeXmlEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parseBbox(xml) {
  const pages = [];
  const pageRe = /<page\b[^>]*>([\s\S]*?)<\/page>/g;
  const wordRe = /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]+)<\/word>/g;
  let m;
  while ((m = pageRe.exec(xml)) !== null) {
    const words = [];
    let w;
    while ((w = wordRe.exec(m[1])) !== null) {
      words.push({
        x0: parseFloat(w[1]), y0: parseFloat(w[2]),
        x1: parseFloat(w[3]), y1: parseFloat(w[4]),
        text: decodeXmlEntities(w[5]),
      });
    }
    pages.push(words);
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Line + column reconstruction
// ---------------------------------------------------------------------------

// Words on one print line have y0 baselines up to ~0.06pt apart (glyph
// artifacts); same-column rows are ~13pt apart; BUT the two columns' rows
// are offset by ~1.5pt from each other. A 4pt tolerance therefore chains
// unrelated rows across columns (and splits code/term pairs whose baselines
// differ by ~0.06pt). 1.5pt cleanly separates rows while keeping each line's
// words together: same-column same-line words sit within ~0.1pt of each
// other, so the consecutive-gap comparison below can never split a column's
// own line, while cross-column baselines on the same visual row (offset by
// up to ~1.5pt, e.g. p52 C48.1/C49.1, p67 8190/0+8163/0) merge and are then
// separated by splitColumn. The 3pt "code above term" typesetting quirk
// (e.g. C71.4) is handled by the lone-code fix in finalizeEntry, not by
// line merging.
const LINE_Y_TOLERANCE = 1.5;
const CONTENT_Y_MIN = 75;     // below running headers (y~45-56); content starts at y~83
const CONTENT_Y_MAX = 780;    // skip footers / page numbers (page height ~842)
// InDesign layout is constant across the book: the left column's widest
// wrapped word reaches x~273 and the right column starts at x~307.56, so a
// fixed gutter position is robust (per-page "largest x-gap" fails on dense
// pages where the left column nearly touches the right one, e.g. p47).
const GUTTER_X = 290;

function groupIntoLines(words) {
  const sorted = [...words].sort((a, b) => (a.y0 - b.y0) || (a.x0 - b.x0));
  const lines = [];
  for (const w of sorted) {
    const last = lines[lines.length - 1];
    // Consecutive-gap comparison: anchor on the PREVIOUS word, not the line's
    // first word. Words arrive y-sorted with the two text columns interleaved,
    // so an anchor-based test lets one column's baseline shift push a same-line
    // word of the other column just past the tolerance (C49.1 on p52) or drop
    // a code off its term (8163/0 on p67). Same-line words are ~0.1pt apart,
    // so comparing to the previous word is safe and exact.
    if (last && Math.abs(w.y0 - last[last.length - 1].y0) <= LINE_Y_TOLERANCE) last.push(w);
    else lines.push([w]);
  }
  for (const ln of lines) ln.sort((a, b) => a.x0 - b.x0);
  return lines;
}

function splitColumn(line) {
  // A line genuinely spans both columns only when it contains the page
  // gutter: a big internal gap whose right side is in the right column.
  // Full-width paragraphs (section notes / divider titles) must NOT be torn
  // apart. We look for ANY gap that straddles the gutter (left zone -> right
  // zone), not the largest gap (dense pages justify so hard that
  // intra-column spacing can exceed the gutter gap).
  const xs = line.map((w) => w.x0).sort((a, b) => a - b);
  let gapMid = GUTTER_X;
  let found = false;
  for (let i = 1; i < xs.length; i++) {
    const before = xs[i - 1];
    const after = xs[i];
    if (before < 285 && after >= 285 && after - before >= 60) {
      gapMid = (after + before) / 2;
      found = true;
      break;
    }
  }
  if (!found) {
    return line[0].x0 < GUTTER_X ? [line, []] : [[], line];
  }
  const left = [], right = [];
  for (const w of line) (w.x0 < gapMid ? left : right).push(w);
  return [left, right];
}

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// ---------------------------------------------------------------------------
// Code patterns
// ---------------------------------------------------------------------------

const ENT_CODE = /^C\d{2}\.\d$/;        // topography entry:  C09.9
const GRP_CODE = /^C\d{2}$/;            // topography group:  C12
const RNG_CODE = /^C\d{2}-C\d{2}$/;     // topography range:  C00-C14
const MORPH_ENTRY = /^\d{4}\/\d$/;      // morphology entry:  8070/3
const MORPH_GRP = /^\d{3}$/;            // morphology group:  800
const MORPH_RNG = /^\d{3}-\d{3}$/;      // morphology range:  805-808
const SITE_RE = /\(C\d{2}\.\d[\d._,\s]*\)/; // site restriction: (C34._), (C18._, C19.9, C20.9)
const SEE_ALSO_RE = /\(see also ([^)]+)\)/g;
const CONTINUED_RE = /,\s*continued$/i;

function isTopoCodeLike(text) {
  return ENT_CODE.test(text) || GRP_CODE.test(text) || RNG_CODE.test(text);
}
function isMorphCodeLike(text) {
  return MORPH_ENTRY.test(text) || MORPH_GRP.test(text) || MORPH_RNG.test(text);
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function parenUnbalanced(s) {
  if (!s) return false;
  let open = 0;
  for (const ch of s) { if (ch === "(") open++; else if (ch === ")") open--; }
  return open > 0;
}

function isAllCaps(text) {
  const letters = text.replace(/[^A-Za-z]/g, "");
  return letters.length >= 3 && letters === letters.toUpperCase();
}

function extractSiteRestriction(text) {
  const m = SITE_RE.exec(text || "");
  return m ? m[0].slice(1, -1) : null;
}

function extractSeeAlso(text) {
  const out = [];
  let m;
  const re = new RegExp(SEE_ALSO_RE.source, "g");
  while ((m = re.exec(text || "")) !== null) out.push(m[1].trim());
  return out;
}

// headword-entry name: strip [obs] and a trailing site-restriction parenthetical
function cleanName(text) {
  return (text || "")
    .replace(/\s*\[obs\]/g, "")
    .replace(/\s*\(C\d{2}\.\d[\d._,\s]*\)\s*$/, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Section detection
// ---------------------------------------------------------------------------

// Count content lines whose first token is a topography code.
function countTopoCodeLines(pageWords) {
  let n = 0;
  for (const ln of groupIntoLines(pageWords)) {
    const y = ln[0].y0;
    if (y < CONTENT_Y_MIN || y > CONTENT_Y_MAX) continue;
    const t = ln[0].text;
    if (ENT_CODE.test(t) || GRP_CODE.test(t) || RNG_CODE.test(t)) n++;
  }
  return n;
}

function countMorphCodeLines(pageWords) {
  let n = 0;
  for (const ln of groupIntoLines(pageWords)) {
    const y = ln[0].y0;
    if (y < CONTENT_Y_MIN || y > CONTENT_Y_MAX) continue;
    const t = ln[0].text;
    if (MORPH_ENTRY.test(t) || MORPH_GRP.test(t) || MORPH_RNG.test(t)) n++;
  }
  return n;
}

// The lists sections open with a big single-word title page ("Topography" /
// "Morphology"). The introduction (pages 1-39) mentions C-codes in running
// text, so we anchor the search on those divider pages and require >= 3
// code-starting lines per page to filter out intro noise. The TOC also
// contains single-word "Morphology"/"Topography" entries in body type, so a
// word-height guard (section titles are set ~25pt vs ~12pt body text)
// separates the real divider from TOC entries.
function findDividerPage(pages, title) {
  for (let i = 0; i < pages.length; i++) {
    for (const ln of groupIntoLines(pages[i])) {
      const y = ln[0].y0;
      if (y < 90 || y > 210) continue;
      if (ln.length === 1 && ln[0].text === title && ln[0].y1 - ln[0].y0 >= 18) return i;
    }
  }
  return -1;
}

// "Alphabetic index" title: two words on one line (page 104).
function findIndexDivider(pages) {
  for (let i = 0; i < pages.length; i++) {
    for (const ln of groupIntoLines(pages[i])) {
      const y = ln[0].y0;
      if (y < 100 || y > 200) continue;
      const texts = ln.map((w) => w.text);
      if (texts.includes("Alphabetic") && texts.includes("index")) return i;
    }
  }
  return -1;
}

// "Appendix 1: New codes" divider — the index ends the page before it (p226).
function findAppendixDivider(pages) {
  for (let i = 0; i < pages.length; i++) {
    for (const ln of groupIntoLines(pages[i])) {
      const y = ln[0].y0;
      if (y < 75 || y > 200) continue;
      const t = ln.map((w) => w.text).join(" ");
      if (t.startsWith("Appendix")) return i;
    }
  }
  return -1;
}

function findTopographyRange(pages) {
  const topoDiv = findDividerPage(pages, "Topography");
  const morphDiv = findDividerPage(pages, "Morphology");
  if (topoDiv === -1) return [0, 0];
  const stopAt = morphDiv === -1 ? pages.length : morphDiv;
  let start = -1;
  let end = topoDiv;
  for (let i = topoDiv; i < stopAt; i++) {
    const n = countTopoCodeLines(pages[i]);
    if (start === -1 && n >= 3) start = i;
    if (n >= 3) end = i;
  }
  return [start === -1 ? topoDiv : start, end];
}

function findMorphologyRange(pages) {
  const morphDiv = findDividerPage(pages, "Morphology");
  const indexDiv = findIndexDivider(pages);
  if (morphDiv === -1) return [0, 0];
  const stopAt = indexDiv === -1 ? pages.length : indexDiv;
  let start = -1;
  let end = morphDiv;
  for (let i = morphDiv; i < stopAt; i++) {
    const n = countMorphCodeLines(pages[i]);
    if (start === -1 && n >= 3) start = i;
    if (n >= 1) end = i;
  }
  return [start === -1 ? morphDiv : start, end];
}

function findIndexRange(pages) {
  const indexDiv = findIndexDivider(pages);
  if (indexDiv === -1) return [0, 0];
  const appendixDiv = findAppendixDivider(pages);
  const stopAt = appendixDiv === -1 ? pages.length : appendixDiv;
  let end = indexDiv;
  for (let i = indexDiv; i < stopAt; i++) {
    let n = 0;
    for (const ln of groupIntoLines(pages[i])) {
      const y = ln[0].y0;
      if (y < CONTENT_Y_MIN || y > CONTENT_Y_MAX) continue;
      const t = ln[0].text;
      if (ENT_CODE.test(t) || MORPH_ENTRY.test(t) || /^-{4,}/.test(t) || /^[A-Z]$/.test(t)) n++;
    }
    if (n >= 1) end = i;
  }
  return [indexDiv, end];
}

// ---------------------------------------------------------------------------
// Topography parser
// ---------------------------------------------------------------------------

function parseTopography(pages, range) {
  const [startIdx, endIdx] = range;
  const entries = [];
  const sectionNotes = [];
  const warnings = [];
  let sortOrder = 0;

  // GLOBAL state machine (see header comment re: cross-column/page groups).
  let group = null;       // { code, name, note, namePending }
  let entry = null;       // { code, term, synonyms[], subSiteLeadIn, subSites[], groupCode, groupName, groupNote, sortOrder }
  let noteActive = false; // inside a "Note:" paragraph (attaches to `group`)
  let lastWasSynonym = false; // the previous continuation line pushed a synonym

  const finalizeEntry = () => {
    if (entry) {
      // Lone code with no term (typesetting quirk, e.g. "C71.4"): pull the
      // previous entry's last synonym — it is the term printed above the code.
      if (!entry.term && entries.length) {
        const prev = entries[entries.length - 1];
        if (prev.synonyms.length) entry.term = prev.synonyms.pop();
      }
      if (!entry.term) {
        console.warn(`[parse-icdo3] warning: ${entry.code} has no term`);
        warnings.push(`${entry.code} has no term`);
      }
      entries.push(entry);
      entry = null;
      lastWasSynonym = false;
    }
  };

  const appendGroupName = (text) => {
    group.name = group.name ? `${group.name} ${text}` : text;
    group.namePending = true;
  };

  const appendEntryTerm = (text) => {
    if (!entry) return;
    entry.term = entry.term ? `${entry.term} ${text}` : text;
  };

  const startGroupNote = (text) => {
    noteActive = true;
    if (group) group.note = text;
    else sectionNotes.push(text);
  };

  const newEntryFromCode = (code, termText) => {
    // Code-less group header ("OTHER AND ILL-DEFINED SITES"): infer the code
    // from the first entry it introduces (C76.0 -> C76).
    if (group && !group.code) group.code = code.replace(/\.\d+$/, "");
    entry = {
      code,
      term: termText,
      synonyms: [],
      subSiteLeadIn: null,
      subSites: [],
      groupCode: group ? group.code : null,
      groupName: group ? group.name : null,
      groupNote: group ? group.note : null,
      sortOrder: sortOrder++,
    };
    noteActive = false;
    lastWasSynonym = false;
    if (group) group.namePending = false;
  };

  const codeXByColumn = { left: null, right: null };

  const processColumn = (col, colName) => {
    if (!col.length) return;
    const first = col[0];
    const firstText = first.text;
    const isFirstCode = isTopoCodeLike(firstText);
    const codeX = colName === "left" ? codeXByColumn.left : codeXByColumn.right;

    // --- code line? ---
    if (isFirstCode && !(GRP_CODE.test(firstText) && col[1]?.text === "to")) {
      const atCodeX = codeX === null || Math.abs(first.x0 - codeX) <= 4;
      const isGroupLine = GRP_CODE.test(firstText) || RNG_CODE.test(firstText);
      if (isGroupLine || (ENT_CODE.test(firstText) && atCodeX)) {
        finalizeEntry();
        const rest = col.slice(1).map((w) => w.text).join(" ");
        if (isGroupLine) {
          group = { code: firstText, name: rest || "", note: null, namePending: true };
          noteActive = false;
          // A range group header ("C00-C14") also introduces its first entry
          // on the same line in the other column — handled separately there.
        } else {
          newEntryFromCode(firstText, rest);
          // Mid-line entry code at the column's code-x (future-proofing; rare
          // in topography, common in the morphology list).
          for (let i = 1; i < col.length; i++) {
            const tok = col[i];
            if (ENT_CODE.test(tok.text) && codeX !== null && Math.abs(tok.x0 - codeX) <= 4) {
              finalizeEntry();
              newEntryFromCode(tok.text, col.slice(i + 1).map((w) => w.text).join(" "));
            }
          }
        }
        return;
      }
    }

    // --- continuation line ---
    const lineText = col.map((w) => w.text).join(" ");

    // 1. inside a "Note:" paragraph
    if (noteActive) {
      if (group) group.note = `${group.note} ${lineText}`;
      else sectionNotes[sectionNotes.length - 1] += ` ${lineText}`;
      return;
    }
    // 2. a "Note:" paragraph starts here (attaches to the current group, or to
    //    the section when it precedes the first group, e.g. page 42)
    if (firstText === "Note:") { startGroupNote(lineText); return; }

    // 3. group name continuation — while a group header's name is incomplete,
    //    every non-code line (any case, incl. wrapped parentheticals like the
    //    C72 "SYSTEM (excludes ..." header) belongs to the group name
    if (group && group.namePending) { appendGroupName(lineText); return; }

    // 4. fresh all-caps group header without a code on the line
    //    ("OTHER AND ILL-DEFINED SITES" -> code inferred from first entry)
    if (isAllCaps(lineText)) {
      finalizeEntry();
      group = { code: null, name: lineText, note: null, namePending: true };
      return;
    }

    if (!entry) return; // stray title / divider text (e.g. the "Topography" title)

    // 5. entry continuation
    const lastSyn = entry.synonyms[entry.synonyms.length - 1];
    if (
      firstText.startsWith("(") ||
      parenUnbalanced(entry.term) ||
      parenUnbalanced(lastSyn)
    ) {
      // A wrapped parenthetical completes the TERM when the term itself has
      // an open paren; otherwise it completes the last synonym (the 8077/2
      // case: "Anal intraepithelial neoplasia, grade III" / "(C21.1)").
      if (parenUnbalanced(entry.term)) appendEntryTerm(lineText);
      else if (lastWasSynonym && lastSyn) { entry.synonyms[entry.synonyms.length - 1] = `${lastSyn} ${lineText}`; lastWasSynonym = true; }
      else if (parenUnbalanced(lastSyn)) { entry.synonyms[entry.synonyms.length - 1] = `${lastSyn} ${lineText}`; lastWasSynonym = true; }
      else appendEntryTerm(lineText);
      return;
    }
    if (firstText.startsWith("\u2022")) {
      // A bullet list is introduced by a lead-in line ("Skin of:", "..."
      // system of: (see list under C47)). The lead-in was pushed as a
      // synonym on the line before the first bullet; lift it out so the
      // sub-sites stay clean.
      if (entry.subSiteLeadIn === null && lastSyn && lastWasSynonym &&
          (lastSyn.endsWith(":") || lastSyn.includes("(see list under"))) {
        entry.subSiteLeadIn = entry.synonyms.pop();
        lastWasSynonym = false;
      }
      entry.subSites.push(lineText.replace(/^\u2022\s*/, ""));
      return;
    }

    const firstChar = firstText[0];
    const isLower = firstChar && firstChar === firstChar.toLowerCase() && firstChar.toLowerCase() !== firstChar.toUpperCase();
    if (isLower) {
      // lowercase: wrapped continuation of the previous item. If the previous
      // line pushed a synonym (e.g. "Peripheral nerves and autonomic nervous"
      // / "system of: (see list under C47)"), continue THAT synonym; the term
      // may already be complete (parens balanced), so appending here would
      // pollute it.
      if (lastWasSynonym && lastSyn) {
        entry.synonyms[entry.synonyms.length - 1] = `${lastSyn} ${lineText}`;
      } else {
        appendEntryTerm(lineText);
      }
      return;
    }

    // uppercase: synonym / equivalent term listed under the same code
    entry.synonyms.push(lineText);
    lastWasSynonym = true;
  };

  for (let i = startIdx; i <= endIdx; i++) {
    const lines = groupIntoLines(pages[i]);
    const [l, r] = computeCodeX(lines);
    codeXByColumn.left = l ?? codeXByColumn.left;
    codeXByColumn.right = r ?? codeXByColumn.right;

    // Process the whole left column first, then the whole right column — the
    // two columns are independent text flows and their baselines are offset by
    // a few points, so row-interleaved processing would interleave entries and
    // let one column's group header clobber the other column's global group.
    const leftCol = [];
    const rightCol = [];
    for (const ln of lines) {
      const y = ln[0].y0;
      if (y < CONTENT_Y_MIN || y > CONTENT_Y_MAX) continue;
      const [left, right] = splitColumn(ln);
      if (left.length) leftCol.push(left);
      if (right.length) rightCol.push(right);
    }
    for (const col of leftCol) processColumn(col, "left");
    for (const col of rightCol) processColumn(col, "right");
  }
  finalizeEntry();

  return { entries, sectionNotes, warnings };
}

function computeCodeX(lines) {
  let left = [], right = [];
  for (const ln of lines) {
    const y = ln[0].y0;
    if (y < CONTENT_Y_MIN || y > CONTENT_Y_MAX) continue;
    const [l, r] = splitColumn(ln);
    if (l.length && ENT_CODE.test(l[0].text)) left.push(l[0].x0);
    if (r.length && ENT_CODE.test(r[0].text)) right.push(r[0].x0);
  }
  return [median(left), median(right)];
}

// ---------------------------------------------------------------------------
// Morphology parser
// ---------------------------------------------------------------------------

function parseMorphology(pages, range) {
  const [startIdx, endIdx] = range;
  const entries = [];
  const sectionNotes = [];
  const warnings = [];
  let sortOrder = 0;

  // GLOBAL group state, same rationale as topography. Morphology differs from
  // topography in one important way: uppercase LINES ARE LEGITIMATE SYNONYMS
  // (e.g. "CIN III, NOS (C53._)", "GIST, NOS"), so there is NO all-caps ->
  // group-header rule; groups are recognized purely by their 3-digit /
  // 3-3-digit codes. No "Note:" paragraphs exist in the morphology list, but
  // the branch is kept for safety.
  let group = null;          // { code, name, namePending }
  let entry = null;          // { code, term, synonyms[], groupCode, groupName, sortOrder }
  let noteActive = false;
  let lastWasSynonym = false;
  const codeXByColumn = { left: null, right: null };

  const finalizeEntry = () => {
    if (entry) {
      if (!entry.term) {
        console.warn(`[parse-icdo3] warning: ${entry.code} has no term`);
        warnings.push(`${entry.code} has no term`);
      }
      entry.behavior = entry.code.slice(-1);
      entry.siteRestriction = extractSiteRestriction(`${entry.term} ${entry.synonyms.join(" ")}`);
      entry.obs = /\[obs\]/.test(`${entry.term} ${entry.synonyms.join(" ")}`);
      entries.push(entry);
      entry = null;
      lastWasSynonym = false;
    }
  };

  const appendGroupName = (text) => {
    group.name = group.name ? `${group.name} ${text}` : text;
    group.namePending = true;
  };

  const appendEntryTerm = (text) => {
    if (!entry) return;
    entry.term = entry.term ? `${entry.term} ${text}` : text;
  };

  const newEntryFromCode = (code, termText) => {
    entry = {
      code,
      term: termText,
      synonyms: [],
      groupCode: group ? group.code : null,
      groupName: group ? group.name : null,
      sortOrder: sortOrder++,
    };
    noteActive = false;
    lastWasSynonym = false;
    if (group) group.namePending = false;
  };

  const processColumn = (col, colName) => {
    if (!col.length) return;
    const first = col[0];
    const firstText = first.text;
    const isFirstCode = isMorphCodeLike(firstText);
    const codeX = colName === "left" ? codeXByColumn.left : codeXByColumn.right;

    // --- code line? ---
    if (isFirstCode) {
      const atCodeX = codeX === null || Math.abs(first.x0 - codeX) <= 4;
      const isGroupLine = MORPH_GRP.test(firstText) || MORPH_RNG.test(firstText);
      // A line starting with an entry code at the code-x, or any group code
      // (group headers sit at arbitrary x, e.g. x=115/319 on p62).
      if (isGroupLine || (MORPH_ENTRY.test(firstText) && atCodeX)) {
        finalizeEntry();
        const rest = col.slice(1).map((w) => w.text).join(" ");
        if (isGroupLine) {
          group = { code: firstText, name: rest || "", namePending: true };
          noteActive = false;
        } else {
          newEntryFromCode(firstText, rest);
          // mid-line entry code at the column's code-x (two entries / line)
          for (let i = 1; i < col.length; i++) {
            const tok = col[i];
            if (MORPH_ENTRY.test(tok.text) && codeX !== null && Math.abs(tok.x0 - codeX) <= 4) {
              finalizeEntry();
              newEntryFromCode(tok.text, col.slice(i + 1).map((w) => w.text).join(" "));
            }
          }
        }
        return;
      }
    }

    // --- continuation line ---
    const lineText = col.map((w) => w.text).join(" ");

    if (noteActive) {
      if (group) group.name = `${group.name} ${lineText}`;
      else sectionNotes[sectionNotes.length - 1] += ` ${lineText}`;
      return;
    }
    if (firstText === "Note:") {
      noteActive = true;
      if (group) group.name = `${group.name} ${lineText}`;
      else sectionNotes.push(lineText);
      return;
    }
    if (group && group.namePending) { appendGroupName(lineText); return; }
    if (!entry) return; // stray title / divider text (e.g. the "Morphology" title)

    const lastSyn = entry.synonyms[entry.synonyms.length - 1];
    if (
      firstText.startsWith("(") ||
      parenUnbalanced(entry.term) ||
      parenUnbalanced(lastSyn)
    ) {
      // A wrapped parenthetical completes the TERM when the term itself has
      // an open paren; otherwise it completes the last synonym (e.g.
      // "Anal intraepithelial neoplasia, grade III" / "(C21.1)").
      if (parenUnbalanced(entry.term)) appendEntryTerm(lineText);
      else if (lastWasSynonym && lastSyn) { entry.synonyms[entry.synonyms.length - 1] = `${lastSyn} ${lineText}`; lastWasSynonym = true; }
      else if (parenUnbalanced(lastSyn)) { entry.synonyms[entry.synonyms.length - 1] = `${lastSyn} ${lineText}`; lastWasSynonym = true; }
      else appendEntryTerm(lineText);
      return;
    }

    const firstChar = firstText[0];
    const isLower = firstChar && firstChar === firstChar.toLowerCase() && firstChar.toLowerCase() !== firstChar.toUpperCase();
    if (isLower) {
      if (lastWasSynonym && lastSyn) {
        entry.synonyms[entry.synonyms.length - 1] = `${lastSyn} ${lineText}`;
      } else {
        appendEntryTerm(lineText);
      }
      return;
    }

    // uppercase: synonym / equivalent term (e.g. "CIN III, NOS (C53._)")
    entry.synonyms.push(lineText);
    lastWasSynonym = true;
  };

  for (let i = startIdx; i <= endIdx; i++) {
    const lines = groupIntoLines(pages[i]);
    const [l, r] = computeMorphCodeX(lines);
    codeXByColumn.left = l ?? codeXByColumn.left;
    codeXByColumn.right = r ?? codeXByColumn.right;

    const leftCol = [];
    const rightCol = [];
    for (const ln of lines) {
      const y = ln[0].y0;
      if (y < CONTENT_Y_MIN || y > CONTENT_Y_MAX) continue;
      const [left, right] = splitColumn(ln);
      if (left.length) leftCol.push(left);
      if (right.length) rightCol.push(right);
    }
    for (const col of leftCol) processColumn(col, "left");
    for (const col of rightCol) processColumn(col, "right");
  }
  finalizeEntry();

  return { entries, sectionNotes, warnings };
}

function computeMorphCodeX(lines) {
  let left = [], right = [];
  for (const ln of lines) {
    const y = ln[0].y0;
    if (y < CONTENT_Y_MIN || y > CONTENT_Y_MAX) continue;
    const [l, r] = splitColumn(ln);
    if (l.length && MORPH_ENTRY.test(l[0].text)) left.push(l[0].x0);
    if (r.length && MORPH_ENTRY.test(r[0].text)) right.push(r[0].x0);
  }
  return [median(left), median(right)];
}

// ---------------------------------------------------------------------------
// Alphabetic index parser
// ---------------------------------------------------------------------------

// Per-column horizontal layout (stable across pp.104-225):
//   left column:  code-x ~62.4,  headword-x ~112.3
//   right column: code-x ~307.6, headword-x ~357.2
// Entry terms sit at headword-x (headword-entry), headword-x+18 (direct
// sub-term), or headword-x+36 (sub-term under a sub-headword). Sub-headwords
// share the +18 depth but carry no code. Continuations are deeper and/or
// start lowercase or "(".
const HEAD_X = { left: 112.3, right: 357.2 };
const DIFF_HEADWORD = 10;  // first-word diff <= this  -> headword level
const DIFF_SUB = 28;       // diff <= this             -> sub-headword / direct-entry level

function parseIndex(pages, range) {
  const [startIdx, endIdx] = range;
  const entries = [];
  const headwords = [];
  const letters = [];
  const warnings = [];
  let sortOrder = 0;
  let currentLetter = null;

  const state = {
    left: { headword: null, subHeadword: null, entry: null, codeX: null },
    right: { headword: null, subHeadword: null, entry: null, codeX: null },
  };

  const ensureHeadword = (name, { continued = false, seeAlso = [], page = null } = {}) => {
    let rec = headwords.find((h) => h.name === name);
    if (!rec) {
      rec = { name, letter: currentLetter, page, continued: false, seeAlso: [], entryCount: 0, subHeadwords: [] };
      headwords.push(rec);
    }
    if (continued) rec.continued = true;
    for (const s of seeAlso) if (!rec.seeAlso.includes(s)) rec.seeAlso.push(s);
    return rec;
  };

  const finalizeEntry = (st) => {
    const e = st.entry;
    if (!e) return;
    e.term = e.term.trim();
    e.obs = /\[obs\]/.test(e.term);
    e.seeAlso = extractSeeAlso(e.term);
    e.siteRestriction = extractSiteRestriction(e.term);
    e.seeSnomed = /SNOMED/.test(e.term);
    st.entry = null;
  };

  const appendContinuation = (st, lineText) => {
    if (st.entry) st.entry.term += ` ${lineText}`;
    else if (st.subHeadword) st.subHeadword.name += ` ${lineText}`;
    else if (st.headword) st.headword.name += ` ${lineText}`;
    // else: orphan divider text — ignore
  };

  const pushEntry = (st, code, term, opts = {}) => {
    const { isHeadwordEntry = false, underSub = false, isDash = false } = opts;
    let headwordName = st.headword ? st.headword.name : null;
    if (isHeadwordEntry) {
      headwordName = cleanName(term);
      ensureHeadword(headwordName, { page: st.page });
    }
    const subName = underSub && st.subHeadword ? st.subHeadword.name : null;
    const rec = {
      sortOrder: sortOrder++,
      page: st.page,
      letter: currentLetter,
      code,
      codeType: code ? (/^C\d{2}\.\d$/.test(code) ? "topography" : "morphology") : null,
      headword: headwordName,
      subHeadword: subName,
      term,
      siteRestriction: null,
      obs: false,
      seeSnomed: isDash,
      seeAlso: [],
      isHeadwordEntry,
    };
    entries.push(rec);
    if (headwordName) {
      const hw = ensureHeadword(headwordName, { page: st.page });
      hw.entryCount += 1;
      if (subName && !hw.subHeadwords.includes(subName)) hw.subHeadwords.push(subName);
    }
    return rec;
  };

  const processColumn = (col, colName, pageNo) => {
    if (!col.length) return;
    const st = state[colName];
    st.page = pageNo;
    const first = col[0];
    const x = first.x0;
    const firstText = first.text;
    const lineText = col.map((w) => w.text).join(" ");

    // 0. divider title on the first index page ("Alphabetic index" /
    //    "NOS - not otherwise specified") — the only no-code lines above y185
    if (pageNo === startIdx + 1 && first.y0 < 185) return;

    // 1. decorative rule made purely of dashes
    if (/^-{4,}$/.test(lineText.replace(/\s+/g, ""))) return;

    // 2. letter header ("A", "B", ...) — single capital letter
    if (col.length === 1 && /^[A-Z]$/.test(firstText)) {
      currentLetter = firstText;
      if (!letters.includes(firstText)) letters.push(firstText);
      finalizeEntry(st);
      st.subHeadword = null;
      return;
    }

    // 3. "-------- term (see SNOMED)" — non-neoplastic / cross-reference rows
    if (/^-{4,}/.test(firstText)) {
      finalizeEntry(st);
      st.subHeadword = null;
      const term = lineText.replace(/^-{4,}\s*/, "").trim();
      const rec = pushEntry(st, null, term, { isDash: true });
      st.entry = rec; // a wrapped "(see SNOMED)" continuation may append
      return;
    }

    // 4. code line (topography C-code or morphology xxxx/x)
    const codeMatch = firstText.match(/^(C\d{2}\.\d|\d{4}\/\d)$/);
    if (codeMatch) {
      const atCodeX = st.codeX === null || Math.abs(x - st.codeX) <= 4;
      if (atCodeX) {
        finalizeEntry(st);
        const termWords = col.slice(1);
        const termText = termWords.map((w) => w.text).join(" ");
        const termX = termWords[0] ? termWords[0].x0 : null;
        const diff = termX === null ? 0 : termX - HEAD_X[colName];
        const isHeadwordEntry = diff <= DIFF_HEADWORD;
        const underSub = diff > DIFF_SUB && !!st.subHeadword;
        if (!underSub && st.subHeadword) st.subHeadword = null; // direct entry closes the sub-section
        const rec = pushEntry(st, codeMatch[1], termText, { isHeadwordEntry, underSub });
        // A headword-entry IS a headword: it becomes the current headword so
        // any deeper sub-terms that follow attach to it (the printed layout
        // prints the code beside the bold headword).
        if (isHeadwordEntry) st.headword = ensureHeadword(rec.headword, { page: pageNo });
        st.entry = rec;
        return;
      }
      // code-like token not at the code-x: wrapped fragment of a term
      appendContinuation(st, lineText);
      return;
    }

    // 5. no-code line. Only the CURRENT ENTRY's term may be mid-paren;
    //    headword names can legitimately have unbalanced parens as printed
    //    (e.g. "Endocrine (topography"), which must not poison the flow.
    const pending = st.entry ? st.entry.term : "";
    const firstChar = firstText[0];
    const isLower = firstChar && firstChar === firstChar.toLowerCase() && firstChar.toLowerCase() !== firstChar.toUpperCase();
    if (
      firstText.startsWith("(") ||
      parenUnbalanced(pending) ||
      isLower ||
      /^(C\d{2}\.\d|\d{4}\/\d)/.test(firstText)
    ) {
      appendContinuation(st, lineText);
      return;
    }

    // uppercase no-code line: headword or sub-headword
    const diff = x - HEAD_X[colName];
    if (diff <= DIFF_HEADWORD) {
      finalizeEntry(st);
      st.subHeadword = null;
      const continued = CONTINUED_RE.test(lineText);
      const seeAlso = extractSeeAlso(lineText);
      const name = lineText.replace(SEE_ALSO_RE, "").replace(CONTINUED_RE, "").trim();
      const rec = ensureHeadword(name, { continued, seeAlso, page: pageNo });
      st.headword = rec;
      return;
    }
    if (diff <= DIFF_SUB) {
      finalizeEntry(st);
      const continued = CONTINUED_RE.test(lineText);
      const name = lineText.replace(CONTINUED_RE, "").trim();
      st.subHeadword = { name, continued };
      return;
    }
    // deeper than a sub-headword: continuation of the current item
    appendContinuation(st, lineText);
  };

  for (let i = startIdx; i <= endIdx; i++) {
    const pageNo = i + 1;
    const lines = groupIntoLines(pages[i]);
    const [l, r] = computeIndexCodeX(lines);
    state.left.codeX = l ?? state.left.codeX;
    state.right.codeX = r ?? state.right.codeX;

    const leftCol = [];
    const rightCol = [];
    for (const ln of lines) {
      const y = ln[0].y0;
      if (y < CONTENT_Y_MIN || y > CONTENT_Y_MAX) continue;
      const [left, right] = splitColumn(ln);
      if (left.length) leftCol.push(left);
      if (right.length) rightCol.push(right);
    }
    for (const col of leftCol) processColumn(col, "left", pageNo);
    for (const col of rightCol) processColumn(col, "right", pageNo);
  }
  finalizeEntry(state.left);
  finalizeEntry(state.right);

  return { entries, headwords, letters, warnings };
}

function computeIndexCodeX(lines) {
  let left = [], right = [];
  for (const ln of lines) {
    const y = ln[0].y0;
    if (y < CONTENT_Y_MIN || y > CONTENT_Y_MAX) continue;
    const [l, r] = splitColumn(ln);
    if (l.length && /^(C\d{2}\.\d|\d{4}\/\d)$/.test(l[0].text)) left.push(l[0].x0);
    if (r.length && /^(C\d{2}\.\d|\d{4}\/\d)$/.test(r[0].text)) right.push(r[0].x0);
  }
  return [median(left), median(right)];
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join(" | ") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const SECTION_OUT = {
  topography: {
    csvHeader: ["code", "term", "group_code", "group_name", "group_note", "synonyms", "sub_site_lead_in", "sub_sites", "sort_order"],
    csvRow: (e) =>
      [e.code, e.term, e.groupCode, e.groupName, e.groupNote, e.synonyms, e.subSiteLeadIn, e.subSites, e.sortOrder]
        .map(csvEscape).join(","),
  },
  morphology: {
    csvHeader: ["sort_order", "code", "behavior", "term", "synonyms", "site_restriction", "obs", "group_code", "group_name"],
    csvRow: (e) =>
      [e.sortOrder, e.code, e.behavior, e.term, e.synonyms, e.siteRestriction, e.obs, e.groupCode, e.groupName]
        .map(csvEscape).join(","),
  },
  index: {
    csvHeader: [
      "sort_order", "page", "letter", "code", "code_type", "headword", "sub_headword",
      "term", "site_restriction", "obs", "see_snomed", "see_also", "is_headword_entry",
    ],
    csvRow: (e) =>
      [e.sortOrder, e.page, e.letter, e.code, e.codeType, e.headword, e.subHeadword, e.term,
        e.siteRestriction, e.obs, e.seeSnomed, e.seeAlso, e.isHeadwordEntry]
        .map(csvEscape).join(","),
  },
};

function writeOutput(opts, result) {
  const { entries } = result;
  const sample = opts.limit > 0 ? "-sample" : "";
  const defaultOut = resolve(__dirname, "output", `icdo3-${opts.section}${sample}.${opts.format}`);
  const outPath = opts.out || defaultOut;
  mkdirSync(dirname(outPath), { recursive: true });

  if (opts.format === "json") {
    const base = {
      source: "ICD-O-3, Third Edition, First Revision (WHO)",
      pdf: opts.pdf,
      section: opts.section,
      generatedAt: new Date().toISOString(),
      count: entries.length,
      warnings: result.warnings || [],
    };
    let doc;
    if (opts.section === "topography") {
      doc = { ...base, sectionNotes: result.sectionNotes, entries };
    } else if (opts.section === "morphology") {
      doc = { ...base, entries };
    } else {
      doc = { ...base, letters: result.letters, headwords: result.headwords, entries };
    }
    writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n", "utf-8");
  } else {
    const meta = SECTION_OUT[opts.section];
    const rows = entries.map(meta.csvRow);
    writeFileSync(outPath, [meta.csvHeader.join(","), ...rows].join("\n") + "\n", "utf-8");
  }
  console.log(`[parse-icdo3] wrote ${entries.length} entries -> ${outPath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!existsSync(opts.pdf)) {
    console.error(`[parse-icdo3] PDF not found: ${opts.pdf}`);
    process.exit(1);
  }

  const xml = extractBboxXml(opts.pdf);
  const pages = parseBbox(xml);
  console.log(`[parse-icdo3] parsed ${pages.length} pages from bbox XML`);

  let result;
  if (opts.section === "topography") {
    const range = findTopographyRange(pages);
    console.log(`[parse-icdo3] topography numerical list: pdf pages ${range[0] + 1}-${range[1] + 1}`);
    result = parseTopography(pages, range);
  } else if (opts.section === "morphology") {
    const range = findMorphologyRange(pages);
    console.log(`[parse-icdo3] morphology numerical list: pdf pages ${range[0] + 1}-${range[1] + 1}`);
    result = parseMorphology(pages, range);
  } else {
    const range = findIndexRange(pages);
    console.log(`[parse-icdo3] alphabetic index: pdf pages ${range[0] + 1}-${range[1] + 1}`);
    result = parseIndex(pages, range);
  }
  console.log(`[parse-icdo3] parsed ${result.entries.length} ${opts.section} entries`);
  if (opts.limit > 0) {
    result.entries = result.entries.slice(0, opts.limit);
    console.log(`[parse-icdo3] sample: emitting first ${opts.limit} entries`);
  }

  writeOutput(opts, result);
}

main();
