#!/usr/bin/env zsh
# bin/_engine_run.zsh — render one (engine, prompt) → one output file.
# Internal helper. M2 implemented the gemini branch only; M3 adds codex,
# devin, and the `TT_VISUAL_KIND=video` dispatch for gif / hero-mp4 slots.
#
# Usage:
#   _engine_run.zsh <engine> <prompt-json-file> <output-path>
# Prompt JSON shape:
#   { "prompt": "...", "negative": "...", "aspect": "16:9", "tint": "sage" }
# Optional env:
#   TT_VISUAL_KIND=image|video   (default image)

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

# Defensive post-check: some CLIs return exit 0 even when no output was
# written (rate-limit edge cases, silent content-policy filters). Caller
# treats a missing/empty output as render failure so the picker never
# selects a phantom candidate.
_check_out() {
  local kind="$1" rc="$2"
  if (( rc == 0 )) && [[ ! -s "$out" ]]; then
    print -ru2 -- "_engine_run: $kind exited 0 but produced no output at $out"
    return 1
  fi
  return $rc
}

typeset kind="${TT_VISUAL_KIND:-image}"

case "$engine" in
  gemini)
    aspect=$(read_field aspect); prompt=$(read_field prompt); negative=$(read_field negative)
    pf=$(mktemp -t tt-gemini-prompt-XXXXXX)
    { print -r -- "$prompt"; print -r -- ""; print -r -- "Negative: $negative"; } > "$pf"
    if [[ "$kind" == "video" ]]; then
      gemini video generate --model "${TT_GEMINI_VIDEO_MODEL:-veo-3}" --prompt-file "$pf" --output "$out" --duration 3 --aspect "$aspect"
    else
      gemini image generate --model "${TT_GEMINI_IMAGE_MODEL:-imagen-4-ultra}" --prompt-file "$pf" --output "$out" --aspect "$aspect"
    fi
    rc=$?; rm -f "$pf"
    _check_out gemini $rc; exit $?
    ;;

  codex)
    aspect=$(read_field aspect); prompt=$(read_field prompt); negative=$(read_field negative)
    # Map aspect → pixel size for codex (closest gpt-image-1 / sora-2 sizes).
    case "$aspect" in
      16:9) size="1792x1024" ;;
      4:3)  size="1408x1056" ;;
      1:1)  size="1024x1024" ;;
      4:5)  size="1024x1280" ;;
      *)    size="1024x1024" ;;
    esac
    pf=$(mktemp -t tt-codex-prompt-XXXXXX)
    { print -r -- "$prompt"; print -r -- ""; print -r -- "Negative: $negative"; } > "$pf"
    if [[ "$kind" == "video" ]]; then
      codex video generate --model "${TT_CODEX_VIDEO_MODEL:-sora-2}" --prompt-file "$pf" --output "$out" --duration 3 --size "$size"
    else
      codex image generate --model "${TT_CODEX_IMAGE_MODEL:-gpt-image-1}" --prompt-file "$pf" --output "$out" --size "$size"
    fi
    rc=$?; rm -f "$pf"
    _check_out codex $rc; exit $?
    ;;

  devin)
    prompt=$(read_field prompt)
    pf=$(mktemp -t tt-devin-prompt-XXXXXX)
    print -r -- "$prompt" > "$pf"
    if [[ "$kind" == "video" ]]; then
      devin run --task "generate 3s video: $(cat "$pf")" --output "$out"
    else
      devin run --task "generate image: $(cat "$pf")" --output "$out"
    fi
    rc=$?; rm -f "$pf"
    _check_out devin $rc; exit $?
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
