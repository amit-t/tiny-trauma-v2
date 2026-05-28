#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-codex.zsh — fake codex CLI for unit tests.
# Recognised: `codex image generate --output <path> ...` and
#             `codex video generate --output <path> ...`.
# Copies hero-stub.png for image kind, hero-stub.mp4 for video kind.

set -u
out=""
kind="image"
while (( $# > 0 )); do
  case "$1" in
    image) kind="image"; shift ;;
    video) kind="video"; shift ;;
    --output) out="$2"; shift 2 ;;
    *) shift ;;
  esac
done
[[ -n "$out" ]] || { print -ru2 -- "stub-codex: --output required"; exit 1; }
fixture_dir="${${(%):-%x}:A:h}"
if [[ "$kind" == "video" ]]; then
  cp "$fixture_dir/hero-stub.mp4" "$out"
else
  cp "$fixture_dir/hero-stub.png" "$out"
fi
exit 0
