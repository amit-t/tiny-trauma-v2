#!/usr/bin/env zsh
# tests/visuals/test-binary-e2e.zsh
#
# End-to-end smoke test for `bin/tt-visuals --engine gemini` against a
# fixture mdx with all external CLIs (claude/gemini/qlmanage) stubbed.
# Drives the full pipeline: flag parse → drafter → render → pick → install
# → mdx rewrite → social crops → prune.
#
# Slower than the other tests (real ffmpeg, real tsx spawns for validation).
# That's fine — this is the only integration test in the suite.

setopt local_options nullglob

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

# --- isolated environment -------------------------------------------------
WORKDIR=$(mktemp -d -t tt-e2e-XXXXXX)
TMP_BIN="$WORKDIR/bin"
mkdir -p "$TMP_BIN"
ln -sf "$FIXTURES/stub-gemini.zsh" "$TMP_BIN/gemini"
ln -sf "$FIXTURES/stub-qlmanage.zsh" "$TMP_BIN/qlmanage"
PATH="$TMP_BIN:$PATH"
export PATH

# qlmanage stub needs a marker file path; provide one so it doesn't write to
# a shared default that other tests might inspect.
export TT_TEST_QLMANAGE_MARKER="$WORKDIR/ql-marker.txt"

# Drafter env: use the claude stub so we don't hit the network. The skill
# dirs can be empty — draft.zsh only `cat`s the prompt files if they exist.
export TT_DRAFT_ENGINE_BIN="$FIXTURES/stub-claude.zsh"
export TT_SKILL_DIR="$WORKDIR/skills/tt-visuals"
export TT_CONTENT_SKILL_DIR="$WORKDIR/skills/tiny-trauma-content"
mkdir -p "$TT_SKILL_DIR" "$TT_CONTENT_SKILL_DIR"

# Content root: tt-visuals reads content/<type>/<slug>.mdx and writes
# public/img/<type>/<slug>/ underneath CONTENT_ROOT.
export TT_CONTENT_ROOT="$WORKDIR/content-root"
mkdir -p "$TT_CONTENT_ROOT/content/musings"
cp "$FIXTURES/sample-musing.mdx" "$TT_CONTENT_ROOT/content/musings/the-kettle.mdx"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

# --- run the binary -------------------------------------------------------
# Pipe enough '1' lines to auto-pick the first candidate for each slot. The
# fixture has 1 hero + 2 inline → 3 picks. Over-feed is safe; `read -r` only
# consumes one line at a time.
binary_out="$WORKDIR/binary.stdout"
binary_err="$WORKDIR/binary.stderr"

printf '1\n1\n1\n1\n' \
  | "$REPO_ROOT/bin/tt-visuals" --engine gemini musings/the-kettle \
      >"$binary_out" 2>"$binary_err"
rc=$?

tt_test "bin/tt-visuals --engine gemini exits 0 end-to-end"
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

ASSET_DIR="$TT_CONTENT_ROOT/public/img/musings/the-kettle"
MDX_PATH="$TT_CONTENT_ROOT/content/musings/the-kettle.mdx"

tt_test "hero.png installed"
assert_file_exists "$ASSET_DIR/hero.png"

tt_test "inline-1.png installed"
assert_file_exists "$ASSET_DIR/inline-1.png"

tt_test "inline-2.png installed"
assert_file_exists "$ASSET_DIR/inline-2.png"

tt_test "social-1x1.png derived"
assert_file_exists "$ASSET_DIR/social-1x1.png"

tt_test "social-4x5.png derived"
assert_file_exists "$ASSET_DIR/social-4x5.png"

tt_test "social-16x9.png derived"
assert_file_exists "$ASSET_DIR/social-16x9.png"

tt_test "mdx now references heroImage"
hero_line=$(grep '^heroImage:' "$MDX_PATH" 2>/dev/null || true)
assert_contains "$hero_line" "/img/musings/the-kettle/hero.png"

