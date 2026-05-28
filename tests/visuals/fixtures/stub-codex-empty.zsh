#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-codex-empty.zsh — simulates the silent-failure
# path: exits 0 without producing any output file. The defensive guard in
# _engine_run.zsh should catch this and report rc=1.
set -u
exit 0
