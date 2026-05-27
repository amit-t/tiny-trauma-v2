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
