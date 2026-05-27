#!/usr/bin/env zsh
# bin/_engine_run.zsh — render one (engine, prompt) → one output file.
# Internal helper. M2 implements only the gemini branch; codex/devin
# branches land in M3.
#
# Usage:
#   _engine_run.zsh <engine> <prompt-json-file> <output-path>
# Prompt JSON shape:
#   { "prompt": "...", "negative": "...", "aspect": "16:9", "tint": "sage" }

set -u
if (( $# != 3 )); then
  print -ru2 -- "usage: _engine_run.zsh <engine> <prompt-file> <output>"
  exit 2
fi
engine="$1" prompt_file="$2" out="$3"

read_field() {
  local field="$1"
  node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    process.stdout.write(j[process.argv[2]] ?? "");
  ' "$prompt_file" "$field"
}

case "$engine" in
  gemini)
    aspect=$(read_field aspect)
    prompt=$(read_field prompt)
    negative=$(read_field negative)
    pf=$(mktemp -t tt-gemini-prompt-XXXXXX)
    {
      print -r -- "$prompt"
      print -r -- ""
      print -r -- "Negative: $negative"
    } > "$pf"
    gemini image generate \
      --model "${TT_GEMINI_IMAGE_MODEL:-imagen-4-ultra}" \
      --prompt-file "$pf" \
      --output "$out" \
      --aspect "$aspect"
    rc=$?
    rm -f "$pf"
    exit $rc
    ;;
  codex|devin)
    print -ru2 -- "_engine_run: $engine not implemented in this build (M3)"
    exit 2
    ;;
  claude)
    print -ru2 -- "_engine_run: claude has no image gen"
    exit 2
    ;;
  *)
    print -ru2 -- "_engine_run: unknown engine: $engine"
    exit 2
    ;;
esac
