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

tt_test "draft with happy-path stub returns hero=null when no slots requested"
slots='[]'
result=$(tt_run_drafter "$FIXTURES/sample-musing.mdx" "$slots")
hero=$(printf '%s' "$result" | node -e 'let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{const j=JSON.parse(d); process.stdout.write(j.hero === null ? "null" : "set")})')
assert_eq "null" "$hero"

tt_test "draft exits 4 when stub always returns broken JSON"
TT_DRAFT_ENGINE_BIN="$FIXTURES/stub-claude-broken.zsh"
export TT_DRAFT_ENGINE_BIN
slots='["hero"]'
tt_run_drafter "$FIXTURES/sample-musing.mdx" "$slots" >/dev/null 2>&1
assert_eq "4" "$?"

tt_test "draft retries once on broken JSON and succeeds on 2nd attempt"
counter_file=$(mktemp -t tt-flaky-counter-XXXXXX)
rm -f "$counter_file"  # delete; flaky stub re-creates from n=0
TT_FLAKY_COUNTER="$counter_file"
export TT_FLAKY_COUNTER
TT_DRAFT_ENGINE_BIN="$FIXTURES/stub-claude-flaky.zsh"
export TT_DRAFT_ENGINE_BIN
slots='["hero"]'
result=$(tt_run_drafter "$FIXTURES/sample-musing.mdx" "$slots")
rc=$?
assert_eq "0" "$rc"
n=$(<"$counter_file")
assert_eq "2" "$n"
rm -f "$counter_file"
unset TT_FLAKY_COUNTER

tt_test "draft strips prose preamble/postscript from real-CLI-style output"
TT_DRAFT_ENGINE_BIN="$FIXTURES/stub-claude-prosey.zsh"
export TT_DRAFT_ENGINE_BIN
slots='["hero","inline-1"]'
result=$(tt_run_drafter "$FIXTURES/sample-musing.mdx" "$slots")
rc=$?
assert_eq "0" "$rc"
# Result must parse as strict JSON (no prose), and must NOT contain the
# "Operating under" preamble or the "Note:" postscript.
parsed=$(printf '%s' "$result" | node -e 'let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{try{const j=JSON.parse(d); process.stdout.write("ok")}catch(_){process.stdout.write("fail")}})')
assert_eq "ok" "$parsed"
assert_not_contains "$result" "Operating under"
assert_not_contains "$result" "Note:"

# Restore default stub for any future tests in this file.
TT_DRAFT_ENGINE_BIN="$FIXTURES/stub-claude.zsh"
export TT_DRAFT_ENGINE_BIN
