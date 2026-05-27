#!/usr/bin/env node
// Usage: node merge-overrides.mjs <drafter-json-path> <slot-lines-path>
// Reads drafter JSON from file 1, newline-separated slot-lines from file 2.
// Writes the merged JSON (with .overrides populated from slot lines) to stdout.

import { readFileSync } from "node:fs";

const [, , drafterPath, slotLinesPath] = process.argv;
if (!drafterPath || !slotLinesPath) {
  process.stderr.write("usage: merge-overrides.mjs <drafter-json> <slot-lines>\n");
  process.exit(2);
}
const j = JSON.parse(readFileSync(drafterPath, "utf8"));
const lines = readFileSync(slotLinesPath, "utf8").split("\n").filter(Boolean);
j.overrides = {};
for (const line of lines) {
  const m = line.match(/^(hero(?:-mp4)?|inline-\d+):(?:gif:)?override:(.+)$/);
  if (m) {
    // The renderer (render.zsh) keys overrides by the slot name from the
    // drafter JSON, which always uses `hero` for the hero slot — even when
    // the marker was `[[visual hero mp4: ...]]`. The drafter never emits a
    // `hero-mp4` key; the mp4-ness lives in `kindHints.hero === "video"`
    // added downstream. Normalise here so `hero-mp4:override:...` lands on
    // `overrides.hero` and the author text reaches the renderer instead of
    // being silently dropped.
    const key = m[1] === "hero-mp4" ? "hero" : m[1];
    j.overrides[key] = m[2];
  }
}
process.stdout.write(JSON.stringify(j, null, 2));
