#!/usr/bin/env zsh
# tests/visuals/test-slot-detect.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
source "$REPO_ROOT/bin/lib/tt-visuals/parse-mdx.zsh"
source "$REPO_ROOT/bin/lib/tt-visuals/slot-detect.zsh"

FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

tt_test "sample-musing.mdx: hero needed, 2 inline empty, 1 skip excluded"
result=$(tt_detect_slots "$FIXTURES/sample-musing.mdx")
assert_contains "$result" "hero:empty"
assert_contains "$result" "inline-1:empty"
assert_contains "$result" "inline-2:empty"
# skip must not appear as a slot
assert_not_contains "$result" "inline-3" "skip marker should not produce a slot"

tt_test "sample-musing-with-overrides.mdx: hero already set, no hero slot, 1 inline override"
result=$(tt_detect_slots "$FIXTURES/sample-musing-with-overrides.mdx")
assert_not_contains "$result" "hero:" "hero slot should be absent when heroImage already set"
assert_contains "$result" "inline-1:override:a half-drawn curtain at first light"

tt_test "sample-short-no-hero.mdx: hero needed, 1 inline empty"
result=$(tt_detect_slots "$FIXTURES/sample-short-no-hero.mdx")
assert_contains "$result" "hero:empty"
assert_contains "$result" "inline-1:empty"

# --- multiple hero markers: last-wins + stderr warning -------------------
tt_test "sample-double-hero.mdx: last hero marker wins (hero-mp4 here)"
WORKDIR=$(mktemp -d -t tt-slot-detect-XXXXXX)
tt_detect_slots "$FIXTURES/sample-double-hero.mdx" \
  >"$WORKDIR/stdout" 2>"$WORKDIR/stderr"
stdout=$(cat "$WORKDIR/stdout")
stderr=$(cat "$WORKDIR/stderr")
rm -rf "$WORKDIR"
assert_contains "$stdout" "hero-mp4:override:a slow pan across a stuttering ceiling fan, sage cast"
# The earlier `[[visual hero: ...]]` line MUST NOT also be emitted as a slot
# line. (Each post produces exactly one hero slot.)
assert_not_contains "$stdout" "hero:override:a still image of a wooden door at dawn"

tt_test "sample-double-hero.mdx: stderr warns about multiple hero markers"
assert_contains "$stderr" "slot-detect:"
assert_contains "$stderr" "2 hero markers"
