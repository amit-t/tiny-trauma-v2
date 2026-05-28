#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-gemini-fail.zsh — simulates a network/CLI
# failure: exits non-zero without writing the requested output path.
set -u
print -ru2 -- "stub-gemini-fail: simulated failure"
exit 1
