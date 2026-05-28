#!/usr/bin/env node
// bin/lib/tt-visuals/build-installed.mjs
//
// Build the installed.json descriptor consumed by rewrite-mdx.mts.
//
// Usage:
//   build-installed.mjs <type> <slug> <picks-json-file> <cand-root> <out-path>
//
// picks-json-file format:
//   { "hero": "gemini", "inline-1": "codex", "inline-2": "gemini" }
//   (engine names — values; slot names — keys)
//
// cand-root is the candidates directory (e.g. /tmp/tt-visuals-<slug>-<pid>),
// inspected so the actual on-disk extension per slot (`.png`, `.gif`, `.mp4`)
// is recorded — that way rewrite-mdx.mts knows whether to emit `<video>` or
// `![]()` for each inline slot.
//
// Output shape:
//   { "type": "...", "slug": "...", "hero": "hero.png",
//     "inline": ["inline-1.png", "inline-2.gif"] }
//
// Hero is always recorded as `hero.png` — for hero mp4, install-winner.zsh
// extracts a poster frame and installs that under `hero.png`, while keeping
// `hero-cover.mp4` alongside it for clients that want motion.

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";

const [, , type, slug, picksFile, candRoot, outPath] = process.argv;
if (!type || !slug || !picksFile || !candRoot || !outPath) {
  process.stderr.write(
    "usage: build-installed.mjs <type> <slug> <picks-file> <cand-root> <out-path>\n",
  );
  process.exit(2);
}

const picks = JSON.parse(readFileSync(picksFile, "utf8"));

// Find the candidate filename for (slot, engine) in candRoot/<slot>/. The
// renderer writes <engine>.<ext> alongside <engine>.meta.json; filter the
// sidecar out before peeking at the extension.
function candExt(slot, engine) {
  const dir = `${candRoot}/${slot}`;
  if (!existsSync(dir)) return "png";
  const hit = readdirSync(dir).find(
    (f) => f.startsWith(`${engine}.`) && !f.endsWith(".meta.json"),
  );
  if (!hit) return "png";
  return hit.split(".").pop();
}

const out = { type, slug };

if (picks.hero) {
  // Hero is always installed as a still image, even when the candidate is mp4
  // (install-winner.zsh extracts a poster frame). Record `hero.png` so the
  // frontmatter heroImage path resolves to the still.
  const heroExt = candExt("hero", picks.hero);
  out.hero = `hero.${heroExt === "mp4" ? "png" : heroExt}`;
}

const inlineKeys = Object.keys(picks)
  .filter((k) => k.startsWith("inline-"))
  .sort((a, b) => {
    const ai = Number(a.split("-")[1]) || 0;
    const bi = Number(b.split("-")[1]) || 0;
    return ai - bi;
  });

if (inlineKeys.length > 0) {
  out.inline = inlineKeys.map((k) => {
    const ext = candExt(k, picks[k]);
    // install-winner.zsh stores inline mp4 candidates as `<slot>.gif` (with
    // `<slot>.mp4` kept alongside). Record `.gif` so rewrite-mdx emits a
    // <video src=".../inline-N.gif"> tag pointing at the deliverable.
    return ext === "mp4" ? `${k}.gif` : `${k}.${ext}`;
  });
}

writeFileSync(outPath, JSON.stringify(out, null, 2));
