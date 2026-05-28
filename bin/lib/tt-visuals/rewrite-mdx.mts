// bin/lib/tt-visuals/rewrite-mdx.mts
//
// Usage:  pnpm exec tsx bin/lib/tt-visuals/rewrite-mdx.mts <mdx-path> <installed-json-path>
//
// Rewrites frontmatter.heroImage and inline [[visual:]] markers in place.
// On any failure (bad installed.json, validator rejects rewrite), exits
// non-zero and leaves the original mdx untouched. Atomic: writes to a temp
// file and renames on success only.
//
// Why surgical patching, not gray-matter round-trip?
// `matter.stringify` reformats YAML on every write:
//   - `publishedAt: 2026-05-01` becomes `publishedAt: 2026-05-01T00:00:00.000Z`
//   - `title: "x"` loses its quote style and becomes `title: x`
//   - new keys get appended at the end rather than inserted in author order
// That noise pollutes every diff a tt-visuals run produces. Instead, we treat
// the frontmatter block as text, surgically replace or append the single line
// we care about (`heroImage:`), and leave every other byte untouched. The
// validator step still parses with gray-matter (read-only), so its
// Date-coercion behaviour is unchanged.

import { readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";

const [, , mdxPath, installedPath] = process.argv;
if (!mdxPath || !installedPath) {
  process.stderr.write("usage: tsx rewrite-mdx.mts <mdx> <installed.json>\n");
  process.exit(2);
}

type Installed = {
  type: string;
  slug: string;
  hero?: string;
  inline?: string[];
};

let installed: Installed;
try {
  installed = JSON.parse(readFileSync(installedPath, "utf8")) as Installed;
} catch (e) {
  process.stderr.write(`bad installed.json: ${(e as Error).message}\n`);
  process.exit(5);
}

const raw = readFileSync(mdxPath, "utf8");

// --- split frontmatter / body as text -------------------------------------
// Frontmatter must start with `---` on the very first line and close with a
// second `---` at the start of a line. We find both delimiters by index so we
// can reassemble the file byte-for-byte (preserving trailing newline, line
// endings, and every key the author wrote).
function splitFrontmatter(src: string): {
  open: string;
  fm: string;
  close: string;
  body: string;
} | null {
  if (!src.startsWith("---")) return null;
  // first delimiter occupies line 1; find its newline
  const firstNl = src.indexOf("\n");
  if (firstNl < 0) return null;
  // closing delimiter: next "\n---" followed by newline-or-EOF
  const closeRe = /\n---[ \t]*(?:\r?\n|$)/;
  const m = closeRe.exec(src.slice(firstNl));
  if (!m) return null;
  const closeStart = firstNl + m.index + 1; // skip the leading \n
  const closeEnd = firstNl + m.index + m[0].length;
  return {
    open: src.slice(0, firstNl + 1), // "---\n"
    fm: src.slice(firstNl + 1, closeStart), // everything between the delimiters
    close: src.slice(closeStart, closeEnd), // "---\n" (or "---" at EOF)
    body: src.slice(closeEnd),
  };
}

const split = splitFrontmatter(raw);
if (!split) {
  process.stderr.write(
    `rewrite-mdx: ${mdxPath} has no parseable frontmatter block\n`,
  );
  process.exit(5);
}

// --- patch frontmatter text -----------------------------------------------
// If heroImage already exists, replace its value line (preserving whatever
// quote style the author used by leaving the colon-space prefix in place and
// emitting the new value unquoted — schema accepts either form). Otherwise
// append a single `heroImage: <value>` line at the end of the block, so
// existing keys stay in author-defined order.
let patchedFm = split.fm;
if (installed.hero) {
  const newValue = `/img/${installed.type}/${installed.slug}/${installed.hero}`;
  // Match a top-level heroImage key: start-of-line, optional whitespace
  // (we expect none in our schema, but tolerate), `heroImage:`, then the
  // rest of the line.
  const existingRe = /^([ \t]*heroImage:)[^\n]*\n/m;
  if (existingRe.test(patchedFm)) {
    patchedFm = patchedFm.replace(existingRe, `$1 ${newValue}\n`);
  } else {
    // Append before closing delimiter. split.fm always ends with "\n" because
    // we sliced up to the start of "\n---". Just append.
    if (!patchedFm.endsWith("\n")) patchedFm += "\n";
    patchedFm += `heroImage: ${newValue}\n`;
  }
}

// --- patch body ------------------------------------------------------------
let body = split.body;
let inlineIdx = 0;
// Marker grammar (mirrors parse-mdx.zsh):
//   [[visual:]]           [[visual: text]]            -> inline image (.png)
//   [[visual gif:]]       [[visual gif: text]]        -> inline video (.gif|.mp4)
//   [[visual hero:]]      [[visual hero: text]]       -> hero still (frontmatter)
//   [[visual hero mp4:]]  [[visual hero mp4: text]]   -> hero mp4 + still poster
//   [[visual skip]]       -> never touched (no colon)
//
// Inline image  → ![alt](/img/...png)
// Inline gif/mp4 → <video src="/img/...{gif|mp4}" autoplay loop muted playsinline ...></video>
//   `<video>` is NOT a void element in HTML5 — the `/>` self-closing JSX form is
//   ignored by HTML parsers, which then nest the next sibling element inside
//   <video>. Velite's mdx pipeline treats body content as HTML, so we emit an
//   explicit close tag and lowercase HTML attribute names (autoplay /
//   playsinline) rather than the JSX-camelCase forms.
// Hero markers (still or mp4) are removed from body — their effect lives in
// frontmatter (`heroImage`, and for hero mp4 a `hero-cover.mp4` sibling).
body = body.replace(
  /\[\[visual( gif| hero mp4| hero)?:([^\]]*)\]\]/g,
  (match, kindRaw: string | undefined): string => {
    const kind = (kindRaw ?? "").trim();
    if (kind === "hero" || kind === "hero mp4") return "";
    // both plain inline and gif consume an inline slot index, in source order.
    inlineIdx++;
    const file = installed.inline?.[inlineIdx - 1];
    if (!file) {
      // Under partial-install (some slots skipped), preserve the marker so a
      // subsequent run can fill it. Choose the source-form of the marker so we
      // don't lose author intent (e.g. `gif:` stays `gif:`).
      return match;
    }
    const alt = `inline visual ${inlineIdx}`;
    const src = `/img/${installed.type}/${installed.slug}/${file}`;
    if (file.endsWith(".gif") || file.endsWith(".mp4")) {
      return `<video src="${src}" autoplay loop muted playsinline aria-label="${alt}"></video>`;
    }
    return `![${alt}](${src})`;
  },
);

// --- reassemble & validate -------------------------------------------------
const out = split.open + patchedFm + split.close + body;

const tmp = `${mdxPath}.tmp`;
writeFileSync(tmp, out, "utf8");

// Validate via the standalone validator before swapping into place.
try {
  execFileSync(
    "pnpm",
    ["exec", "tsx", "lib/mdx/validate-mdx.mts", tmp],
    { stdio: "pipe" },
  );
} catch (e) {
  try {
    unlinkSync(tmp);
  } catch {}
  process.stderr.write(`rewrite-mdx: validation failed; original untouched\n`);
  process.stderr.write(`${(e as Error).message}\n`);
  process.exit(5);
}
renameSync(tmp, mdxPath);
process.exit(0);
