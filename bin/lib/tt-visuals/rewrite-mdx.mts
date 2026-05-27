// bin/lib/tt-visuals/rewrite-mdx.mts
//
// Usage:  pnpm exec tsx bin/lib/tt-visuals/rewrite-mdx.mts <mdx-path> <installed-json-path>
//
// Rewrites frontmatter.heroImage and inline [[visual:]] markers in place.
// On any failure (bad installed.json, validator rejects rewrite), exits
// non-zero and leaves the original mdx untouched. Atomic: writes to a temp
// file and renames on success only.

import { readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";

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
const parsed = matter(raw);
const data = parsed.data;

if (installed.hero) {
  data.heroImage = `/img/${installed.type}/${installed.slug}/${installed.hero}`;
}

let body = parsed.content;
let inlineIdx = 0;
// Marker grammar (mirrors parse-mdx.zsh):
//   [[visual:]]           [[visual: text]]            -> inline image
//   [[visual gif:]]       [[visual gif: text]]        -> inline (M3)
//   [[visual hero:]]      [[visual hero: text]]       -> hero (frontmatter)
//   [[visual hero mp4:]]  [[visual hero mp4: text]]   -> hero mp4 (M3)
//   [[visual skip]]       -> never touched
//
// M2 handles the inline-image branch only; hero markers are removed from body
// text (their effect lives in frontmatter); gif/hero-mp4 markers are removed
// from body (M3 will replace them). Skip is naturally excluded — it has no
// colon, so the regex below skips it.
body = body.replace(
  /\[\[visual( gif| hero mp4| hero)?:([^\]]*)\]\]/g,
  (_match, kindRaw: string | undefined): string => {
    const kind = (kindRaw ?? "").trim();
    if (kind === "hero" || kind === "hero mp4") return "";
    if (kind === "gif") {
      // M3 will wire this; for now, leave a no-op placeholder (delete the
      // marker so the body doesn't render literal brackets).
      return "";
    }
    // plain inline
    inlineIdx++;
    const file = installed.inline?.[inlineIdx - 1];
    if (!file) {
      // No corresponding install — leave marker as-is for the next run.
      return `[[visual:]]`;
    }
    const alt = `inline image ${inlineIdx}`;
    return `![${alt}](/img/${installed.type}/${installed.slug}/${file})`;
  },
);

const out = matter.stringify(body, data);

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
