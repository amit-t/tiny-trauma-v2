#!/usr/bin/env zsh
# tests/visuals/test-enrich-kind-hints.zsh — assert
# bin/lib/tt-visuals/enrich-kind-hints.mjs maps marker shapes to kindHints +
# kind fields the renderer dispatch logic depends on.

setopt local_options nullglob

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
ENRICH="$REPO_ROOT/bin/lib/tt-visuals/enrich-kind-hints.mjs"

WORKDIR=$(mktemp -d -t tt-enrich-kh-XXXXXX)
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

# Drafter JSON: one hero, two inline slots. All start without `kind`.
cat > "$WORKDIR/drafter.json" <<'JSON'
{
  "hero":   { "slot": "hero",     "prompt": "hero prompt" },
  "inline": [
    { "slot": "inline-1", "prompt": "inline 1 prompt" },
    { "slot": "inline-2", "prompt": "inline 2 prompt" }
  ]
}
JSON

# Case A: hero-mp4 marker on hero, gif marker on inline-1, plain on inline-2.
cat > "$WORKDIR/slots-a.txt" <<'EOF'
hero-mp4:override:slow fan
inline-1:gif:override:rain hits stone
inline-2:override:still life with cup
EOF

tt_test "hero-mp4 sets kindHints.hero === 'video'"
out=$(node "$ENRICH" "$WORKDIR/drafter.json" "$WORKDIR/slots-a.txt")
val=$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).kindHints.hero ?? "")' "$out")
assert_eq "video" "$val"

tt_test "hero-mp4 also sets j.hero.kind === 'video'"
val=$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).hero.kind ?? "")' "$out")
assert_eq "video" "$val"

tt_test "gif marker sets kindHints['inline-1'] === 'video'"
val=$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).kindHints["inline-1"] ?? "")' "$out")
assert_eq "video" "$val"

tt_test "gif marker sets j.inline[0].kind === 'video'"
val=$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).inline[0].kind ?? "")' "$out")
assert_eq "video" "$val"

tt_test "plain inline-2 marker leaves kindHints['inline-2'] absent"
val=$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).kindHints["inline-2"] === undefined ? "absent" : "PRESENT")' "$out")
assert_eq "absent" "$val"

tt_test "plain inline-2 marker leaves j.inline[1].kind absent"
val=$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).inline[1].kind === undefined ? "absent" : "PRESENT")' "$out")
assert_eq "absent" "$val"

# Case B: image-only post (no gif/mp4 markers at all).
cat > "$WORKDIR/slots-b.txt" <<'EOF'
hero:empty
inline-1:empty
EOF

tt_test "plain hero marker does NOT mark hero as video"
out2=$(node "$ENRICH" "$WORKDIR/drafter.json" "$WORKDIR/slots-b.txt")
val=$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).kindHints.hero === undefined ? "absent" : "PRESENT")' "$out2")
assert_eq "absent" "$val"
val=$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).hero.kind === undefined ? "absent" : "PRESENT")' "$out2")
assert_eq "absent" "$val"
