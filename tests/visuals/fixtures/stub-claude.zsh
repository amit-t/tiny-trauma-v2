#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-claude.zsh — fake `claude` binary for unit
# tests of the drafter. Reads the slot list from the prompt context and
# emits valid drafter JSON.
#
# Invocation contract (matches what drafter.zsh will call):
#   stub-claude.zsh -p <prompt-file>
# Prints JSON to stdout. Slot list is detected by scanning the prompt
# file for the line "SLOTS_JSON: <json>".

set -u
prompt_file=""
while (( $# > 0 )); do
  case "$1" in
    -p) prompt_file="$2"; shift 2 ;;
    *)  shift ;;
  esac
done

slots_json=$(grep '^SLOTS_JSON: ' "$prompt_file" | head -1 | sed 's/^SLOTS_JSON: //')

# Emit a minimal valid response based on the slot list.
node -e '
const slots = JSON.parse(process.argv[1] || "[]");
const out = { hero: null, inline: [] };
for (const s of slots) {
  const entry = {
    prompt: "a hand-drawn editorial illustration of an object on a sill, sage cast",
    negative: "no faces, no people centered, no text, no logos, no watermark, no photoreal, no 3D render, no anime, no glossy",
    aspect: s === "hero" ? "16:9" : "4:3",
    tint: "sage",
  };
  if (s === "hero") out.hero = entry;
  else out.inline.push({ slot: s, ...entry });
}
process.stdout.write(JSON.stringify(out));
' "$slots_json"
