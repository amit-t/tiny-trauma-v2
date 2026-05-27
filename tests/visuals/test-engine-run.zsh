#!/usr/bin/env zsh
# tests/visuals/test-engine-run.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

# Put stub-gemini.zsh first on PATH so it shadows real `gemini`.
TMP_BIN=$(mktemp -d -t tt-stubs-XXXXXX)
ln -sf "$FIXTURES/stub-gemini.zsh" "$TMP_BIN/gemini"
PATH="$TMP_BIN:$PATH"
export PATH

cleanup() { rm -rf "$TMP_BIN"; }
trap cleanup EXIT

OUT=$(mktemp -t tt-test-render-XXXXXX.png)
PROMPT=$(mktemp -t tt-test-prompt-XXXXXX.txt)
print -r -- '{"prompt":"x","negative":"y","aspect":"16:9","tint":"sage"}' > "$PROMPT"

tt_test "_engine_run.zsh gemini path writes the output file"
"$REPO_ROOT/bin/_engine_run.zsh" gemini "$PROMPT" "$OUT" >/dev/null 2>&1
rc=$?
assert_eq "0" "$rc"
assert_file_exists "$OUT"

tt_test "_engine_run.zsh rejects unknown engine with exit 2"
"$REPO_ROOT/bin/_engine_run.zsh" zzz "$PROMPT" "$OUT" >/dev/null 2>&1
assert_eq "2" "$?"

tt_test "_engine_run.zsh requires three positional args"
"$REPO_ROOT/bin/_engine_run.zsh" gemini "$PROMPT" >/dev/null 2>&1
assert_eq "2" "$?"

rm -f "$OUT" "$PROMPT"
