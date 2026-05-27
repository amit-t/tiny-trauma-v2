#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-codex-fail.zsh — fake codex CLI that exits
# non-zero without writing the output. Mirrors stub-gemini-fail.zsh.

set -u
print -ru2 -- "stub-codex-fail: simulated error"
exit 7
