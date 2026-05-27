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
  if (m) j.overrides[m[1]] = m[2];
}
process.stdout.write(JSON.stringify(j, null, 2));
