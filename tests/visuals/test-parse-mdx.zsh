#!/usr/bin/env zsh
# tests/visuals/test-parse-mdx.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
source "$REPO_ROOT/bin/lib/tt-visuals/parse-mdx.zsh"

FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

tt_test "extracts heroTint from sample-musing.mdx"
result=$(tt_parse_frontmatter_field "$FIXTURES/sample-musing.mdx" heroTint)
assert_eq "sage" "$result"

tt_test "extracts heroImage when present"
result=$(tt_parse_frontmatter_field "$FIXTURES/sample-musing-with-overrides.mdx" heroImage)
assert_eq "/img/musings/blue-hour-hero-existing.png" "$result"

tt_test "returns empty when frontmatter field missing"
result=$(tt_parse_frontmatter_field "$FIXTURES/sample-musing.mdx" heroImage)
assert_eq "" "$result"

tt_test "counts empty inline markers in sample-musing.mdx"
result=$(tt_parse_markers "$FIXTURES/sample-musing.mdx" | grep -c '^inline:empty$')
assert_eq "2" "$result"

tt_test "detects skip marker"
result=$(tt_parse_markers "$FIXTURES/sample-musing.mdx" | grep -c '^skip$')
assert_eq "1" "$result"

tt_test "extracts override text from inline marker"
result=$(tt_parse_markers "$FIXTURES/sample-musing-with-overrides.mdx" | grep '^inline:override:')
assert_contains "$result" "a half-drawn curtain at first light, slate cast, hand-drawn ink"

tt_test "no hero override marker in basic fixture"
result=$(tt_parse_markers "$FIXTURES/sample-musing.mdx" | grep -c '^hero:')
assert_eq "0" "$result"
