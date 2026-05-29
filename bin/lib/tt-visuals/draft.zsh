#!/usr/bin/env zsh
# bin/lib/tt-visuals/draft.zsh — call the drafter engine and validate JSON.
# Sourced, not executed. Reads env:
#   TT_DRAFT_ENGINE_BIN  — path to the drafter CLI (default: `claude`)
#   TT_SKILL_DIR         — path to .claude/skills/tt-visuals (default: derive)
#   TT_CONTENT_SKILL_DIR — path to tiny-trauma-content skill (for voice-rules.md)

[[ -n "${_TT_DRAFT_SOURCED:-}" ]] && return 0
typeset -g _TT_DRAFT_SOURCED=1

# Usage: tt_run_drafter <mdx-path> <slots-json>
# Echoes normalized drafter JSON (prose stripped) to stdout. Returns 0 on
# success, 4 on validate fail after retries.
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

  # claude / codex / gemini CLIs use `-p`/`--print` as a NON-INTERACTIVE flag
  # (not "prompt-file"). The prompt itself is read from stdin. Piping from
  # the file avoids shell-quoting issues with large prompts.
  local -i attempt=0
  local raw normalized
  while (( attempt < 2 )); do
    raw=$("$drafter_bin" -p < "$prompt_file" 2>/dev/null)
    normalized=$(tt__normalize_and_validate_draft_json "$raw" "$slots_json")
    if [[ -n "$normalized" ]]; then
      rm -f "$prompt_file"
      print -r -- "$normalized"
      return 0
    fi
    (( attempt++ ))
  done

  rm -f "$prompt_file"
  print -ru2 -- "draft: drafter returned invalid JSON twice"
  return 4
}

# Internal: extract + validate the drafter JSON.
#
# Real drafter CLIs (claude, gemini, codex) often wrap the JSON in prose
# preamble / postscript despite the prompt's strict-JSON instruction.
# Strategy: try strict JSON.parse first; on failure, brace-match the first
# top-level `{...}` substring and parse that. Acceptance criteria stay strict.
#
# Strict checks:
#   - shape: { hero: object|null, inline: array }
#   - if "hero" in $slots_json → j.hero must be a non-null object with string prompt
#   - if "hero" NOT in $slots_json → j.hero must be null (non-null = reject)
#   - every j.inline[].slot must appear in $slots_json
#   - every requested inline slot must appear exactly once in j.inline
#
# On success: prints the extracted+canonicalized JSON to stdout (caller writes
# THIS, not the raw prose-wrapped response, to `.prompts.json`).
# On failure: prints nothing.
tt__normalize_and_validate_draft_json() {
  local raw="$1" slots_json="$2"
  node -e '
    const raw = process.argv[1];
    const slots = JSON.parse(process.argv[2]);
    function extractFirstJsonObject(s) {
      let depth = 0, start = -1, inStr = false, esc = false;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (inStr) {
          if (esc) { esc = false; continue; }
          if (c === "\\") { esc = true; continue; }
          if (c === "\"") inStr = false;
          continue;
        }
        if (c === "\"") { inStr = true; continue; }
        if (c === "{") { if (depth === 0) start = i; depth++; continue; }
        if (c === "}") {
          depth--;
          if (depth === 0 && start >= 0) return s.slice(start, i + 1);
        }
      }
      return null;
    }
    let j, normalized;
    try {
      try { j = JSON.parse(raw); normalized = raw; }
      catch (_) {
        const obj = extractFirstJsonObject(raw);
        if (!obj) process.exit(1);
        j = JSON.parse(obj);
        normalized = obj;
      }
      if (!("hero" in j) || !("inline" in j)) process.exit(1);
      if (!Array.isArray(j.inline)) process.exit(1);
      const wantHero = slots.includes("hero");
      if (wantHero) {
        if (!j.hero || typeof j.hero.prompt !== "string") process.exit(1);
      } else {
        if (j.hero !== null) process.exit(1);
      }
      const wantInline = new Set(slots.filter(s => s !== "hero"));
      const sawInline = new Set();
      for (const e of j.inline) {
        if (typeof e.slot !== "string" || typeof e.prompt !== "string") process.exit(1);
        if (!wantInline.has(e.slot)) process.exit(1);
        if (sawInline.has(e.slot)) process.exit(1);
        sawInline.add(e.slot);
      }
      for (const s of wantInline) {
        if (!sawInline.has(s)) process.exit(1);
      }
      // Print the canonicalised JSON (re-serialised for clean shape).
      process.stdout.write(JSON.stringify(j));
      process.exit(0);
    } catch (_) { process.exit(1); }
  ' "$raw" "$slots_json" 2>/dev/null
}

# Backwards-compat shim: old name returns 0/1 based on whether normalize
# succeeded. Kept so existing tests that call the old name don't break.
tt__validate_draft_json() {
  local out
  out=$(tt__normalize_and_validate_draft_json "$1" "$2")
  [[ -n "$out" ]]
}
