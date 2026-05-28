#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-claude-flaky.zsh — fake `claude` binary that
# fails on the first invocation and succeeds on the second. Used to cover
# the drafter's retry branch.
#
# The counter file path is taken from $TT_FLAKY_COUNTER (set by the test),
# defaulting to $TMPDIR/tt-flaky-counter for safety.
#
# Invocation contract (matches real claude CLI):
#   claude -p < <prompt-file>

set -u

# Discard the `-p` / `--print` flag if present.
while (( $# > 0 )); do
  case "$1" in
    -p|--print) shift ;;
    *)          shift ;;
  esac
done

prompt=$(cat)

counter_file="${TT_FLAKY_COUNTER:-${TMPDIR:-/tmp}/tt-flaky-counter}"
typeset -i n=0
[[ -f "$counter_file" ]] && n=$(<"$counter_file")
(( n++ ))
print -r -- "$n" > "$counter_file"

if (( n == 1 )); then
  # First call: emit garbage (parser must fail).
  print -r -- "this is not json"
  exit 0
fi

# Second call onwards: emit valid JSON matching the slot list.
slots_json=$(print -r -- "$prompt" | grep '^SLOTS_JSON: ' | head -1 | sed 's/^SLOTS_JSON: //')
node -e '
const slots = JSON.parse(process.argv[1] || "[]");
const out = { hero: null, inline: [] };
for (const s of slots) {
  const entry = {
    prompt: "a hand-drawn editorial illustration",
    negative: "no faces",
    aspect: s === "hero" ? "16:9" : "4:3",
    tint: "sage",
  };
  if (s === "hero") out.hero = entry;
  else out.inline.push({ slot: s, ...entry });
}
process.stdout.write(JSON.stringify(out));
' "$slots_json"
