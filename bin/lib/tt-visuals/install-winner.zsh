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

  mkdir -p "$asset_dir"

  # Hero mp4 special-case: install both `hero-cover.mp4` (motion) and a
  # `hero.png` poster frame (still used by frontmatter heroImage). Other
  # slots fall through to the generic <slot>.<ext> install below.
  if [[ "$slot" == "hero" && "$ext" == "mp4" ]]; then
    local cover_target="$asset_dir/hero-cover.mp4"
    local poster_target="$asset_dir/hero.png"
    if [[ -e "$cover_target" || -e "$poster_target" ]]; then
      if (( force )); then
        local ts=$(date +%Y%m%d-%H%M%S)
        [[ -e "$cover_target" ]] && mv "$cover_target" "$asset_dir/hero-cover.bak-${ts}.mp4"
        [[ -e "$poster_target" ]] && mv "$poster_target" "$asset_dir/hero.bak-${ts}.png"
      else
        print -ru2 -- "install: hero-cover.mp4 or hero.png exists (use --force)"; return 1
      fi
    fi
    cp "$src" "$cover_target"
    source "${REPO_ROOT:-${${(%):-%x}:A:h:h:h}}/bin/lib/tt-visuals/gif-post.zsh"
    tt_extract_poster "$src" "$poster_target" >/dev/null 2>&1 \
      || { print -ru2 -- "install: failed to extract poster frame from $src"; return 1; }

    # Move losers to .candidates/<slot>/ (same as generic path).
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
  fi

  # Inline gif special-case: deliver as .gif (web-friendly autoplay everywhere)
  # alongside the source .mp4. The .gif drives the inline marker; the .mp4 is
  # kept for re-conversion or higher-quality clients.
  if [[ "$slot" == inline-* && "$ext" == "mp4" ]]; then
    local gif_target="$asset_dir/${slot}.gif"
    local mp4_target="$asset_dir/${slot}.mp4"
    if [[ -e "$gif_target" || -e "$mp4_target" ]]; then
      if (( force )); then
        local ts=$(date +%Y%m%d-%H%M%S)
        [[ -e "$gif_target" ]] && mv "$gif_target" "$asset_dir/${slot}.bak-${ts}.gif"
        [[ -e "$mp4_target" ]] && mv "$mp4_target" "$asset_dir/${slot}.bak-${ts}.mp4"
      else
        print -ru2 -- "install: ${slot}.gif or ${slot}.mp4 exists (use --force)"; return 1
      fi
    fi
    cp "$src" "$mp4_target"
    source "${REPO_ROOT:-${${(%):-%x}:A:h:h:h}}/bin/lib/tt-visuals/gif-post.zsh"
    tt_mp4_to_gif "$src" "$gif_target" >/dev/null 2>&1 \
      || { print -ru2 -- "install: failed to convert $src to gif"; return 1; }

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
  fi

  target="$asset_dir/${slot}.${ext}"
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
