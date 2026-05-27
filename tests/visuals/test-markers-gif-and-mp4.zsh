#!/usr/bin/env zsh
# tests/visuals/test-markers-gif-and-mp4.zsh — verify [[visual gif:]] and
# [[visual hero mp4:]] markers ripple through parse-mdx → slot-detect into
# the gif/mp4-shaped slot lines the renderer + rewriter expect.

setopt local_options nullglob

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

source "$REPO_ROOT/bin/lib/tt-visuals/parse-mdx.zsh"
source "$REPO_ROOT/bin/lib/tt-visuals/slot-detect.zsh"

WORKDIR=$(mktemp -d -t tt-markers-XXXXXX)
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

# Fixture: gif marker only (no hero in frontmatter → hero slot is also emitted).
cat > "$WORKDIR/sample-gif.mdx" <<'MDX'
---
title: "The *blink* of rain"
dek: "Three seconds of monsoon in a corner of the courtyard."
type: musing
publishedAt: 2026-05-04
number: 101
tags: []
heroTint: slate
status: draft
---

It rained for nine seconds and then it didn't.

[[visual gif: a steady stream of monsoon hitting a stone courtyard, slate cast]]
MDX

tt_test "gif marker is detected as inline-1 gif slot"
result=$(tt_detect_slots "$WORKDIR/sample-gif.mdx")
assert_contains "$result" "inline-1:gif:override:a steady stream of monsoon hitting a stone courtyard, slate cast"

# Fixture: hero mp4 marker.
cat > "$WORKDIR/sample-hero-mp4.mdx" <<'MDX'
---
title: "Slow-motion ceiling fan"
dek: "Three seconds of an old fan stuttering."
type: musing
publishedAt: 2026-05-05
number: 102
tags: []
heroTint: sage
status: draft
---

It cools, it stutters, it cools.

[[visual hero mp4: a ceiling fan stuttering in slow motion, sage cast]]
MDX

tt_test "hero mp4 marker emits a hero-mp4 slot line"
result=$(tt_detect_slots "$WORKDIR/sample-hero-mp4.mdx")
assert_contains "$result" "hero-mp4:override:a ceiling fan stuttering in slow motion, sage cast"
