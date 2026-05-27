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
