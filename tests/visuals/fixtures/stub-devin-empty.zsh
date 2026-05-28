#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-devin-empty.zsh — exits 0 with no output file.
# The defensive guard in _engine_run.zsh should catch this and report rc=1.
set -u
exit 0
