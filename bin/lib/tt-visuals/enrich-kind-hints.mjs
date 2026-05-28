#!/usr/bin/env node
// Usage: node enrich-kind-hints.mjs <drafter-json-path> <slot-lines-path>
//
// Reads the drafter JSON (file 1) and newline-separated slot lines (file 2,
// in the form parse-mdx/slot-detect emit), enriches the JSON with:
//   - kindHints: { <slot>: "video" }   for gif / hero-mp4 markers
//   - hero.kind = "video"               when kindHints.hero === "video"
//   - inline[i].kind = "video"          when kindHints[slot] === "video"
// Writes the enriched JSON to stdout. Render dispatch (render.zsh) uses
// `kindHints` to set TT_VISUAL_KIND=video and pick a .mp4 extension.

import { readFileSync } from "node:fs";

const [, , drafterPath, slotLinesPath] = process.argv;
if (!drafterPath || !slotLinesPath) {
  process.stderr.write(
    "usage: enrich-kind-hints.mjs <drafter-json> <slot-lines>\n",
  );
  process.exit(2);
}

const j = JSON.parse(readFileSync(drafterPath, "utf8"));
const lines = readFileSync(slotLinesPath, "utf8").split("\n").filter(Boolean);
j.kindHints = {};
for (const line of lines) {
  if (/^hero-mp4(:|$)/.test(line)) {
    j.kindHints.hero = "video";
  } else if (/^inline-(\d+):gif(:|$)/.test(line)) {
    const m = line.match(/^inline-(\d+):gif/);
    if (m) j.kindHints[`inline-${m[1]}`] = "video";
  }
  // plain `hero:` and `inline-N:` lines (no `gif:` / `hero-mp4` prefix) leave
  // kindHints alone — image is the default.
}
if (j.hero && j.kindHints.hero === "video") j.hero.kind = "video";
for (const e of j.inline || []) {
  if (j.kindHints[e.slot] === "video") e.kind = "video";
}
process.stdout.write(JSON.stringify(j, null, 2));
