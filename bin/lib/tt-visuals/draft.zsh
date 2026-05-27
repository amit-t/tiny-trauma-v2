#!/usr/bin/env zsh
# bin/lib/tt-visuals/draft.zsh — call the drafter engine and validate JSON.
# Sourced, not executed. Reads env:
#   TT_DRAFT_ENGINE_BIN  — path to the drafter CLI (default: `claude`)
#   TT_SKILL_DIR         — path to .claude/skills/tt-visuals (default: derive)
#   TT_CONTENT_SKILL_DIR — path to tiny-trauma-content skill (for voice-rules.md)

[[ -n "${_TT_DRAFT_SOURCED:-}" ]] && return 0
typeset -g _TT_DRAFT_SOURCED=1

# Usage: tt_run_drafter <mdx-path> <slots-json>
# Echoes drafter JSON to stdout. Returns 0 on success, 4 on validate fail.
tt_run_drafter() {
  local mdx_path="$1" slots_json="$2"
  local drafter_bin="${TT_DRAFT_ENGINE_BIN:-claude}"
  local skill_dir="${TT_SKILL_DIR:-$HOME/.claude/skills/tt-visuals}"
  local content_skill_dir="${TT_CONTENT_SKILL_DIR:-$HOME/.claude/skills/tiny-trauma-content}"

  local prompt_file
  prompt_file=$(mktemp -t tt-visuals-draft-XXXXXX)
  {
    [[ -f "$content_skill_dir/voice-rules.md" ]] && cat "$content_skill_dir/voice-rules.md"
    print -r -- ""
    [[ -f "$skill_dir/visual-style.md" ]] && cat "$skill_dir/visual-style.md"
    print -r -- ""
    [[ -f "$skill_dir/prompts/draft-prompts.md" ]] && cat "$skill_dir/prompts/draft-prompts.md"
    print -r -- ""
    print -r -- "MDX_POST:"
    cat "$mdx_path"
    print -r -- ""
    print -r -- "SLOTS_JSON: $slots_json"
  } > "$prompt_file"

  local -i attempt=0
  local raw
  while (( attempt < 2 )); do
    raw=$("$drafter_bin" -p "$prompt_file" 2>/dev/null)
    if tt__validate_draft_json "$raw" "$slots_json"; then
      rm -f "$prompt_file"
      print -r -- "$raw"
      return 0
    fi
    (( attempt++ ))
  done

  rm -f "$prompt_file"
  print -ru2 -- "draft: drafter returned invalid JSON twice"
  return 4
}

# Internal: validate that $1 parses as JSON and matches the slot list $2.
tt__validate_draft_json() {
  local raw="$1" slots_json="$2"
  node -e '
    const raw = process.argv[1];
    const slots = JSON.parse(process.argv[2]);
    try {
      const j = JSON.parse(raw);
      if (!("hero" in j) || !("inline" in j)) process.exit(1);
      if (!Array.isArray(j.inline)) process.exit(1);
      const wantHero = slots.includes("hero");
      if (wantHero && (!j.hero || typeof j.hero.prompt !== "string")) process.exit(1);
      if (!wantHero && j.hero !== null) {
        // tolerate non-null but ignored
      }
      for (const e of j.inline) {
        if (typeof e.slot !== "string" || typeof e.prompt !== "string") process.exit(1);
      }
      process.exit(0);
    } catch (_) { process.exit(1); }
  ' "$raw" "$slots_json" 2>/dev/null
}
