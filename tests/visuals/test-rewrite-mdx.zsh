#!/usr/bin/env zsh
# tests/visuals/test-rewrite-mdx.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/rewrite-mdx.zsh"

WORKDIR=$(mktemp -d -t tt-rewrite-XXXXXX)
cp "$FIXTURES/sample-musing.mdx" "$WORKDIR/the-kettle.mdx"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

cat > "$WORKDIR/installed.json" <<'JSON'
{
  "type": "musings",
  "slug": "the-kettle",
  "hero": "hero.png",
  "inline": ["inline-1.png", "inline-2.png"]
}
JSON

tt_test "rewrite installs heroImage in frontmatter"
tt_rewrite_mdx "$WORKDIR/the-kettle.mdx" "$WORKDIR/installed.json" "$REPO_ROOT" >/dev/null 2>&1
assert_eq "0" "$?"
result=$(grep '^heroImage:' "$WORKDIR/the-kettle.mdx")
assert_contains "$result" "/img/musings/the-kettle/hero.png"

tt_test "rewrite replaces inline markers in body"
result=$(grep -c '^\[\[visual:\]\]$' "$WORKDIR/the-kettle.mdx")
assert_eq "0" "$result"
result=$(grep -c '!\[.*\](/img/musings/the-kettle/inline-1.png)' "$WORKDIR/the-kettle.mdx")
assert_eq "1" "$result"

tt_test "skip markers are left untouched"
result=$(grep -c '\[\[visual skip\]\]' "$WORKDIR/the-kettle.mdx")
assert_eq "1" "$result"

tt_test "rewrite is atomic: bad install.json fails without touching mdx"
cp "$FIXTURES/sample-musing.mdx" "$WORKDIR/the-kettle.mdx"
before=$(shasum -a 256 "$WORKDIR/the-kettle.mdx")
print -r -- "{ malformed" > "$WORKDIR/bad.json"
tt_rewrite_mdx "$WORKDIR/the-kettle.mdx" "$WORKDIR/bad.json" "$REPO_ROOT" >/dev/null 2>&1
assert_eq "5" "$?"
after=$(shasum -a 256 "$WORKDIR/the-kettle.mdx")
assert_eq "$before" "$after"

# --- Fix 1: frontmatter style preservation -------------------------------
# Re-run the rewrite on a fresh copy of the fixture and assert that the
# author's exact quote style, ISO date, and key order survive byte-for-byte
# (apart from the inserted heroImage line, which must appear AFTER the
# author's last key but BEFORE the closing ---).

tt_test "rewrite preserves author quote style + ISO date byte-identically"
cp "$FIXTURES/sample-musing.mdx" "$WORKDIR/the-kettle.mdx"
tt_rewrite_mdx "$WORKDIR/the-kettle.mdx" "$WORKDIR/installed.json" "$REPO_ROOT" >/dev/null 2>&1
assert_eq "0" "$?"

# First 4 frontmatter lines (title, dek, type, publishedAt) must be byte-
# identical to the fixture. (Line 1 is the opening ---, so lines 2-5.)
fixture_head=$(sed -n '2,5p' "$FIXTURES/sample-musing.mdx")
rewritten_head=$(sed -n '2,5p' "$WORKDIR/the-kettle.mdx")
assert_eq "$fixture_head" "$rewritten_head"

# ISO date must survive: still `publishedAt: 2026-05-01`, NOT
# `publishedAt: 2026-05-01T00:00:00.000Z`.
date_line=$(grep '^publishedAt:' "$WORKDIR/the-kettle.mdx")
assert_eq "publishedAt: 2026-05-01" "$date_line"

# Title quote style must survive: still wrapped in double quotes with the
# literal *outlived* markdown emphasis preserved.
title_line=$(grep '^title:' "$WORKDIR/the-kettle.mdx")
assert_eq "title: \"The kettle that *outlived* her\"" "$title_line"

tt_test "heroImage is inserted just before the closing ---"
# Find the line number of the LAST original key (`status: draft`) and the
# closing `---`. heroImage must sit between them, immediately above ---.
status_lineno=$(grep -n '^status:' "$WORKDIR/the-kettle.mdx" | head -1 | cut -d: -f1)
hero_lineno=$(grep -n '^heroImage:' "$WORKDIR/the-kettle.mdx" | head -1 | cut -d: -f1)
# Find the closing --- — it's the SECOND `^---$` line. awk handles the count.
close_lineno=$(awk '/^---[[:space:]]*$/{c++; if(c==2){print NR; exit}}' "$WORKDIR/the-kettle.mdx")
# heroImage must come after status and before close
[[ "$hero_lineno" -gt "$status_lineno" && "$hero_lineno" -lt "$close_lineno" ]] \
  && (( TT_TEST_PASS++ )) \
  || { (( TT_TEST_FAIL++ )); print -ru2 -- "    ✗ status=$status_lineno hero=$hero_lineno close=$close_lineno"; }

tt_test "second run is idempotent on heroImage line (replace, not append)"
# Re-run rewrite; heroImage should still appear exactly once.
tt_rewrite_mdx "$WORKDIR/the-kettle.mdx" "$WORKDIR/installed.json" "$REPO_ROOT" >/dev/null 2>&1
assert_eq "0" "$?"
count=$(grep -c '^heroImage:' "$WORKDIR/the-kettle.mdx")
assert_eq "1" "$count"
