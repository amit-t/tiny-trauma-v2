#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-devin-fail.zsh — simulates a devin failure:
# exits non-zero without writing the requested output path.
set -u
print -ru2 -- "stub-devin-fail: simulated failure"
exit 9
