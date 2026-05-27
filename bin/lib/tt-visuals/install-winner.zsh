#!/usr/bin/env zsh
# bin/lib/tt-visuals/install-winner.zsh — copy chosen candidate to its
# canonical path; move losers to .candidates/; back up any existing file.

[[ -n "${_TT_INSTALL_SOURCED:-}" ]] && return 0
typeset -g _TT_INSTALL_SOURCED=1

# Usage: tt_install_winner <slot> <engine> <slot-cand-dir> <asset-dir> <force>
#   slot          e.g. hero, inline-1
#   engine        winning engine (filename basename)
#   slot-cand-dir absolute path to the slot's candidate directory
#   asset-dir     public/img/<type>/<slug>
#   force         1 = backup-then-overwrite, 0 = abort if target exists
tt_install_winner() {
  setopt local_options nullglob
  local slot="$1" engine="$2" cand_dir="$3" asset_dir="$4" force="$5"
  local ext src target
  # Pick extension from the winning candidate file (matches *.png|*.mp4|*.gif).
  local -a winner_files
  winner_files=("$cand_dir/${engine}".png "$cand_dir/${engine}".mp4 "$cand_dir/${engine}".gif)
  src=""
  local f
  for f in "${winner_files[@]}"; do
    [[ -f "$f" ]] && { src="$f"; break; }
  done
  [[ -n "$src" ]] || { print -ru2 -- "install: missing winner $cand_dir/${engine}.*"; return 1; }
  ext="${src##*.}"
  target="$asset_dir/${slot}.${ext}"

  mkdir -p "$asset_dir"
  if [[ -e "$target" ]]; then
    if (( force )); then
      local ts=$(date +%Y%m%d-%H%M%S)
      mv "$target" "$asset_dir/${slot}.bak-${ts}.${ext}"
    else
      print -ru2 -- "install: $target exists (use --force)"; return 1
    fi
  fi
  cp "$src" "$target"

  # Move losers to .candidates/<slot>/
  local losers_dir="$asset_dir/.candidates/${slot}"
  mkdir -p "$losers_dir"
  local base
  for f in "$cand_dir"/*; do
    [[ -f "$f" ]] || continue
    base="${f:t}"
    [[ "$base" == "${engine}.${ext}" ]] && continue
    [[ "$base" == "${engine}.meta.json" ]] && continue
    cp "$f" "$losers_dir/$base"
  done
  return 0
}
