#!/usr/bin/env zsh
# bin/lib/tt-visuals/gif-post.zsh — ffmpeg helpers for mp4 → gif conversion
# and poster-frame extraction. Sourced, not executed.

[[ -n "${_TT_GIF_POST_SOURCED:-}" ]] && return 0
typeset -g _TT_GIF_POST_SOURCED=1

# Usage: tt_mp4_to_gif <in.mp4> <out.gif>
# Lossy convert at 12fps, 640px wide, lanczos resample. Returns ffmpeg's rc.
tt_mp4_to_gif() {
  local in="$1" out="$2"
  ffmpeg -y -i "$in" -vf "fps=12,scale=640:-1:flags=lanczos" -loop 0 "$out" -loglevel error
}

# Usage: tt_extract_poster <in.mp4> <out.png>
# Grabs the first video frame as a still. Used for hero mp4 → hero.png.
tt_extract_poster() {
  local in="$1" out="$2"
  ffmpeg -y -i "$in" -frames:v 1 "$out" -loglevel error
}
