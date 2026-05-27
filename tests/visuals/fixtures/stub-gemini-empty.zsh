#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-gemini-empty.zsh — simulates the silent-failure
# path: exits 0 without producing any output file. The Fix 3 guard in
# _engine_run.zsh should catch this and report rc=1.
set -u
# Intentionally do NOT touch --output. Exit clean.
exit 0
