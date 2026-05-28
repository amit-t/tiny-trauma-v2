#!/usr/bin/env zsh
# tests/visuals/test-gif-post.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/gif-post.zsh"

WORKDIR=$(mktemp -d -t tt-gif-XXXXXX)
cp "$FIXTURES/hero-stub.mp4" "$WORKDIR/inline-1.mp4"
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

tt_test "gif-post produces a .gif from mp4"
tt_mp4_to_gif "$WORKDIR/inline-1.mp4" "$WORKDIR/inline-1.gif" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$WORKDIR/inline-1.gif"

tt_test "poster-frame extraction produces a PNG"
tt_extract_poster "$WORKDIR/inline-1.mp4" "$WORKDIR/inline-1.png" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$WORKDIR/inline-1.png"
