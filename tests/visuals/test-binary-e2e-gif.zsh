#!/usr/bin/env zsh
# tests/visuals/test-binary-e2e-gif.zsh
#
# End-to-end smoke test for `bin/tt-visuals` against a fixture mdx that uses
# the M3 [[visual gif: ...]] marker. Confirms:
#   - the gif marker drives TT_VISUAL_KIND=video into the engine runner
#     (stub-gemini.zsh refuses to write mp4, so we stub codex which will copy
#      hero-stub.mp4 for video-kind calls)
#   - install-winner.zsh delivers the inline slot as both `inline-1.gif` and
#     `inline-1.mp4`
#   - rewrite-mdx.mts emits a `<video src=".../inline-1.gif" ...>` tag

setopt local_options nullglob

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

WORKDIR=$(mktemp -d -t tt-e2e-gif-XXXXXX)
TMP_BIN="$WORKDIR/bin"
mkdir -p "$TMP_BIN"
# Use codex for both image and video — its stub handles both kinds. Gemini's
# stub is image-only and would write a .png even for video calls, so we don't
# wire it here. Effectively this exercises --engine codex end-to-end.
ln -sf "$FIXTURES/stub-codex.zsh" "$TMP_BIN/codex"
ln -sf "$FIXTURES/stub-qlmanage.zsh" "$TMP_BIN/qlmanage"
PATH="$TMP_BIN:$PATH"
export PATH

export TT_TEST_QLMANAGE_MARKER="$WORKDIR/ql-marker.txt"
export TT_DRAFT_ENGINE_BIN="$FIXTURES/stub-claude.zsh"
export TT_SKILL_DIR="$WORKDIR/skills/tt-visuals"
export TT_CONTENT_SKILL_DIR="$WORKDIR/skills/tiny-trauma-content"
mkdir -p "$TT_SKILL_DIR" "$TT_CONTENT_SKILL_DIR"

export TT_CONTENT_ROOT="$WORKDIR/content-root"
mkdir -p "$TT_CONTENT_ROOT/content/musings"
cat > "$TT_CONTENT_ROOT/content/musings/blink.mdx" <<'MDX'
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

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

binary_out="$WORKDIR/binary.stdout"
binary_err="$WORKDIR/binary.stderr"

# 2 slots (hero auto-emitted + inline-1 gif) → feed 2 picks.
printf '1\n1\n1\n' \
  | "$REPO_ROOT/bin/tt-visuals" --engine codex musings/blink \
      >"$binary_out" 2>"$binary_err"
rc=$?

tt_test "bin/tt-visuals --engine codex with gif marker exits 0 end-to-end"
if (( rc == 0 )); then
  (( TT_TEST_PASS++ ))
else
  (( TT_TEST_FAIL++ ))
  print -ru2 -- "    ✗ exit $rc"
  print -ru2 -- "    stderr:"
  sed 's/^/      /' "$binary_err" >&2
  print -ru2 -- "    stdout:"
  sed 's/^/      /' "$binary_out" >&2
fi

ASSET_DIR="$TT_CONTENT_ROOT/public/img/musings/blink"
MDX_PATH="$TT_CONTENT_ROOT/content/musings/blink.mdx"

tt_test "hero.png installed (image kind preserved for hero)"
assert_file_exists "$ASSET_DIR/hero.png"

tt_test "inline-1.gif installed (gif marker → web-deliverable gif)"
assert_file_exists "$ASSET_DIR/inline-1.gif"

tt_test "inline-1.mp4 kept alongside the gif"
assert_file_exists "$ASSET_DIR/inline-1.mp4"

tt_test "mdx emits a <video> tag pointing at inline-1.gif"
video_count=$(grep -c '<video src="/img/musings/blink/inline-1.gif"' "$MDX_PATH" 2>/dev/null)
assert_eq "1" "$video_count"

tt_test "gif marker no longer present in mdx body"
gif_marker_count=$(grep -c '\[\[visual gif:' "$MDX_PATH" 2>/dev/null)
assert_eq "0" "$gif_marker_count"

tt_test ".prompts.json carries the inline-1 kind=video hint"
PROMPTS="$ASSET_DIR/.prompts.json"
if [[ -f "$PROMPTS" ]]; then
  kind=$(node -e '
    const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const inl = (j.inline || []).find(e => e.slot === "inline-1");
    process.stdout.write((inl && inl.kind) || "");
  ' "$PROMPTS" 2>/dev/null)
  assert_eq "video" "$kind"
else
  (( TT_TEST_FAIL++ ))
  print -ru2 -- "    ✗ $PROMPTS does not exist"
fi
