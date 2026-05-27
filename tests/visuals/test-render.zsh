#!/usr/bin/env zsh
# tests/visuals/test-render.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/render.zsh"

TMP_BIN=$(mktemp -d -t tt-stubs-XXXXXX)
ln -sf "$FIXTURES/stub-gemini.zsh" "$TMP_BIN/gemini"
PATH="$TMP_BIN:$PATH"
export PATH

WORKDIR=$(mktemp -d -t tt-test-render-XXXXXX)
PROMPTS_JSON="$WORKDIR/.prompts.json"
cat > "$PROMPTS_JSON" <<'JSON'
{
  "hero": {"prompt":"x","negative":"y","aspect":"16:9","tint":"sage"},
  "inline": [
    {"slot":"inline-1","prompt":"a","negative":"b","aspect":"4:3","tint":"sage"}
  ],
  "overrides": {}
}
JSON

cleanup() { rm -rf "$TMP_BIN" "$WORKDIR"; }
trap cleanup EXIT

tt_test "render single engine writes one candidate per slot"
tt_render_slots gemini "$PROMPTS_JSON" "$WORKDIR/candidates" >/dev/null 2>&1
rc=$?
assert_eq "0" "$rc"
assert_file_exists "$WORKDIR/candidates/hero/gemini.png"
assert_file_exists "$WORKDIR/candidates/inline-1/gemini.png"

tt_test "render emits sidecar .meta.json"
assert_file_exists "$WORKDIR/candidates/hero/gemini.meta.json"
