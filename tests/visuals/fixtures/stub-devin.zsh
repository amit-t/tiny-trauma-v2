#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-devin.zsh — fake devin CLI for unit tests.
# Recognised: `devin run --task <text> --output <path>`. Always copies
# hero-stub.png; devin is image-only for this stub (video kind in tests is
# exercised via codex).

set -u
out=""
while (( $# > 0 )); do
  case "$1" in
    --output) out="$2"; shift 2 ;;
    *) shift ;;
  esac
done
[[ -n "$out" ]] || { print -ru2 -- "stub-devin: --output required"; exit 1; }
fixture_dir="${${(%):-%x}:A:h}"
cp "$fixture_dir/hero-stub.png" "$out"
exit 0
