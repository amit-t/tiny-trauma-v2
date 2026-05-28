#!/usr/bin/env zsh
# tests/visuals/test-edit-prompt.zsh — tt_edit_prompt_for_slot round-trip
# under a no-op EDITOR. Uses /usr/bin/touch as the editor so the temp file is
# updated mtime-only; content is unchanged. Verifies the function exits 0 and
# the prompts JSON keeps the slot's original prompt text byte-for-byte.

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
source "$REPO_ROOT/bin/lib/tt-visuals/pick-ui.zsh"

WORKDIR=$(mktemp -d -t tt-edit-prompt-XXXXXX)
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

PROMPTS="$WORKDIR/.prompts.json"
cat > "$PROMPTS" <<'JSON'
{
  "hero": { "prompt": "a green kettle on a sill", "negative": "no faces", "aspect": "16:9", "tint": "sage" },
  "inline": [
    { "slot": "inline-1", "prompt": "an open window at dusk", "negative": "no faces", "aspect": "4:3", "tint": "sage" }
  ],
  "overrides": {}
}
JSON

before_hero=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1])); process.stdout.write(j.hero.prompt)' "$PROMPTS")
before_inline=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1])); process.stdout.write(j.inline[0].prompt)' "$PROMPTS")

tt_test "tt_edit_prompt_for_slot round-trips hero prompt under a no-op editor"
EDITOR=/usr/bin/touch tt_edit_prompt_for_slot "$PROMPTS" "hero"
assert_eq "0" "$?"
after_hero=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1])); process.stdout.write(j.hero.prompt)' "$PROMPTS")
assert_eq "$before_hero" "$after_hero"

tt_test "tt_edit_prompt_for_slot round-trips inline prompt under a no-op editor"
EDITOR=/usr/bin/touch tt_edit_prompt_for_slot "$PROMPTS" "inline-1"
assert_eq "0" "$?"
after_inline=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1])); process.stdout.write(j.inline[0].prompt)' "$PROMPTS")
assert_eq "$before_inline" "$after_inline"

# Real-edit case: use a tiny sed-replacement script as the editor to mutate
# the temp file. Confirms the new prompt is actually written back.
EDITOR_SCRIPT="$WORKDIR/editor.zsh"
cat > "$EDITOR_SCRIPT" <<'EOF'
#!/usr/bin/env zsh
print -r -- "a brand new prompt about the rain" > "$1"
EOF
chmod +x "$EDITOR_SCRIPT"

tt_test "tt_edit_prompt_for_slot writes edited prompt back to JSON"
EDITOR="$EDITOR_SCRIPT" tt_edit_prompt_for_slot "$PROMPTS" "inline-1"
assert_eq "0" "$?"
new_inline=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1])); process.stdout.write(j.inline[0].prompt)' "$PROMPTS")
assert_eq "a brand new prompt about the rain" "$new_inline"

# Other keys must survive the round-trip.
tt_test "non-prompt keys (negative, aspect, tint) survive the round-trip"
neg=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1])); process.stdout.write(j.inline[0].negative)' "$PROMPTS")
asp=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1])); process.stdout.write(j.inline[0].aspect)' "$PROMPTS")
tnt=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1])); process.stdout.write(j.inline[0].tint)' "$PROMPTS")
assert_eq "no faces" "$neg"
assert_eq "4:3" "$asp"
assert_eq "sage" "$tnt"
