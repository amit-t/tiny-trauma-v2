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
