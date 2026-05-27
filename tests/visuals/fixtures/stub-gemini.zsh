#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-gemini.zsh — fake gemini CLI for unit tests.
# Recognised: `gemini image generate --output <path> ...`. Copies hero-stub.png.

set -u
out=""
while (( $# > 0 )); do
  case "$1" in
    --output) out="$2"; shift 2 ;;
    *) shift ;;
  esac
done
[[ -n "$out" ]] || { print -ru2 -- "stub-gemini: --output required"; exit 1; }
fixture_dir="${${(%):-%x}:A:h}"
cp "$fixture_dir/hero-stub.png" "$out"
exit 0
