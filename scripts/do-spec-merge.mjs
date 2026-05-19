#!/usr/bin/env node
// Merge the repo's `.do/app.yaml` with the live DO Apps spec so that
// every `type: SECRET` env that has no value in the repo inherits the
// live ciphertext (`EV[...]`). Without this, applying the repo spec
// would silently blank every secret — DO doesn't preserve secrets when
// a SECRET key is present without a value field.
//
// Usage:
//   node scripts/do-spec-merge.mjs <path-to-repo-spec> <path-to-live-spec>
// Prints the merged YAML on stdout, ready to feed back into
// `doctl apps update --spec -`.

import { readFileSync } from "node:fs";

const [, , repoPath, livePath] = process.argv;
if (!repoPath || !livePath) {
  console.error("usage: do-spec-merge.mjs <repo-spec> <live-spec>");
  process.exit(2);
}

const repoSrc = readFileSync(repoPath, "utf8");
const liveSrc = readFileSync(livePath, "utf8");

// Pull every `EV[1:nonce:ciphertext]` value out of the live spec keyed
// by env-key name. Our spec doesn't reuse the same key at both app and
// component scope, so a flat key-only map is unambiguous; if that ever
// changes, switch this to a structural parser.
function indexLiveSecrets(yaml) {
  const lines = yaml.split("\n");
  const map = new Map();
  for (let i = 0; i < lines.length; i++) {
    const keyMatch = lines[i].match(/^\s*-?\s*key:\s*([A-Z0-9_]+)\s*$/);
    if (!keyMatch) continue;
    const key = keyMatch[1];
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const v = lines[j].match(/^\s*value:\s*(EV\[[^\]]+\])\s*$/);
      if (v) {
        map.set(key, v[1]);
        break;
      }
      if (lines[j].match(/^\s*-?\s*key:/)) break;
    }
  }
  return map;
}

function rewriteRepo(repoYaml, secrets) {
  const lines = repoYaml.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    out.push(line);

    const keyMatch = line.match(/^(\s*-?\s*)key:\s*([A-Z0-9_]+)\s*$/);
    if (!keyMatch) continue;

    let hasValue = false;
    let isSecret = false;
    let valueIndent = "";
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j].match(/^\s*value:/)) hasValue = true;
      if (lines[j].match(/^\s*type:\s*SECRET\s*$/)) {
        isSecret = true;
        valueIndent = lines[j].match(/^(\s*)/)[1];
      }
      if (lines[j].match(/^\s*-?\s*key:/)) break;
    }
    if (!isSecret || hasValue) continue;

    const ev = secrets.get(keyMatch[2]);
    if (!ev) continue;
    out.push(`${valueIndent}value: ${ev}`);
  }
  return out.join("\n");
}

const secrets = indexLiveSecrets(liveSrc);
const merged = rewriteRepo(repoSrc, secrets);
process.stdout.write(merged);
