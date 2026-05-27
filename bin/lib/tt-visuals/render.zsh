#!/usr/bin/env zsh
# bin/lib/tt-visuals/render.zsh — orchestrate (slot × engine) renders.
# M2: sequential, one engine. M3 wraps this in parallel.zsh.

[[ -n "${_TT_RENDER_SOURCED:-}" ]] && return 0
typeset -g _TT_RENDER_SOURCED=1

# Usage: tt_render_slots <engine> <prompts-json-path> <candidates-dir>
# Creates <candidates-dir>/<slot>/<engine>.png for every slot in the JSON.
tt_render_slots() {
  local engine="$1" prompts_json="$2" cand_dir="$3"
  # ${(%):-%x} inside a function expands to *this* file's path
  # (bin/lib/tt-visuals/render.zsh). Walk up three :h to bin/, then into
  # _engine_run.zsh. (Plan's example had one fewer :h and produced bin/bin/.)
  local lib_dir="${${(%):-%x}:A:h}"
  local bin_dir="${lib_dir:h:h}"
  local engine_run="$bin_dir/_engine_run.zsh"
  [[ -x "$engine_run" ]] || engine_run="$(command -v _engine_run.zsh || true)"
  [[ -x "$engine_run" ]] || { print -ru2 -- "render: cannot find _engine_run.zsh"; return 2; }

  # Iterate slots via node — easier than parsing JSON in zsh.
  local slots
  slots=$(node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const out = [];
    if (j.hero) out.push(["hero", j.hero]);
    for (const e of j.inline || []) out.push([e.slot, e]);
    process.stdout.write(out.map(([s,v])=>`${s}\t${JSON.stringify(v)}`).join("\n"));
  ' "$prompts_json")

  local line slot payload slot_dir prompt_file out_file meta start_ms end_ms rc
  while IFS=$'\t' read -r slot payload; do
    [[ -z "$slot" ]] && continue
    slot_dir="$cand_dir/$slot"
    mkdir -p "$slot_dir"

    # Apply overrides from .prompts.json if present.
    payload=$(node -e '
      const fs = require("fs");
      const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const slot = process.argv[2];
      const payload = JSON.parse(process.argv[3]);
      if (j.overrides && j.overrides[slot]) payload.prompt = j.overrides[slot];
      process.stdout.write(JSON.stringify(payload));
    ' "$prompts_json" "$slot" "$payload")

    prompt_file=$(mktemp -t tt-render-prompt-XXXXXX)
    print -r -- "$payload" > "$prompt_file"
    out_file="$slot_dir/${engine}.png"

    start_ms=$(python3 -c 'import time; print(int(time.time()*1000))')
    "$engine_run" "$engine" "$prompt_file" "$out_file"
    rc=$?
    end_ms=$(python3 -c 'import time; print(int(time.time()*1000))')

    meta="$slot_dir/${engine}.meta.json"
    node -e '
      const fs = require("fs");
      const m = {
        engine: process.argv[1],
        rc: Number(process.argv[2]),
        latency_ms: Number(process.argv[3]) - Number(process.argv[4]),
        prompt: JSON.parse(process.argv[5]).prompt,
      };
      fs.writeFileSync(process.argv[6], JSON.stringify(m, null, 2));
    ' "$engine" "$rc" "$end_ms" "$start_ms" "$payload" "$meta"

    rm -f "$prompt_file"
    (( rc == 0 )) || print -ru2 -- "render: ${slot}×${engine} failed (rc=$rc)"
  done <<< "$slots"

  return 0
}
