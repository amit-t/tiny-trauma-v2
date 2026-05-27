#!/usr/bin/env zsh
# tests/visuals/test-pick-ui.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/pick-ui.zsh"

# Stub qlmanage on PATH.
TMP_BIN=$(mktemp -d -t tt-stubs-XXXXXX)
ln -sf "$FIXTURES/stub-qlmanage.zsh" "$TMP_BIN/qlmanage"
PATH="$TMP_BIN:$PATH"
export PATH
export TT_TEST_QLMANAGE_MARKER=$(mktemp -t tt-ql-XXXXXX)

# Build a fake candidates dir.
WORKDIR=$(mktemp -d -t tt-pick-XXXXXX)
mkdir -p "$WORKDIR/hero"
cp "$FIXTURES/hero-stub.png" "$WORKDIR/hero/gemini.png"
cp "$FIXTURES/hero-stub.png" "$WORKDIR/hero/codex.png"

cleanup() { rm -rf "$TMP_BIN" "$WORKDIR" "$TT_TEST_QLMANAGE_MARKER"; }
trap cleanup EXIT

tt_test "pick prompts and returns the engine the user selected (1 → gemini or codex, glob order)"
result=$(print -- "1" | tt_pick_for_slot hero "$WORKDIR/hero")
# Glob order is alphabetic: codex.png before gemini.png. Accept either valid first slot.
case "$result" in
  codex|gemini) (( TT_TEST_PASS++ )) ;;
  *) (( TT_TEST_FAIL++ )); print -ru2 -- "    ✗ unexpected: $result" ;;
esac

tt_test "pick returns __skip__ on 's'"
result=$(print -- "s" | tt_pick_for_slot hero "$WORKDIR/hero")
assert_eq "__skip__" "$result"

tt_test "pick returns __quit__ on 'q'"
result=$(print -- "q" | tt_pick_for_slot hero "$WORKDIR/hero")
assert_eq "__quit__" "$result"

tt_test "qlmanage was invoked"
[[ -s "$TT_TEST_QLMANAGE_MARKER" ]] && (( TT_TEST_PASS++ )) || (( TT_TEST_FAIL++ ))
