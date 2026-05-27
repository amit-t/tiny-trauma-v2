#!/usr/bin/env zsh
# bin/lib/tt-visuals/slot-detect.zsh — turn marker output into the list of
# slots the renderer must fill, with per-slot status (empty | override:<text>).
# Sourced, not executed. Requires parse-mdx.zsh to be sourced first.

[[ -n "${_TT_SLOT_DETECT_SOURCED:-}" ]] && return 0
typeset -g _TT_SLOT_DETECT_SOURCED=1

# Usage: tt_detect_slots <mdx-path>
# Prints one line per slot the renderer must produce, e.g.
#   hero:empty
#   hero:override:<text>
#   inline-1:empty
#   inline-2:override:<text>
#
# Rules:
#   - hero is emitted iff frontmatter.heroImage is absent OR a hero/hero-mp4
#     marker is present.
#   - inline slots are numbered 1..N over inline + gif markers in source order.
#   - skip markers contribute nothing.
tt_detect_slots() {
  local mdx_path="$1"
  local hero_image
  hero_image=$(tt_parse_frontmatter_field "$mdx_path" heroImage)

  local hero_marker=""
  local -a inline_lines
  inline_lines=()
  local line
  while IFS= read -r line; do
    case "$line" in
      hero:empty|hero:override:*)
        hero_marker="$line"
        ;;
      hero-mp4:empty)
        hero_marker="hero-mp4:empty"
        ;;
      hero-mp4:override:*)
        hero_marker="hero-mp4:${line#hero-mp4:}"
        ;;
      inline:*|gif:*)
        inline_lines+=("$line")
        ;;
      skip)
        ;;
    esac
  done < <(tt_parse_markers "$mdx_path")

  # hero emission
  if [[ -n "$hero_marker" ]]; then
    print -r -- "$hero_marker"
  elif [[ -z "$hero_image" ]]; then
    print -r -- "hero:empty"
  fi

  # inline numbering
  local -i i=0
  for line in "${inline_lines[@]}"; do
    (( i++ ))
    case "$line" in
      inline:empty)            print -r -- "inline-${i}:empty" ;;
      inline:override:*)       print -r -- "inline-${i}:override:${line#inline:override:}" ;;
      gif:empty)               print -r -- "inline-${i}:gif:empty" ;;
      gif:override:*)          print -r -- "inline-${i}:gif:override:${line#gif:override:}" ;;
    esac
  done
}
