#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-claude.zsh — fake `claude` binary for unit
# tests of the drafter. Reads the prompt from STDIN (matches real claude
# CLI semantics: `-p`/`--print` is a flag, prompt arrives via stdin or as
# a positional arg) and emits valid drafter JSON.
#
# Invocation contract (matches what draft.zsh calls):
#   claude -p < <prompt-file>
# Prints JSON to stdout. Slot list is detected by scanning the stdin
# content for the line "SLOTS_JSON: <json>".

set -u

# Discard the `-p` / `--print` flag if present; real claude accepts it.
while (( $# > 0 )); do
  case "$1" in
    -p|--print) shift ;;
    *)          shift ;;
  esac
done

prompt=$(cat)
slots_json=$(print -r -- "$prompt" | grep '^SLOTS_JSON: ' | head -1 | sed 's/^SLOTS_JSON: //')

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
