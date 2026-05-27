#!/usr/bin/env zsh
# tests/visuals/test-flag-parser.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
BIN="$REPO_ROOT/bin/tt-visuals"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

# Set the drafter stub for dry-run tests.
export TT_DRAFT_ENGINE_BIN="$FIXTURES/stub-claude.zsh"
export TT_SKILL_DIR="$REPO_ROOT/.claude/skills/tt-visuals"
export TT_CONTENT_SKILL_DIR="$REPO_ROOT/.claude/skills/tiny-trauma-content"

# Use a temp content root so we don't pollute real content/.
TMP_CONTENT=$(mktemp -d -t tt-visuals-content-XXXXXX)
mkdir -p "$TMP_CONTENT/content/musings" "$TMP_CONTENT/public/img"
cp "$FIXTURES/sample-musing.mdx" "$TMP_CONTENT/content/musings/the-kettle.mdx"
export TT_CONTENT_ROOT="$TMP_CONTENT"

cleanup() { rm -rf "$TMP_CONTENT"; }
trap cleanup EXIT

tt_test "missing target exits 2 with usage error"
"$BIN" 2>/dev/null
assert_eq "2" "$?"

tt_test "--help exits 0"
"$BIN" --help >/dev/null
assert_eq "0" "$?"

tt_test "--engine claude is rejected (no image gen) with exit 2"
"$BIN" --engine claude musings/the-kettle 2>/dev/null
assert_eq "2" "$?"

tt_test "--dry-run writes .prompts.json and exits 0"
"$BIN" --dry-run musings/the-kettle >/dev/null 2>&1
rc=$?
assert_eq "0" "$rc"
assert_file_exists "$TMP_CONTENT/public/img/musings/the-kettle/.prompts.json"

tt_test ".prompts.json has hero + 2 inline entries"
result=$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); process.stdout.write(`${j.hero ? "h" : "-"}${j.inline.length}`)' "$TMP_CONTENT/public/img/musings/the-kettle/.prompts.json")
assert_eq "h2" "$result"

tt_test "dry-run makes zero changes to the mdx"
before=$(shasum -a 256 "$TMP_CONTENT/content/musings/the-kettle.mdx")
"$BIN" --dry-run musings/the-kettle >/dev/null 2>&1
after=$(shasum -a 256 "$TMP_CONTENT/content/musings/the-kettle.mdx")
assert_eq "$before" "$after"
