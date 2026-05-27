#!/usr/bin/env zsh
# bin/lib/tt-visuals/render.zsh — orchestrate (slot × engine) renders.
# M2: sequential, one engine. M3 wraps this in parallel.zsh.

[[ -n "${_TT_RENDER_SOURCED:-}" ]] && return 0
typeset -g _TT_RENDER_SOURCED=1

# Usage: tt__slot_kind <prompts-json> <slot>
# Prints "video" if the slot's payload carries kind=video (gif / hero-mp4),
# otherwise "image". M3 hint, plumbed through from bin/tt-visuals'
# kindHints enrichment of the drafter output.
tt__slot_kind() {
  local prompts_json="$1" slot="$2"
  node -e '
    const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const slot = process.argv[2];
    let kind = "image";
    if (slot === "hero" && j.hero && j.hero.kind === "video") kind = "video";
    else {
      const inl = (j.inline || []).find(e => e.slot === slot);
      if (inl && inl.kind === "video") kind = "video";
    }
    process.stdout.write(kind);
  ' "$prompts_json" "$slot"
}

# Internal: tt__render_pair <engine> <prompts-json> <cand-dir> <slot> <payload>
# Runs a single (slot × engine) pair: applies overrides, writes the prompt
# file, dispatches _engine_run.zsh, writes the meta sidecar. Returns the
# engine's rc.
tt__render_pair() {
  local engine="$1" prompts_json="$2" cand_dir="$3" slot="$4" payload="$5"
  local lib_dir="${${(%):-%x}:A:h}"
  local bin_dir="${lib_dir:h:h}"
  local engine_run="$bin_dir/_engine_run.zsh"
  [[ -x "$engine_run" ]] || engine_run="$(command -v _engine_run.zsh || true)"
  [[ -x "$engine_run" ]] || { print -ru2 -- "render: cannot find _engine_run.zsh"; return 2; }

  local slot_dir="$cand_dir/$slot"
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

  local prompt_file=$(mktemp -t tt-render-prompt-XXXXXX)
  print -r -- "$payload" > "$prompt_file"

  # Dispatch image vs video based on the slot's kind hint in prompts.json.
  local kind ext
  kind=$(tt__slot_kind "$prompts_json" "$slot")
  if [[ "$kind" == "video" ]]; then ext=mp4; else ext=png; fi
  local out_file="$slot_dir/${engine}.${ext}"

  local start_ms=$(python3 -c 'import time; print(int(time.time()*1000))')
  TT_VISUAL_KIND="$kind" "$engine_run" "$engine" "$prompt_file" "$out_file"
  local rc=$?
  local end_ms=$(python3 -c 'import time; print(int(time.time()*1000))')

  local meta="$slot_dir/${engine}.meta.json"
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
  return $rc
}

# Internal: tt__slot_payloads <prompts-json>
# Prints `slot\tpayload-json` per slot the renderer must fill, in source
# order (hero first, then inline-1..N).
tt__slot_payloads() {
  local prompts_json="$1"
  node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const out = [];
    if (j.hero) out.push(["hero", j.hero]);
    for (const e of j.inline || []) out.push([e.slot, e]);
    process.stdout.write(out.map(([s,v])=>`${s}\t${JSON.stringify(v)}`).join("\n"));
  ' "$prompts_json"
}

# Usage: tt_render_slots <engine> <prompts-json-path> <candidates-dir>
# Creates <candidates-dir>/<slot>/<engine>.{png|mp4} for every slot in the JSON.
# The extension is `mp4` for gif / hero-mp4 slots, `png` otherwise.
tt_render_slots() {
  local engine="$1" prompts_json="$2" cand_dir="$3"
  local slots slot payload
  slots=$(tt__slot_payloads "$prompts_json")
  while IFS=$'\t' read -r slot payload; do
    [[ -z "$slot" ]] && continue
    tt__render_pair "$engine" "$prompts_json" "$cand_dir" "$slot" "$payload"
  done <<< "$slots"
  return 0
}

# Usage: tt_render_one_slot <engine> <prompts-json> <cand-dir> <slot>
# Renders ONLY the named slot (no fan-out over all slots in the JSON).
# Returns the engine's rc directly so the caller can detect "every engine
# failed" on retry and surface a useful stderr message.
tt_render_one_slot() {
  local engine="$1" prompts_json="$2" cand_dir="$3" want_slot="$4"
  local slots slot payload
  slots=$(tt__slot_payloads "$prompts_json")
  while IFS=$'\t' read -r slot payload; do
    [[ -z "$slot" ]] && continue
    [[ "$slot" == "$want_slot" ]] || continue
    tt__render_pair "$engine" "$prompts_json" "$cand_dir" "$slot" "$payload"
    return $?
  done <<< "$slots"
  print -ru2 -- "render: slot $want_slot not present in $prompts_json"
  return 4
}

# Usage: tt_render_slots_multi "<engine1> <engine2> ..." <prompts-json> <cand-dir>
#
# Runs tt_render_slots for each engine in parallel under
# tt_parallel_run (caller must have sourced parallel.zsh). Returns 0 if every
# engine returned 0; otherwise the first non-zero rc seen.
#
# Both <prompts-json> and <cand-dir> are passed through `${(q)...}` quoting
# so paths with spaces survive the round-trip through `eval`.
tt_render_slots_multi() {
  local engines_str="$1" prompts_json="$2" cand_dir="$3"
  local -a engines; engines=(${=engines_str})
  local -a jobs
  jobs=()
  local e q_prompts q_cand
  q_prompts=${(q)prompts_json}
  q_cand=${(q)cand_dir}
  for e in "${engines[@]}"; do
    jobs+=("tt_render_slots ${(q)e} $q_prompts $q_cand >/dev/null 2>&1")
  done
  tt_parallel_run "${TT_VISUAL_MAX_PARALLEL:-4}" "${jobs[@]}"
}
