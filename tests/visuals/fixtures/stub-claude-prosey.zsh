#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-claude-prosey.zsh — fake `claude` binary that
# wraps the JSON in prose preamble + postscript (mimics real claude's
# tendency to add commentary despite the strict-JSON instruction).
# Used to assert the drafter's brace-matching extractor strips the prose
# and produces a clean .prompts.json.
#
# Invocation contract (matches real claude CLI):
#   claude -p < <prompt-file>

set -u

while (( $# > 0 )); do
  case "$1" in
    -p|--print) shift ;;
    *)          shift ;;
  esac
done

prompt=$(cat)
slots_json=$(print -r -- "$prompt" | grep '^SLOTS_JSON: ' | head -1 | sed 's/^SLOTS_JSON: //')

# Build valid JSON, then sandwich it with prose.
json=$(node -e '
const slots = JSON.parse(process.argv[1] || "[]");
const out = { hero: null, inline: [] };
for (const s of slots) {
  const entry = {
    prompt: "a hand-drawn editorial illustration",
    negative: "no faces",
    aspect: s === "hero" ? "16:9" : "4:3",
    tint: "sage",
  };
  if (s === "hero") out.hero = entry;
  else out.inline.push({ slot: s, ...entry });
}
process.stdout.write(JSON.stringify(out, null, 2));
' "$slots_json")

cat <<EOF
Operating under the drafter contract. Here is the draft for sage:

$json

Note: the [[visual skip]] marker is correctly absent — not in SLOTS_JSON.
EOF
