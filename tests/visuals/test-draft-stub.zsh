#!/usr/bin/env zsh
# tests/visuals/test-draft-stub.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
source "$REPO_ROOT/bin/lib/tt-visuals/parse-mdx.zsh"
source "$REPO_ROOT/bin/lib/tt-visuals/slot-detect.zsh"
source "$REPO_ROOT/bin/lib/tt-visuals/draft.zsh"

FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
TT_DRAFT_ENGINE_BIN="$FIXTURES/stub-claude.zsh"
export TT_DRAFT_ENGINE_BIN

tt_test "draft emits JSON with hero + 2 inline slots for sample-musing"
slots='["hero","inline-1","inline-2"]'
result=$(tt_run_drafter "$FIXTURES/sample-musing.mdx" "$slots")
# parse with node to assert shape
hero=$(printf '%s' "$result" | node -e 'let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{const j=JSON.parse(d); process.stdout.write(j.hero ? "ok" : "missing")})')
assert_eq "ok" "$hero"
inline_count=$(printf '%s' "$result" | node -e 'let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{const j=JSON.parse(d); process.stdout.write(String(j.inline.length))})')
assert_eq "2" "$inline_count"

tt_test "draft retries on invalid JSON, then succeeds with stub returning empty input list"
slots='[]'
result=$(tt_run_drafter "$FIXTURES/sample-musing.mdx" "$slots")
hero=$(printf '%s' "$result" | node -e 'let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{const j=JSON.parse(d); process.stdout.write(j.hero === null ? "null" : "set")})')
assert_eq "null" "$hero"