tt_test "mdx inline markers replaced with image syntax"
inline_count=$(grep -c '!\[.*\](/img/musings/the-kettle/inline-' "$MDX_PATH" 2>/dev/null)
assert_eq "2" "$inline_count"
remaining=$(grep -c '^\[\[visual:\]\]$' "$MDX_PATH" 2>/dev/null)
assert_eq "0" "$remaining"

tt_test ".candidates/ pruned by default"
[[ ! -d "$ASSET_DIR/.candidates" ]] && (( TT_TEST_PASS++ )) || { (( TT_TEST_FAIL++ )); print -ru2 -- "    ✗ unexpected dir at $ASSET_DIR/.candidates"; }

tt_test ".prompts.json exists and is valid JSON with hero/inline/overrides"
PROMPTS="$ASSET_DIR/.prompts.json"
if [[ -f "$PROMPTS" ]]; then
  shape=$(node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const ok = ("hero" in j) && Array.isArray(j.inline) && (typeof j.overrides === "object");
    process.stdout.write(ok ? "ok" : "bad");
  ' "$PROMPTS" 2>/dev/null)
  assert_eq "ok" "$shape"
else
  (( TT_TEST_FAIL++ ))
  print -ru2 -- "    ✗ $PROMPTS does not exist"
fi

# --- M3: --engine all uses parallel renderer (gemini + codex live, devin
# absent → skipped without aborting). Idempotency check too: second run on
# the already-installed fixture must succeed under --force.
ln -sf "$FIXTURES/stub-codex.zsh" "$TMP_BIN/codex"

# Fresh fixture so we don't collide with the earlier --engine gemini run.
mkdir -p "$TT_CONTENT_ROOT/content/musings"
cp "$FIXTURES/sample-musing.mdx" "$TT_CONTENT_ROOT/content/musings/all-engines.mdx"

binary_out2="$WORKDIR/binary-all.stdout"
binary_err2="$WORKDIR/binary-all.stderr"

printf '1\n1\n1\n1\n' \
  | "$REPO_ROOT/bin/tt-visuals" musings/all-engines \
      >"$binary_out2" 2>"$binary_err2"
rc2=$?

tt_test "bin/tt-visuals (default --engine all) exits 0 with two live engines"
if (( rc2 == 0 )); then
  (( TT_TEST_PASS++ ))
else
  (( TT_TEST_FAIL++ ))
  print -ru2 -- "    ✗ exit $rc2"
  print -ru2 -- "    stderr:"
  sed 's/^/      /' "$binary_err2" >&2
fi

ASSET2="$TT_CONTENT_ROOT/public/img/musings/all-engines"
tt_test "default --engine all installs hero from one of the live engines"
assert_file_exists "$ASSET2/hero.png"

# Skipping-missing-engine check is intentionally NOT asserted here: whether
# `devin` is in stderr's skip-list depends on the host's PATH (real devin may
# exist on the developer's machine). MANUAL-TESTS.md covers that case.

# Idempotency: --only-missing default should let a second run no-op (every
# slot is already installed). Use --force to ensure it actually re-renders
# rather than aborting on existing files. Verify it still exits 0.
binary_out3="$WORKDIR/binary-rerun.stdout"
binary_err3="$WORKDIR/binary-rerun.stderr"
printf '1\n1\n1\n1\n' \
  | "$REPO_ROOT/bin/tt-visuals" --force musings/all-engines \
      >"$binary_out3" 2>"$binary_err3"
rc3=$?

tt_test "second run with --force on installed fixture exits 0 (no double-render crash)"
if (( rc3 == 0 )); then
  (( TT_TEST_PASS++ ))
else
  (( TT_TEST_FAIL++ ))
  print -ru2 -- "    ✗ exit $rc3"
  print -ru2 -- "    stderr:"
  sed 's/^/      /' "$binary_err3" >&2
fi
