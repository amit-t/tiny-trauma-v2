#!/usr/bin/env zsh
# bin/lib/tt-visuals/social-crops.zsh — derive 1x1, 4x5, 16x9 crops from hero.

[[ -n "${_TT_SOCIAL_CROPS_SOURCED:-}" ]] && return 0
typeset -g _TT_SOCIAL_CROPS_SOURCED=1

# Usage: tt_make_social_crops <hero-path> <out-dir>
tt_make_social_crops() {
  local hero="$1" out="$2"
  [[ -f "$hero" ]] || { print -ru2 -- "social-crops: missing $hero"; return 1; }
  mkdir -p "$out"
  # 1:1 — square from center, max size = min(iw,ih).
  ffmpeg -y -i "$hero" -vf "crop=min(iw\\,ih):min(iw\\,ih)" "$out/social-1x1.png" -loglevel error
  # 4:5 — portrait (Instagram feed). Cap width by ih*4/5 so height fits within
  # source dimensions even for landscape sources like 16:9.
  ffmpeg -y -i "$hero" -vf "crop=min(iw\\,ih*4/5):min(iw\\,ih*4/5)*5/4" "$out/social-4x5.png" -loglevel error
  # 16:9 — landscape. Cap height by iw*9/16 so it fits any source.
  ffmpeg -y -i "$hero" -vf "crop=min(iw\\,ih*16/9):min(iw\\,ih*16/9)*9/16" "$out/social-16x9.png" -loglevel error
  return 0
}
