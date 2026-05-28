#!/usr/bin/env zsh
# tests/visuals/test-social-crops.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/social-crops.zsh"

WORKDIR=$(mktemp -d -t tt-crops-XXXXXX)
cp "$FIXTURES/hero-stub.png" "$WORKDIR/hero.png"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

tt_test "social crops produces three files"
tt_make_social_crops "$WORKDIR/hero.png" "$WORKDIR" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$WORKDIR/social-1x1.png"
assert_file_exists "$WORKDIR/social-4x5.png"
assert_file_exists "$WORKDIR/social-16x9.png"

tt_test "1x1 crop is actually square"
dims=$(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$WORKDIR/social-1x1.png")
w="${dims%%,*}"
h="${dims##*,}"
# Strip any trailing CR/LF
w="${w%%[$'\r\n']*}"
h="${h%%[$'\r\n']*}"
assert_eq "$w" "$h"
