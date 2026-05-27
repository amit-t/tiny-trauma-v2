#!/usr/bin/env node
// bin/lib/tt-visuals/build-installed.mjs
//
// Build the installed.json descriptor consumed by rewrite-mdx.mts.
//
// Usage:
//   build-installed.mjs <type> <slug> <picks-json-file> <out-path>
//
// picks-json-file format:
//   { "hero": "gemini", "inline-1": "codex", "inline-2": "gemini" }
//   (engine names — values; slot names — keys)
//
// Output shape (matches what rewrite-mdx.mts reads):
//   { "type": "...", "slug": "...", "hero": "hero.png",
//     "inline": ["inline-1.png", "inline-2.png"] }
//
// M2: every slot is assumed to be `.png`. M3 will pass extension hints for
// gif/mp4 slots.

import { readFileSync, writeFileSync } from "node:fs";

const [, , type, slug, picksFile, outPath] = process.argv;
if (!type || !slug || !picksFile || !outPath) {
  process.stderr.write(
    "usage: build-installed.mjs <type> <slug> <picks-file> <out-path>\n",
  );
  process.exit(2);
}

const picks = JSON.parse(readFileSync(picksFile, "utf8"));

const out = { type, slug };
if (picks.hero) out.hero = "hero.png";

const inlineKeys = Object.keys(picks)
  .filter((k) => k.startsWith("inline-"))
  .sort((a, b) => {
    const ai = Number(a.split("-")[1]) || 0;
    const bi = Number(b.split("-")[1]) || 0;
    return ai - bi;
  });

if (inlineKeys.length > 0) {
  out.inline = inlineKeys.map((k) => `${k}.png`);
}

writeFileSync(outPath, JSON.stringify(out, null, 2));
