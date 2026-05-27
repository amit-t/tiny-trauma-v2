#!/usr/bin/env zsh
# tests/visuals/test-engine-run.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

# Put stub-gemini.zsh first on PATH so it shadows real `gemini`.
TMP_BIN=$(mktemp -d -t tt-stubs-XXXXXX)
ln -sf "$FIXTURES/stub-gemini.zsh" "$TMP_BIN/gemini"
PATH="$TMP_BIN:$PATH"
export PATH

cleanup() { rm -rf "$TMP_BIN" "$TMP_BIN_FAIL" "$TMP_BIN_EMPTY"; }
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

# --- Fix 4: failure-mode stubs --------------------------------------------
# Per-test PATH overrides so the failing/empty stubs masquerade as gemini.

TMP_BIN_FAIL=$(mktemp -d -t tt-stubs-fail-XXXXXX)
ln -sf "$FIXTURES/stub-gemini-fail.zsh" "$TMP_BIN_FAIL/gemini"

tt_test "_engine_run.zsh propagates non-zero from gemini failure stub"
FAIL_OUT=$(mktemp -u -t tt-test-fail-XXXXXX.png)
PATH="$TMP_BIN_FAIL:$PATH" "$REPO_ROOT/bin/_engine_run.zsh" gemini "$PROMPT" "$FAIL_OUT" >/dev/null 2>&1
fail_rc=$?
[[ "$fail_rc" != "0" ]] && (( TT_TEST_PASS++ )) || { (( TT_TEST_FAIL++ )); print -ru2 -- "    ✗ expected non-zero, got $fail_rc"; }

tt_test "failure stub does not create the output file"
[[ ! -e "$FAIL_OUT" ]] && (( TT_TEST_PASS++ )) || { (( TT_TEST_FAIL++ )); print -ru2 -- "    ✗ unexpected file at $FAIL_OUT"; }
rm -f "$FAIL_OUT"

TMP_BIN_EMPTY=$(mktemp -d -t tt-stubs-empty-XXXXXX)
ln -sf "$FIXTURES/stub-gemini-empty.zsh" "$TMP_BIN_EMPTY/gemini"

tt_test "_engine_run.zsh catches gemini's silent-success (exit 0, no output)"
EMPTY_OUT=$(mktemp -u -t tt-test-empty-XXXXXX.png)
PATH="$TMP_BIN_EMPTY:$PATH" "$REPO_ROOT/bin/_engine_run.zsh" gemini "$PROMPT" "$EMPTY_OUT" >/dev/null 2>&1
empty_rc=$?
[[ "$empty_rc" != "0" ]] && (( TT_TEST_PASS++ )) || { (( TT_TEST_FAIL++ )); print -ru2 -- "    ✗ expected non-zero (Fix 3 guard), got $empty_rc"; }

tt_test "silent-success stub leaves output path missing"
[[ ! -e "$EMPTY_OUT" ]] && (( TT_TEST_PASS++ )) || { (( TT_TEST_FAIL++ )); print -ru2 -- "    ✗ unexpected file at $EMPTY_OUT"; }
rm -f "$EMPTY_OUT"

rm -f "$OUT" "$PROMPT"
