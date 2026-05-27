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
