#!/usr/bin/env zsh
# tests/visuals/test-render-parallel.zsh — render with two engines in parallel.

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/parallel.zsh"
source "$REPO_ROOT/bin/lib/tt-visuals/render.zsh"

TMP_BIN=$(mktemp -d -t tt-stubs-XXXXXX)
ln -sf "$FIXTURES/stub-gemini.zsh" "$TMP_BIN/gemini"
ln -sf "$FIXTURES/stub-codex.zsh"  "$TMP_BIN/codex"
PATH="$TMP_BIN:$PATH"; export PATH

WORKDIR=$(mktemp -d -t "tt-rp-XXXXXX")
cat > "$WORKDIR/.prompts.json" <<'JSON'
{
  "hero": { "prompt": "x", "negative": "y", "aspect": "16:9", "tint": "sage" },
  "inline": [],
  "overrides": {}
}
JSON

cleanup() { rm -rf "$TMP_BIN" "$WORKDIR"; }
trap cleanup EXIT

tt_test "render across two engines produces both candidates"
tt_render_slots_multi "gemini codex" "$WORKDIR/.prompts.json" "$WORKDIR/cand" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$WORKDIR/cand/hero/gemini.png"
assert_file_exists "$WORKDIR/cand/hero/codex.png"
