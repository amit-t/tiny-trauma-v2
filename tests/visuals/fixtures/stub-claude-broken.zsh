#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-claude-broken.zsh — always emits invalid JSON.
# Used to assert the drafter exits 4 after exhausting its retries.

set -u
print -r -- "this is not json at all {{["
exit 0
