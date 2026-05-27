#!/usr/bin/env zsh
# tests/visuals/test-install-winner.zsh

setopt local_options nullglob

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/install-winner.zsh"

WORKDIR=$(mktemp -d -t tt-install-XXXXXX)
ASSET_DIR="$WORKDIR/public/img/musings/x"
mkdir -p "$WORKDIR/cand/hero" "$ASSET_DIR"
cp "$FIXTURES/hero-stub.png" "$WORKDIR/cand/hero/gemini.png"
cp "$FIXTURES/hero-stub.png" "$WORKDIR/cand/hero/codex.png"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

tt_test "install copies winner to <asset_dir>/<slot>.png"
tt_install_winner "hero" "gemini" "$WORKDIR/cand/hero" "$ASSET_DIR" 0 >/dev/null 2>&1
assert_file_exists "$ASSET_DIR/hero.png"

tt_test "losing candidates move to .candidates/"
assert_file_exists "$ASSET_DIR/.candidates/hero/codex.png"

tt_test "with --force-style backup, original is renamed *.bak-*"
# Re-install on top of existing winner; backup must be created.
tt_install_winner "hero" "codex" "$WORKDIR/cand/hero" "$ASSET_DIR" 1 >/dev/null 2>&1
baks=("$ASSET_DIR"/hero.bak-*.png)
(( ${#baks[@]} == 1 )) && (( TT_TEST_PASS++ )) || (( TT_TEST_FAIL++ ))

# --- Fix 6: force=0 with existing target aborts cleanly -------------------
# Set up a fresh asset dir with a pre-existing target so we can prove that
# the abort path leaves no side effects.

ASSET2="$WORKDIR/public/img/musings/y"
CAND2="$WORKDIR/cand2/hero"
mkdir -p "$ASSET2" "$CAND2"
cp "$FIXTURES/hero-stub.png" "$ASSET2/hero.png"
cp "$FIXTURES/hero-stub.png" "$CAND2/gemini.png"
cp "$FIXTURES/hero-stub.png" "$CAND2/codex.png"
# Mutate the target so its checksum differs from the candidate.
print -r -- "marker bytes" >> "$ASSET2/hero.png"
sha_before=$(shasum -a 256 "$ASSET2/hero.png" | awk '{print $1}')

tt_test "force=0 with existing target returns non-zero"
tt_install_winner "hero" "gemini" "$CAND2" "$ASSET2" 0 >/dev/null 2>&1
rc=$?
[[ "$rc" != "0" ]] && (( TT_TEST_PASS++ )) || { (( TT_TEST_FAIL++ )); print -ru2 -- "    ✗ expected non-zero, got $rc"; }

tt_test "force=0 abort leaves target byte-identical"
sha_after=$(shasum -a 256 "$ASSET2/hero.png" | awk '{print $1}')
assert_eq "$sha_before" "$sha_after"

tt_test "force=0 abort does NOT create .candidates/<slot>/"
[[ ! -d "$ASSET2/.candidates/hero" ]] && (( TT_TEST_PASS++ )) || { (( TT_TEST_FAIL++ )); print -ru2 -- "    ✗ unexpected dir at $ASSET2/.candidates/hero"; }
