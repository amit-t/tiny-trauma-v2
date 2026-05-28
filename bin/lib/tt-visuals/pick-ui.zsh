#!/usr/bin/env zsh
# bin/lib/tt-visuals/pick-ui.zsh — open candidates in Preview, prompt user.

[[ -n "${_TT_PICK_SOURCED:-}" ]] && return 0
typeset -g _TT_PICK_SOURCED=1

# Usage: tt_pick_for_slot <slot> <slot-dir>
# Prints the chosen engine name to stdout, or `__skip__` / `__quit__` /
# `__retry__`. Reads decision from stdin.
tt_pick_for_slot() {
  local slot="$1" slot_dir="$2"
  local -a candidates names
  candidates=("$slot_dir"/*.png(N) "$slot_dir"/*.mp4(N))
  names=()
  local f base eng
  for f in "${candidates[@]}"; do
    base="${f:t}"
    eng="${base%.*}"
    names+=("$eng")
  done

  if (( ${#candidates[@]} == 0 )); then
    print -ru2 -- "pick: no candidates for slot $slot"
    print -r -- "__skip__"
    return 0
  fi

  # Open in Preview/QuickLook. Run in foreground briefly to ensure the
  # subprocess actually starts (and writes any test marker) before we move on,
  # then detach. macOS qlmanage -p backgrounds itself once the window is up.
  qlmanage -p "${candidates[@]}" >/dev/null 2>&1 &
  local ql_pid=$!
  # Give qlmanage a moment to actually exec so it can render (or, in tests,
  # write its marker). Otherwise the immediate kill below can race the exec.
  sleep 0.1 2>/dev/null || true

  print -ru2 -- ""
  print -ru2 -- "▶ picking $slot"
  local -i i=0
  for eng in "${names[@]}"; do
    (( i++ ))
    print -ru2 -- "  [$i] $eng"
  done
  print -ru2 -- "  [r] re-draft and re-render this slot"
  print -ru2 -- "  [s] skip this slot"
  print -ru2 -- "  [q] quit, keep nothing"
  print -ru2 -n -- "  > "

  local choice
  read -r choice

  kill "$ql_pid" 2>/dev/null
  wait "$ql_pid" 2>/dev/null

  case "$choice" in
    r|R) print -r -- "__retry__" ;;
    s|S) print -r -- "__skip__" ;;
    q|Q) print -r -- "__quit__" ;;
    ''|*[!0-9]*) print -ru2 -- "pick: invalid choice '$choice', treating as skip"; print -r -- "__skip__" ;;
    *)
      local -i n="$choice"
      if (( n < 1 || n > ${#names[@]} )); then
        print -ru2 -- "pick: out of range, treating as skip"
        print -r -- "__skip__"
      else
        print -r -- "${names[$n]}"
      fi
      ;;
  esac
}

# Usage: tt_edit_prompt_for_slot <prompts-json-path> <slot>
#
# Opens $EDITOR on a temp file pre-filled with the current prompt text for
# <slot>, then writes the trimmed edited prompt back into prompts.json (the
# `hero` object's `prompt`, or the matching `inline[].prompt`). Returns 0 on
# success even if the user makes no edits (round-trip is byte-stable for the
# unchanged case).
tt_edit_prompt_for_slot() {
  local prompts_json="$1" slot="$2"
  local editor="${EDITOR:-vi}"
  local tmpf
  tmpf=$(mktemp -t tt-edit-prompt-XXXXXX.txt)
  node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const slot = process.argv[2];
    let p = "";
    if (slot === "hero" && j.hero) p = j.hero.prompt || "";
    else {
      const e = (j.inline || []).find(x => x.slot === slot);
      if (e) p = e.prompt || "";
    }
    fs.writeFileSync(process.argv[3], p);
  ' "$prompts_json" "$slot" "$tmpf"
  "$editor" "$tmpf"
  node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const slot = process.argv[2];
    const newPrompt = fs.readFileSync(process.argv[3], "utf8").trim();
    if (slot === "hero" && j.hero) j.hero.prompt = newPrompt;
    else {
      const e = (j.inline || []).find(x => x.slot === slot);
      if (e) e.prompt = newPrompt;
    }
    fs.writeFileSync(process.argv[1], JSON.stringify(j, null, 2));
  ' "$prompts_json" "$slot" "$tmpf"
  rm -f "$tmpf"
}
