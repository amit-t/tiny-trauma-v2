#!/usr/bin/env node
// One-shot seed of content/ from .velite-seed/sample.json. The sample.json is
// produced by running the project's sample-data.ts through node's TS strip
// (see commit message). Run once and then delete this script along with the
// seed folder; the MDX files are authoritative going forward.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const sample = JSON.parse(
  readFileSync(resolve(ROOT, ".velite-seed/sample.json"), "utf8"),
);

const HERO_TINTS = {
  musing: "lavender",
  short: "butter",
  bangal: "peach",
  phones: "slate",
  grief: "sage",
};

function ymd(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

/**
 * Phase-2 hand-written bodies used `[[ … ]]` (no inner keyword) for the
 * handwritten aside and bare `-- end` / `-- fin` for end marks. Velite's
 * MDX pipeline uses the documented spec marks instead: `[[aside]] …`, and
 * the end mark is rendered by the page chrome (not by the prose body).
 */
function convertBody(raw) {
  return (
    raw
      .trim()
      // [[ inner ]] -> [[aside]] inner   (spec marker)
      .replace(/\[\[\s+(.+?)\s+\]\]/g, "[[aside]] $1")
      // strip end-of-essay sentinels — page templates render the end mark
      .replace(/^-- (end|fin)\s*$/gm, "")
      .trim()
  );
}

function writePost(post, kind) {
  const slug = post.slug;
  const tint = post.cardTint ? (HERO_TINTS[post.cardTint] ?? "none") : "none";
  const tags = post.tags
    .map((t) => t.label)
    .filter((label) => label !== "musing" && label !== "short");

  const fm = [
    "---",
    `title: ${JSON.stringify(post.title)}`,
    `dek: ${JSON.stringify(post.dek)}`,
    `type: ${kind}`,
    `publishedAt: ${ymd(post.publishedAt)}`,
    `number: ${post.number}`,
    `tags: [${tags.map((t) => JSON.stringify(t)).join(", ")}]`,
    `featured: ${Boolean(post.featured)}`,
    `heroTint: ${tint}`,
    `status: published`,
    "---",
    "",
    convertBody(post.body),
    "",
  ].join("\n");

  const dir = resolve(ROOT, "content", `${kind}s`);
  const file = resolve(dir, `${slug}.mdx`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, fm, "utf8");
  console.log(`wrote ${file.replace(ROOT + "/", "")}`);
}

for (const m of sample.musings) writePost(m, "musing");
for (const s of sample.shorts) writePost(s, "short");

console.log(`done. ${sample.musings.length} musings + ${sample.shorts.length} shorts.`);
