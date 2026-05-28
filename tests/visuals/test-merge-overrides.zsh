#!/usr/bin/env zsh
# tests/visuals/test-merge-overrides.zsh — assert merge-overrides.mjs
# normalises hero-mp4 → hero so the author-supplied override text reaches
# the renderer (previously dropped on the floor because render.zsh looks
# up `overrides[slot]` where slot === "hero").

setopt local_options nullglob

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
MERGE="$REPO_ROOT/bin/lib/tt-visuals/merge-overrides.mjs"

WORKDIR=$(mktemp -d -t tt-merge-overrides-XXXXXX)
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

# Drafter JSON shape: hero object + inline[] of slot/payload, no overrides yet.
cat > "$WORKDIR/drafter.json" <<'JSON'
{
  "hero": { "slot": "hero", "prompt": "drafter hero prompt" },
  "inline": [
    { "slot": "inline-1", "prompt": "drafter inline-1 prompt" }
  ]
}
JSON

# Slot-lines fixture: mix of hero-mp4 override + plain inline override +
# (irrelevant) plain hero empty line — only the override lines should land
# in j.overrides.
cat > "$WORKDIR/slot-lines.txt" <<'EOF'
hero-mp4:override:author-text-for-hero
inline-1:override:author-text-for-inline
EOF

tt_test "hero-mp4 override is normalised onto overrides.hero (not overrides['hero-mp4'])"
out=$(node "$MERGE" "$WORKDIR/drafter.json" "$WORKDIR/slot-lines.txt")
hero_override=$(node -e '
  const j = JSON.parse(process.argv[1]);
  process.stdout.write(j.overrides.hero ?? "");
' "$out")
assert_eq "author-text-for-hero" "$hero_override"

tt_test "overrides['hero-mp4'] is NOT set (only overrides.hero)"
hero_mp4_override=$(node -e '
  const j = JSON.parse(process.argv[1]);
  process.stdout.write(j.overrides["hero-mp4"] === undefined ? "undefined" : "DEFINED");
' "$out")
assert_eq "undefined" "$hero_mp4_override"

tt_test "plain inline-1 override survives unchanged"
inline_override=$(node -e '
  const j = JSON.parse(process.argv[1]);
  process.stdout.write(j.overrides["inline-1"] ?? "");
' "$out")
assert_eq "author-text-for-inline" "$inline_override"

# Sanity: gif-shaped override line should also land on inline-N (NOT
# inline-N-gif). Build a second fixture for this isolated case.
cat > "$WORKDIR/slot-lines-gif.txt" <<'EOF'
inline-1:gif:override:gif-author-text
EOF
tt_test "inline-N:gif:override:... lands on overrides['inline-N']"
out2=$(node "$MERGE" "$WORKDIR/drafter.json" "$WORKDIR/slot-lines-gif.txt")
gif_override=$(node -e '
  const j = JSON.parse(process.argv[1]);
  process.stdout.write(j.overrides["inline-1"] ?? "");
' "$out2")
assert_eq "gif-author-text" "$gif_override"
