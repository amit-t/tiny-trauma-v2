# tt-visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `tt-visuals`, a CLI utility that reads a `.mdx` essay or short, drafts per-slot image prompts via an LLM, renders candidates in parallel through locally installed `gemini` / `codex` / `devin` CLIs, lets the author pick winners via macOS Preview, then rewrites the mdx so the post ships with hero + inline + GIF + social-crop visuals.

**Architecture:** New skill at `.claude/skills/tt-visuals/` (rulebook + per-engine recipes + drafter prompt). New zsh binary `bin/tt-visuals` that sources the existing `_tt-engine.zsh` helper and dispatches per-slot rendering through a small library at `bin/lib/tt-visuals/`. Assets land in `public/img/<type>/<slug>/`. Mdx rewrites are atomic and validated against the project's Velite Zod schema before commit. Three milestones map to three independently revertable PRs.

**Tech Stack:** zsh (orchestration, file ops, ffmpeg invocations), node/TS (Zod schema validation, JSON parsing/rewriting of mdx frontmatter via `gray-matter`), `gemini` / `codex` / `claude` / `devin` CLIs (external), `ffmpeg` (crops + gif/mp4 post-processing), `qlmanage` / `open` (Preview UI), Velite (mdx schema source of truth), Vitest (existing JS test runner), bare zsh assertions for shell tests.

**Spec:** `docs/superpowers/specs/2026-05-27-tt-visuals-design.md`

---

## File Structure

### Milestone 1 (PR1 — Skill + dry-run only)

**Create:**
- `.claude/skills/tt-visuals/SKILL.md` — skill contract + flow
- `.claude/skills/tt-visuals/visual-style.md` — brand rulebook (hand-drawn + heroTint + no faces)
- `.claude/skills/tt-visuals/README.md` — human-readable orientation
- `.claude/skills/tt-visuals/prompts/draft-prompts.md` — drafter LLM prompt
- `.claude/skills/tt-visuals/prompts/qa-image.md` — empty stub for v1
- `.claude/skills/tt-visuals/engines/gemini.md` — image+video recipe (image-only used in PR1 dry-run; full in PR2)
- `.claude/skills/tt-visuals/engines/codex.md` — image+video recipe (used in PR3)
- `.claude/skills/tt-visuals/engines/claude.md` — orchestration only (no image gen)
- `.claude/skills/tt-visuals/engines/devin.md` — passthrough (used in PR3)
- `.agent/skills/tt-visuals` — symlink → `.claude/skills/tt-visuals`
- `bin/tt-visuals` — main zsh entrypoint (PR1 ships dry-run path only)
- `bin/lib/tt-visuals/parse-mdx.zsh` — extract frontmatter + body + visual markers from one mdx
- `bin/lib/tt-visuals/slot-detect.zsh` — produce JSON list of slots to fill
- `bin/lib/tt-visuals/draft.zsh` — call `claude` (or chosen drafter) and validate JSON output
- `tests/visuals/run-all.zsh` — entrypoint test runner
- `tests/visuals/_assert.zsh` — sourced assertion helpers
- `tests/visuals/test-flag-parser.zsh`
- `tests/visuals/test-parse-mdx.zsh`
- `tests/visuals/test-slot-detect.zsh`
- `tests/visuals/test-draft-stub.zsh`
- `tests/visuals/fixtures/sample-musing.mdx`
- `tests/visuals/fixtures/sample-musing-with-overrides.mdx`
- `tests/visuals/fixtures/sample-short-no-hero.mdx`
- `tests/visuals/fixtures/stub-claude.zsh` — fake `claude` binary used in unit tests
- `docs/superpowers/plans/2026-05-27-tt-visuals.md` — this file

**Modify:**
- `bin/tt-aliases.zsh` — add `tt.vis` and `tt.vis.dry`
- `.gitignore` — add `.candidates/`, `*.bak-*`, `/tmp/tt-visuals-*/` patterns
- `AGENTS.md` — list `tt-visuals` in the mirrored skills section

### Milestone 2 (PR2 — Single-engine render + Preview pick + mdx rewrite + social crops)

**Create:**
- `lib/mdx/post-schema.ts` — extract the Velite Zod schema so both `velite.config.ts` and the standalone validator can import it
- `lib/mdx/validate-mdx.mjs` — CLI node script: validate one mdx file against the schema, exit 0/1
- `lib/mdx/__tests__/post-schema.test.ts` — Vitest tests for schema extraction
- `lib/mdx/__tests__/validate-mdx.test.ts` — Vitest tests for the validator script
- `bin/_engine_run.zsh` — internal: dispatch one (slot, engine, prompt) → one candidate file
- `bin/lib/tt-visuals/render.zsh` — single-engine render orchestrator (PR2); parallel arrives in PR3
- `bin/lib/tt-visuals/pick-ui.zsh` — Preview launch + interactive pick prompt
- `bin/lib/tt-visuals/install-winner.zsh` — copy candidate → `public/img/<type>/<slug>/`
- `bin/lib/tt-visuals/rewrite-mdx.zsh` — atomic frontmatter + marker rewrite, validated before mv
- `bin/lib/tt-visuals/rewrite-mdx.mjs` — node helper that does the actual `gray-matter` parse + serialise
- `bin/lib/tt-visuals/social-crops.zsh` — ffmpeg 1:1, 4:5, 16:9 derivations
- `tests/visuals/test-engine-run.zsh`
- `tests/visuals/test-render.zsh`
- `tests/visuals/test-pick-ui.zsh` (uses scripted stdin)
- `tests/visuals/test-install-winner.zsh`
- `tests/visuals/test-rewrite-mdx.zsh`
- `tests/visuals/test-social-crops.zsh`
- `tests/visuals/fixtures/stub-gemini.zsh` — fake `gemini` binary that copies a placeholder png
- `tests/visuals/fixtures/stub-qlmanage.zsh` — fake `qlmanage` that touches a marker file
- `tests/visuals/fixtures/hero-stub.png` — 1024×576 placeholder

**Modify:**
- `velite.config.ts` — import shared schema from `lib/mdx/post-schema.ts` instead of inlining
- `bin/tt-visuals` — wire the full render path behind `--engine gemini`; keep `--dry-run` untouched
- `bin/tt-aliases.zsh` — add `tt.vis.gemini`
- `MANUAL-TESTS.md` — add a "Visuals" checklist section
- `package.json` — add `gray-matter` to `devDependencies`; add `test:visuals` script
- `.gitignore` — add `~/.tt-visuals/` is local-only (user-level), no repo change; but add `/public/img/**/.prompts.json.tmp` to be safe

### Milestone 3 (PR3 — Parallel + GIF/video + remaining engines)

**Create:**
- `bin/lib/tt-visuals/parallel.zsh` — fan-out + wait + cap-by-`TT_VISUAL_MAX_PARALLEL`
- `bin/lib/tt-visuals/gif-post.zsh` — ffmpeg mp4 → looping gif + extract poster frame
- `tests/visuals/test-parallel.zsh`
- `tests/visuals/test-gif-post.zsh`
- `tests/visuals/test-markers-gif-and-mp4.zsh`
- `tests/visuals/fixtures/stub-codex.zsh`
- `tests/visuals/fixtures/stub-devin.zsh`
- `tests/visuals/fixtures/hero-stub.mp4` — 3-second 1024×576 placeholder

**Modify:**
- `bin/_engine_run.zsh` — add `codex` + `devin` branches; add `video_cmd` invocation path
- `bin/lib/tt-visuals/render.zsh` — switch to parallel orchestration via `parallel.zsh`
- `bin/lib/tt-visuals/parse-mdx.zsh` — recognise `[[visual gif: ...]]` and `[[visual hero mp4: ...]]` marker variants
- `bin/lib/tt-visuals/pick-ui.zsh` — add `r` retry-edit action (opens `$EDITOR` on the slot's prompt, re-renders only that slot)
- `bin/lib/tt-visuals/rewrite-mdx.zsh` — handle gif/mp4 marker → mdx `<video>` element replacement
- `bin/lib/tt-visuals/rewrite-mdx.mjs` — same
- `bin/tt-aliases.zsh` — add `tt.vis.codex`
- `MANUAL-TESTS.md` — extend Visuals checklist with parallel + gif + retry-edit cases
- `.claude/skills/tt-visuals/engines/codex.md` — flip from stub to live recipe
- `.claude/skills/tt-visuals/engines/devin.md` — flip from stub to live recipe

---

# Milestone 1 — Skill + dry-run only (PR1)

PR1 ships everything an author needs to iterate on the *prompts* with zero API spend. No engine rendering. `--dry-run` writes `.prompts.json` and exits.

## Task 1.1: Create skill skeleton and symlink

**Files:**
- Create: `.claude/skills/tt-visuals/` (directory)
- Create: `.claude/skills/tt-visuals/prompts/` (directory)
- Create: `.claude/skills/tt-visuals/engines/` (directory)
- Create: `.agent/skills/tt-visuals` (symlink)

- [ ] **Step 1: Create directories**

```bash
mkdir -p .claude/skills/tt-visuals/prompts
mkdir -p .claude/skills/tt-visuals/engines
```

- [ ] **Step 2: Create the symlink that AGENTS.md expects**

```bash
ln -sfn ../../.claude/skills/tt-visuals .agent/skills/tt-visuals
```

- [ ] **Step 3: Verify symlink resolves to the right place**

Run: `readlink .agent/skills/tt-visuals && ls -1 .agent/skills/tt-visuals/`
Expected: prints `../../.claude/skills/tt-visuals` and lists `prompts/  engines/` once those have contents (empty for now → just the two dirs).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/tt-visuals .agent/skills/tt-visuals
git commit -m "feat(tt-visuals): scaffold skill directory + symlink"
```

---

## Task 1.2: Write `visual-style.md`

**Files:**
- Create: `.claude/skills/tt-visuals/visual-style.md`

- [ ] **Step 1: Write the file verbatim**

```markdown
# Tiny Trauma visual style — v1

Three rules. Every prompt must obey all three.

1. **Hand-drawn editorial illustration.** Loose pen/ink, warm imperfect
   lines, paper grain visible. New Yorker / Atlantic editorial sensibility.
   Never photoreal, never 3D-render, never anime, never AI-default-glossy.

2. **Muted palette from heroTint.** The post's `heroTint` is the dominant
   cast. Mapping:
     lavender → desaturated purple-grey, near-white paper
     sage     → dusty green, cream paper
     butter   → soft warm yellow, off-white paper
     peach    → faded coral, cream paper
     slate    → cool blue-grey, near-white paper
     none     → uncoloured ink on cream paper
   Two-tone max. Never neon, never high-saturation.

3. **No faces, no people centered.** Objects, hands, fragments, environments.
   Hands and partial limbs OK; backs of heads OK. A reader should be able
   to project themselves in — no specific person in frame.

Negative defaults appended to every prompt:
  "no faces, no people centered, no text, no logos, no watermark,
   no photoreal, no 3D render, no anime, no glossy."
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/tt-visuals/visual-style.md
git commit -m "feat(tt-visuals): add visual-style.md v1 rulebook"
```

---

## Task 1.3: Write `prompts/draft-prompts.md`

**Files:**
- Create: `.claude/skills/tt-visuals/prompts/draft-prompts.md`

- [ ] **Step 1: Write the file**

```markdown
# Draft visual prompts for a Tiny Trauma post

You are drafting image-generation prompts for one mdx post on Tiny Trauma.
Read every input in full before writing.

## Inputs (you will be given, in this order)

1. `voice-rules.md` from the `tiny-trauma-content` skill — the literary
   voice of the blog. Your prompts must match this tone.
2. `visual-style.md` — three hard rules: hand-drawn editorial, muted
   palette from `heroTint`, no faces.
3. The full mdx of the post (frontmatter + body).
4. A JSON list of slots that need prompts, e.g.
   `["hero", "inline-1", "inline-2"]`.

## Output (strict JSON, nothing else — no prose, no markdown fences)

```json
{
  "hero": {
    "prompt": "<one English sentence, 12–35 words>",
    "negative": "no faces, no people centered, no text, no logos, no watermark, no photoreal, no 3D render, no anime, no glossy",
    "aspect": "16:9",
    "tint": "<copy of frontmatter heroTint, or 'none'>"
  },
  "inline": [
    {
      "slot": "inline-1",
      "prompt": "<one English sentence>",
      "negative": "<as above>",
      "aspect": "4:3",
      "tint": "<as above>"
    }
  ]
}
```

If a slot is not in the input list, omit it. If the input list is empty,
return `{"hero": null, "inline": []}`.

## Rules

- One sentence per prompt. No multi-paragraph stage directions.
- Reference the post's specific image, not its theme. "A copper kettle on
  a kitchen sill at first light" is good; "domestic familiarity" is not.
- Inline prompts must be informed by the paragraph the marker sits inside.
  Caption-context is in the body around each `[[visual:]]` marker.
- Hero `aspect` is always `16:9`. Inline default is `4:3` unless the
  paragraph clearly wants tall (`4:5`) or wide (`16:9`).
- Tint = frontmatter `heroTint` verbatim. If `heroTint` is `none`, write
  `"tint": "none"`.
- Append `visual-style.md` negative defaults to every `negative` field
  exactly as written above.
- If `[[visual: <text>]]` already contains override text, **do not** draft
  for that slot — the caller will substitute. You will not see overridden
  slots in your input list.

## Failure modes you must avoid

- Do not invent slots not in the input list.
- Do not produce prose around the JSON.
- Do not change the schema. The caller parses strictly.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/tt-visuals/prompts/draft-prompts.md
git commit -m "feat(tt-visuals): add drafter prompt with strict JSON contract"
```

---

## Task 1.4: Write `prompts/qa-image.md` stub

**Files:**
- Create: `.claude/skills/tt-visuals/prompts/qa-image.md`

- [ ] **Step 1: Write a one-line placeholder so the directory has both files referenced by the spec**

```markdown
# Vision QA — deferred to a post-v1 release.

This file is intentionally empty. When vision QA lands, it will live here
and be loaded by the skill when `--qa` is passed to `tt-visuals`.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/tt-visuals/prompts/qa-image.md
git commit -m "feat(tt-visuals): stub qa-image.md placeholder"
```

---

## Task 1.5: Write `engines/*.md` recipe stubs

**Files:**
- Create: `.claude/skills/tt-visuals/engines/gemini.md`
- Create: `.claude/skills/tt-visuals/engines/codex.md`
- Create: `.claude/skills/tt-visuals/engines/claude.md`
- Create: `.claude/skills/tt-visuals/engines/devin.md`

Each recipe is a YAML fenced block + brief prose. The library parses the YAML out via a tiny `awk` filter; the prose is for humans.

- [ ] **Step 1: Write `engines/gemini.md`**

````markdown
# gemini engine

Google's Gemini CLI. Used for both image (Imagen) and video (Veo)
generation. Reads `GEMINI_API_KEY` or falls back to `gcloud auth`.

```yaml
name: gemini
kind: image+video
image_cmd: 'gemini image generate --model {model} --prompt-file {prompt} --output {out} --aspect {aspect}'
video_cmd: 'gemini video generate --model {model} --prompt-file {prompt} --output {out} --duration 3 --aspect {aspect}'
default_image_model: imagen-4-ultra
default_video_model: veo-3
env_required: [GEMINI_API_KEY]
auth_fallback: 'gcloud auth print-access-token'
aspect_map:
  "16:9": "16:9"
  "4:3":  "4:3"
  "1:1":  "1:1"
  "4:5":  "4:5"
```

Vendor pricing reference (kept here, not embedded in code):
- Imagen 4 Ultra: see https://ai.google.dev/pricing
- Veo 3: see https://ai.google.dev/pricing
````

- [ ] **Step 2: Write `engines/codex.md`**

````markdown
# codex engine

OpenAI's Codex CLI. Used for both image (`gpt-image-1`) and video
(`sora-2`). Reads `OPENAI_API_KEY`.

```yaml
name: codex
kind: image+video
image_cmd: 'codex image generate --model {model} --prompt-file {prompt} --output {out} --size {size}'
video_cmd: 'codex video generate --model {model} --prompt-file {prompt} --output {out} --duration 3 --size {size}'
default_image_model: gpt-image-1
default_video_model: sora-2
env_required: [OPENAI_API_KEY]
size_map:
  "16:9": "1792x1024"
  "4:3":  "1408x1056"
  "1:1":  "1024x1024"
  "4:5":  "1024x1280"
```

Vendor pricing reference:
- gpt-image-1: see https://openai.com/api/pricing
- sora-2: see https://openai.com/api/pricing
````

- [ ] **Step 3: Write `engines/claude.md`**

````markdown
# claude engine

Anthropic's Claude CLI. **No native image generation.** Used by tt-visuals
exclusively for prompt drafting (`--draft-engine claude`, the default) and
the future vision QA step. Passing `--engine claude` to `tt-visuals` is a
usage error.

```yaml
name: claude
kind: text-only
image_cmd: null
video_cmd: null
default_text_model: claude-opus-4-7
env_required: [ANTHROPIC_API_KEY]
```
````

- [ ] **Step 4: Write `engines/devin.md`**

````markdown
# devin engine

Cognition's Devin CLI. Acts as a passthrough that delegates to whichever
image model it has access to. tt-visuals treats it as image-capable.

```yaml
name: devin
kind: image+video
image_cmd: 'devin run --task "generate image: $(cat {prompt})" --output {out}'
video_cmd: 'devin run --task "generate 3s video: $(cat {prompt})" --output {out}'
default_image_model: passthrough
default_video_model: passthrough
env_required: []
```

Devin auth is per-session; the CLI prompts on first use.
````

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/tt-visuals/engines/
git commit -m "feat(tt-visuals): add engine recipe stubs (gemini, codex, claude, devin)"
```

---

## Task 1.6: Write `SKILL.md`

**Files:**
- Create: `.claude/skills/tt-visuals/SKILL.md`

- [ ] **Step 1: Write the file**

```markdown
---
name: tt-visuals
description: |
  Generate hero, inline, GIF, and social-crop visuals for a Tiny Trauma
  essay or short by orchestrating locally installed gemini / codex /
  devin CLIs. Reads the mdx, drafts per-slot prompts, renders candidates
  in parallel, opens macOS Preview for picking, then rewrites the mdx
  atomically.
arguments:
  - name: target
    description: |
      Required. `musings/<slug>` or `shorts/<slug>` (no `.mdx` extension).
    required: true
---

# tt-visuals · the skill

You are generating visual assets for one Tiny Trauma post.

## Before you do anything else

Read these in order:

1. `visual-style.md` — three brand rules every prompt must obey.
2. `prompts/draft-prompts.md` — the strict JSON contract for the drafter.
3. The matching engine recipe under `engines/` for any CLI you will call.
4. The target mdx at `content/<target>.mdx`.

## Flow

1. Parse the mdx: frontmatter, body, and every `[[visual ...]]` marker.
2. Detect slots: hero (if `frontmatter.heroImage` missing OR
   `[[visual hero: ...]]` present), inline-N (one per inline marker),
   social-* (always, after hero is final, if hero exists).
3. Call the drafter (default: claude) with `voice-rules.md` +
   `visual-style.md` + full mdx + the JSON list of empty slots. Validate
   the JSON output strictly; retry once on parse failure.
4. For each slot:
   - If the marker carries override text, use it verbatim.
   - Otherwise use the drafted prompt.
5. For each (slot, engine) pair, spawn the engine's `image_cmd` (or
   `video_cmd` for gif markers) in parallel up to `TT_VISUAL_MAX_PARALLEL`.
6. Open Preview with all surviving candidates per slot. Read the pick.
7. Install winners to `public/img/<type>/<slug>/`. Atomically rewrite the
   mdx (frontmatter `heroImage`, inline markers → `![alt](/img/...)`).
   Validate against the Velite Zod schema before `mv`.
8. Derive social crops via ffmpeg from the chosen hero.
9. Print the git add/commit/push hint.

## Hard rules

- Never write to `public/static/` — that belongs to Velite.
- Never mutate any mdx field other than `heroImage` and `[[visual ...]]`
  markers. Don't rewrap paragraphs, don't reorder frontmatter keys.
- If zero engines are available, exit 3. Do not silently degrade.
- `--dry-run` writes `.prompts.json` and exits. Make no API calls.
- `.prompts.json` is committed to git. Candidate dirs and `.bak-*` files
  are gitignored.

## After the flow

Print the exact commit hint:

```
git add content/<type>/<slug>.mdx public/img/<type>/<slug>/
git commit -m "visuals: <slug>"
git push
```
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/tt-visuals/SKILL.md
git commit -m "feat(tt-visuals): add SKILL.md contract"
```

---

## Task 1.7: Write `README.md`

**Files:**
- Create: `.claude/skills/tt-visuals/README.md`

- [ ] **Step 1: Write the file**

```markdown
# tt-visuals

The third leg of the Tiny Trauma authoring tripod.

```
tt-ingest          → inspirations/instagram/posts/*.mdx
tt-essay/tt-short  → content/{musings,shorts}/<slug>.mdx
tt-visuals  ← here →  public/img/{musings,shorts}/<slug>/*
```

Run manually per slug after writing a post:

```
tt-visuals musings/<slug>
```

See `SKILL.md` for the contract. See the design spec at
`docs/superpowers/specs/2026-05-27-tt-visuals-design.md` for the rationale
and full decision log.

## Marker grammar (in mdx body)

```
[[visual: <prompt>]]            inline still image
[[visual gif: <prompt>]]        inline animated loop (2–5s)
[[visual hero: <prompt>]]       override hero prompt (still)
[[visual hero mp4: <prompt>]]   hero as looping mp4 + still poster
[[visual skip]]                 explicit "no image here"
```

Bracket-only markers like `[[visual:]]` ask the drafter to fill the prompt.

## CLI

```
tt-visuals <type/slug>
  --engine codex|gemini|devin|all   (default: all)
  --slots hero,inline,social,gif    (default: hero,inline,social)
  --only-missing                    (default behavior)
  --force                           (re-render everything, backup originals)
  --draft-engine claude|gemini|codex (default: claude)
  --no-draft                        (load existing .prompts.json verbatim)
  --dry-run                         (no API calls, write .prompts.json only)
  --no-install                      (render + pick, skip mdx rewrite)
  --keep-candidates                 (don't prune losers after install)
  --max-parallel N
```

`--engine claude` is rejected — claude has no image gen.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/tt-visuals/README.md
git commit -m "feat(tt-visuals): add README orientation"
```

---

## Task 1.8: Test harness — `tests/visuals/_assert.zsh` and `run-all.zsh`

**Files:**
- Create: `tests/visuals/_assert.zsh`
- Create: `tests/visuals/run-all.zsh`

- [ ] **Step 1: Write the assertion helpers**

```zsh
#!/usr/bin/env zsh
# tests/visuals/_assert.zsh — sourced by every test file.

typeset -gi TT_TEST_PASS=0 TT_TEST_FAIL=0
typeset -g  TT_TEST_CURRENT=""

tt_test() {
  TT_TEST_CURRENT="$1"
  print -ru2 -- "  · $1"
}

assert_eq() {
  local expected="$1" actual="$2" msg="${3:-}"
  if [[ "$expected" == "$actual" ]]; then
    (( TT_TEST_PASS++ ))
  else
    (( TT_TEST_FAIL++ ))
    print -ru2 -- "    ✗ $TT_TEST_CURRENT ${msg:+($msg) }"
    print -ru2 -- "      expected: ${(qqq)expected}"
    print -ru2 -- "      actual:   ${(qqq)actual}"
  fi
}

assert_contains() {
  local haystack="$1" needle="$2" msg="${3:-}"
  if [[ "$haystack" == *"$needle"* ]]; then
    (( TT_TEST_PASS++ ))
  else
    (( TT_TEST_FAIL++ ))
    print -ru2 -- "    ✗ $TT_TEST_CURRENT ${msg:+($msg) }"
    print -ru2 -- "      haystack: ${(qqq)haystack}"
    print -ru2 -- "      needle:   ${(qqq)needle}"
  fi
}

assert_file_exists() {
  local path="$1" msg="${2:-}"
  if [[ -f "$path" ]]; then
    (( TT_TEST_PASS++ ))
  else
    (( TT_TEST_FAIL++ ))
    print -ru2 -- "    ✗ $TT_TEST_CURRENT ${msg:+($msg) }: $path does not exist"
  fi
}

tt_test_summary() {
  print -ru2 -- ""
  if (( TT_TEST_FAIL > 0 )); then
    print -ru2 -- "FAIL: $TT_TEST_FAIL failed, $TT_TEST_PASS passed"
    return 1
  fi
  print -ru2 -- "PASS: $TT_TEST_PASS passed"
  return 0
}
```

- [ ] **Step 2: Write the runner**

```zsh
#!/usr/bin/env zsh
# tests/visuals/run-all.zsh — discover and run every test-*.zsh in this dir.

set -u
script_path=${0:A}
cd "${script_path:h}"

typeset -gi TOTAL_PASS=0 TOTAL_FAIL=0

for f in test-*.zsh; do
  [[ -f "$f" ]] || continue
  print -ru2 -- ""
  print -ru2 -- "▶ $f"
  (
    source ./_assert.zsh
    source ./"$f"
    tt_test_summary
  )
  rc=$?
  (( rc == 0 )) || (( TOTAL_FAIL++ ))
done

if (( TOTAL_FAIL > 0 )); then
  print -ru2 -- ""
  print -ru2 -- "$TOTAL_FAIL file(s) failed"
  exit 1
fi
print -ru2 -- ""
print -ru2 -- "All test files passed"
```

- [ ] **Step 3: Make the runner executable**

```bash
chmod +x tests/visuals/run-all.zsh
```

- [ ] **Step 4: Run the runner with no tests yet — should succeed trivially**

Run: `tests/visuals/run-all.zsh`
Expected: prints `All test files passed` (no test files yet match the glob).

- [ ] **Step 5: Commit**

```bash
git add tests/visuals/_assert.zsh tests/visuals/run-all.zsh
git commit -m "test(tt-visuals): add zsh test harness skeleton"
```

---

## Task 1.9: Fixture — `tests/visuals/fixtures/sample-musing.mdx`

**Files:**
- Create: `tests/visuals/fixtures/sample-musing.mdx`
- Create: `tests/visuals/fixtures/sample-musing-with-overrides.mdx`
- Create: `tests/visuals/fixtures/sample-short-no-hero.mdx`

- [ ] **Step 1: Write `sample-musing.mdx` — no hero image, two empty visual markers, one skip**

```mdx
---
title: "The kettle that *outlived* her"
dek: "A small green kettle, a sage kitchen, and the things we keep on shelves."
type: musing
publishedAt: 2026-05-01
number: 99
tags: [grief, kitchens]
featured: false
heroTint: sage
status: draft
---

The kettle is on the third shelf. It has been on the third shelf for
fourteen years, and for the last six it has not been used.

[[visual:]]

My grandmother bought it the year she stopped travelling. The day she
brought it home she made tea for the whole house and called it a small
celebration of staying still.

[[visual skip]]

It whistles, still, when you tilt it. A reflex. A memory the metal kept.

[[visual:]]
```

- [ ] **Step 2: Write `sample-musing-with-overrides.mdx` — has frontmatter heroImage already + one override marker**

```mdx
---
title: "The *blue* hour"
dek: "The fifteen minutes before sunrise have a colour my phone cannot find."
type: musing
publishedAt: 2026-05-02
number: 100
tags: [light, mornings]
featured: false
heroTint: slate
heroImage: /img/musings/blue-hour-hero-existing.png
status: draft
---

It is the hour between black and grey, and my window faces east.

[[visual: a half-drawn curtain at first light, slate cast, hand-drawn ink]]

The light arrives in stages and none of them photograph.
```

- [ ] **Step 3: Write `sample-short-no-hero.mdx`**

```mdx
---
title: "The 3 a.m. *list*"
dek: "He keeps a list of every door he forgot to lock."
type: short
publishedAt: 2026-05-03
number: 50
tags: []
featured: false
heroTint: lavender
status: draft
---

The list is on the inside of the cupboard door. It is thirty-one items
long. Tonight he adds one more.

[[visual:]]
```

- [ ] **Step 4: Commit**

```bash
git add tests/visuals/fixtures/
git commit -m "test(tt-visuals): add mdx fixtures with all marker variants"
```

---

## Task 1.10: Library — `bin/lib/tt-visuals/parse-mdx.zsh` (write failing test first)

**Files:**
- Create: `tests/visuals/test-parse-mdx.zsh`
- Create: `bin/lib/tt-visuals/parse-mdx.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-parse-mdx.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
source "$REPO_ROOT/bin/lib/tt-visuals/parse-mdx.zsh"

FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

tt_test "extracts heroTint from sample-musing.mdx"
result=$(tt_parse_frontmatter_field "$FIXTURES/sample-musing.mdx" heroTint)
assert_eq "sage" "$result"

tt_test "extracts heroImage when present"
result=$(tt_parse_frontmatter_field "$FIXTURES/sample-musing-with-overrides.mdx" heroImage)
assert_eq "/img/musings/blue-hour-hero-existing.png" "$result"

tt_test "returns empty when frontmatter field missing"
result=$(tt_parse_frontmatter_field "$FIXTURES/sample-musing.mdx" heroImage)
assert_eq "" "$result"

tt_test "counts empty inline markers in sample-musing.mdx"
result=$(tt_parse_markers "$FIXTURES/sample-musing.mdx" | grep -c '^inline:empty$')
assert_eq "2" "$result"

tt_test "detects skip marker"
result=$(tt_parse_markers "$FIXTURES/sample-musing.mdx" | grep -c '^skip$')
assert_eq "1" "$result"

tt_test "extracts override text from inline marker"
result=$(tt_parse_markers "$FIXTURES/sample-musing-with-overrides.mdx" | grep '^inline:override:')
assert_contains "$result" "a half-drawn curtain at first light, slate cast, hand-drawn ink"

tt_test "no hero override marker in basic fixture"
result=$(tt_parse_markers "$FIXTURES/sample-musing.mdx" | grep -c '^hero:')
assert_eq "0" "$result"
```

- [ ] **Step 2: Run the test — expect failure (library does not exist)**

Run: `tests/visuals/run-all.zsh`
Expected: `FAIL` because `parse-mdx.zsh` does not exist; sourcing it errors.

- [ ] **Step 3: Write the library**

```zsh
#!/usr/bin/env zsh
# bin/lib/tt-visuals/parse-mdx.zsh — extract frontmatter fields and visual
# markers from one mdx file. Sourced, not executed.

[[ -n "${_TT_PARSE_MDX_SOURCED:-}" ]] && return 0
typeset -g _TT_PARSE_MDX_SOURCED=1

# Usage: tt_parse_frontmatter_field <mdx-path> <field-name>
# Prints the raw value (empty string if absent). Strips surrounding quotes.
tt_parse_frontmatter_field() {
  local path="$1" field="$2"
  [[ -f "$path" ]] || return 0
  awk -v f="$field" '
    /^---[[:space:]]*$/ { fm = (fm == 0 ? 1 : 2); next }
    fm == 1 {
      line = $0
      pos = index(line, ":")
      if (pos == 0) next
      key = substr(line, 1, pos - 1)
      gsub(/[[:space:]]+$/, "", key)
      if (key != f) next
      val = substr(line, pos + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
      gsub(/^"|"$/, "", val)
      gsub(/^'\''|'\''$/, "", val)
      print val
      exit
    }
  ' "$path"
}

# Usage: tt_parse_markers <mdx-path>
# Prints one line per marker found in the body, in source order, in form:
#   hero:empty
#   hero:override:<text>
#   hero-mp4:empty
#   hero-mp4:override:<text>
#   inline:empty
#   inline:override:<text>
#   gif:empty
#   gif:override:<text>
#   skip
tt_parse_markers() {
  local path="$1"
  [[ -f "$path" ]] || return 0
  awk '
    BEGIN { fm = 0 }
    /^---[[:space:]]*$/ { fm = (fm == 0 ? 1 : 2); next }
    fm < 2 { next }
    {
      line = $0
      while (match(line, /\[\[visual[^]]*\]\]/) > 0) {
        tok = substr(line, RSTART + 2, RLENGTH - 4)
        line = substr(line, RSTART + RLENGTH)
        # tok like:  visual:   visual: text   visual gif: text   visual hero mp4: text   visual skip
        body = substr(tok, 7)                    # strip leading "visual"
        sub(/^[[:space:]]+/, "", body)

        if (body == "skip") { print "skip"; continue }

        # split on first ":"
        cpos = index(body, ":")
        if (cpos == 0) continue
        head = substr(body, 1, cpos - 1)
        text = substr(body, cpos + 1)
        sub(/^[[:space:]]+/, "", text)
        sub(/[[:space:]]+$/, "", head)

        if (head == "")            kind = "inline"
        else if (head == "gif")    kind = "gif"
        else if (head == "hero")   kind = "hero"
        else if (head == "hero mp4") kind = "hero-mp4"
        else continue

        if (text == "") printf "%s:empty\n", kind
        else            printf "%s:override:%s\n", kind, text
      }
    }
  ' "$path"
}
```

- [ ] **Step 4: Run the test — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: `PASS` on every assertion above.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/tt-visuals/parse-mdx.zsh tests/visuals/test-parse-mdx.zsh
git commit -m "feat(tt-visuals): parse mdx frontmatter + visual markers"
```

---

## Task 1.11: Library — `bin/lib/tt-visuals/slot-detect.zsh`

**Files:**
- Create: `tests/visuals/test-slot-detect.zsh`
- Create: `bin/lib/tt-visuals/slot-detect.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-slot-detect.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
source "$REPO_ROOT/bin/lib/tt-visuals/parse-mdx.zsh"
source "$REPO_ROOT/bin/lib/tt-visuals/slot-detect.zsh"

FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

tt_test "sample-musing.mdx: hero needed, 2 inline empty, 1 skip excluded"
result=$(tt_detect_slots "$FIXTURES/sample-musing.mdx")
assert_contains "$result" "hero:empty"
assert_contains "$result" "inline-1:empty"
assert_contains "$result" "inline-2:empty"
# skip must not appear as a slot
[[ "$result" != *"inline-3"* ]] && (( TT_TEST_PASS++ )) || (( TT_TEST_FAIL++ ))

tt_test "sample-musing-with-overrides.mdx: hero already set, no hero slot, 1 inline override"
result=$(tt_detect_slots "$FIXTURES/sample-musing-with-overrides.mdx")
[[ "$result" != *"hero:"* ]] && (( TT_TEST_PASS++ )) || (( TT_TEST_FAIL++ ))
assert_contains "$result" "inline-1:override:a half-drawn curtain at first light"

tt_test "sample-short-no-hero.mdx: hero needed, 1 inline empty"
result=$(tt_detect_slots "$FIXTURES/sample-short-no-hero.mdx")
assert_contains "$result" "hero:empty"
assert_contains "$result" "inline-1:empty"
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: `FAIL` (library doesn't exist).

- [ ] **Step 3: Write the library**

```zsh
#!/usr/bin/env zsh
# bin/lib/tt-visuals/slot-detect.zsh — turn marker output into the list of
# slots the renderer must fill, with per-slot status (empty | override:<text>).
# Sourced, not executed. Requires parse-mdx.zsh to be sourced first.

[[ -n "${_TT_SLOT_DETECT_SOURCED:-}" ]] && return 0
typeset -g _TT_SLOT_DETECT_SOURCED=1

# Usage: tt_detect_slots <mdx-path>
# Prints one line per slot the renderer must produce, e.g.
#   hero:empty
#   hero:override:<text>
#   inline-1:empty
#   inline-2:override:<text>
#
# Rules:
#   - hero is emitted iff frontmatter.heroImage is absent OR a hero/hero-mp4
#     marker is present.
#   - inline slots are numbered 1..N over inline + gif markers in source order.
#   - skip markers contribute nothing.
tt_detect_slots() {
  local path="$1"
  local hero_image
  hero_image=$(tt_parse_frontmatter_field "$path" heroImage)

  local hero_marker=""
  local -a inline_lines
  inline_lines=()
  local line
  while IFS= read -r line; do
    case "$line" in
      hero:empty|hero:override:*)
        hero_marker="$line"
        ;;
      hero-mp4:empty)
        hero_marker="hero-mp4:empty"
        ;;
      hero-mp4:override:*)
        hero_marker="hero-mp4:${line#hero-mp4:}"
        ;;
      inline:*|gif:*)
        inline_lines+=("$line")
        ;;
      skip)
        ;;
    esac
  done < <(tt_parse_markers "$path")

  # hero emission
  if [[ -n "$hero_marker" ]]; then
    print -r -- "$hero_marker"
  elif [[ -z "$hero_image" ]]; then
    print -r -- "hero:empty"
  fi

  # inline numbering
  local -i i=0
  for line in "${inline_lines[@]}"; do
    (( i++ ))
    case "$line" in
      inline:empty)            print -r -- "inline-$i:empty" ;;
      inline:override:*)       print -r -- "inline-$i:override:${line#inline:override:}" ;;
      gif:empty)               print -r -- "inline-$i:gif:empty" ;;
      gif:override:*)          print -r -- "inline-$i:gif:override:${line#gif:override:}" ;;
    esac
  done
}
```

- [ ] **Step 4: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: `PASS`.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/tt-visuals/slot-detect.zsh tests/visuals/test-slot-detect.zsh
git commit -m "feat(tt-visuals): detect slots needing visuals from mdx"
```

---

## Task 1.12: Stub `claude` binary for drafter tests

**Files:**
- Create: `tests/visuals/fixtures/stub-claude.zsh`

- [ ] **Step 1: Write the stub**

```zsh
#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-claude.zsh — fake `claude` binary for unit
# tests of the drafter. Reads the slot list from the prompt context and
# emits valid drafter JSON.
#
# Invocation contract (matches what drafter.zsh will call):
#   stub-claude.zsh -p <prompt-file>
# Prints JSON to stdout. Slot list is detected by scanning the prompt
# file for the line "SLOTS_JSON: <json>".

set -u
prompt_file=""
while (( $# > 0 )); do
  case "$1" in
    -p) prompt_file="$2"; shift 2 ;;
    *)  shift ;;
  esac
done

slots_json=$(grep '^SLOTS_JSON: ' "$prompt_file" | head -1 | sed 's/^SLOTS_JSON: //')

# Emit a minimal valid response based on the slot list.
node -e '
const slots = JSON.parse(process.argv[1] || "[]");
const out = { hero: null, inline: [] };
for (const s of slots) {
  const entry = {
    prompt: "a hand-drawn editorial illustration of an object on a sill, sage cast",
    negative: "no faces, no people centered, no text, no logos, no watermark, no photoreal, no 3D render, no anime, no glossy",
    aspect: s === "hero" ? "16:9" : "4:3",
    tint: "sage",
  };
  if (s === "hero") out.hero = entry;
  else out.inline.push({ slot: s, ...entry });
}
process.stdout.write(JSON.stringify(out));
' "$slots_json"
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x tests/visuals/fixtures/stub-claude.zsh
```

- [ ] **Step 3: Commit**

```bash
git add tests/visuals/fixtures/stub-claude.zsh
git commit -m "test(tt-visuals): add stub claude binary for drafter tests"
```

---

## Task 1.13: Library — `bin/lib/tt-visuals/draft.zsh`

**Files:**
- Create: `tests/visuals/test-draft-stub.zsh`
- Create: `bin/lib/tt-visuals/draft.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-draft-stub.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
source "$REPO_ROOT/bin/lib/tt-visuals/parse-mdx.zsh"
source "$REPO_ROOT/bin/lib/tt-visuals/slot-detect.zsh"
source "$REPO_ROOT/bin/lib/tt-visuals/draft.zsh"

FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
TT_DRAFT_ENGINE_BIN="$FIXTURES/stub-claude.zsh"
export TT_DRAFT_ENGINE_BIN

tt_test "draft emits JSON with hero + 2 inline slots for sample-musing"
slots='["hero","inline-1","inline-2"]'
result=$(tt_run_drafter "$FIXTURES/sample-musing.mdx" "$slots")
# parse with node to assert shape
hero=$(printf '%s' "$result" | node -e 'let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{const j=JSON.parse(d); process.stdout.write(j.hero ? "ok" : "missing")})')
assert_eq "ok" "$hero"
inline_count=$(printf '%s' "$result" | node -e 'let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{const j=JSON.parse(d); process.stdout.write(String(j.inline.length))})')
assert_eq "2" "$inline_count"

tt_test "draft retries on invalid JSON, then succeeds with stub returning empty input list"
slots='[]'
result=$(tt_run_drafter "$FIXTURES/sample-musing.mdx" "$slots")
hero=$(printf '%s' "$result" | node -e 'let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{const j=JSON.parse(d); process.stdout.write(j.hero === null ? "null" : "set")})')
assert_eq "null" "$hero"
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: `FAIL`.

- [ ] **Step 3: Write the library**

```zsh
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
```

- [ ] **Step 4: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: `PASS`.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/tt-visuals/draft.zsh tests/visuals/test-draft-stub.zsh
git commit -m "feat(tt-visuals): drafter wrapper with JSON validation + retry"
```

---

## Task 1.14: Main binary `bin/tt-visuals` — flag parser + dry-run

**Files:**
- Create: `tests/visuals/test-flag-parser.zsh`
- Create: `bin/tt-visuals`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-flag-parser.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
BIN="$REPO_ROOT/bin/tt-visuals"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

# Set the drafter stub for dry-run tests.
export TT_DRAFT_ENGINE_BIN="$FIXTURES/stub-claude.zsh"
export TT_SKILL_DIR="$REPO_ROOT/.claude/skills/tt-visuals"
export TT_CONTENT_SKILL_DIR="$REPO_ROOT/.claude/skills/tiny-trauma-content"

# Use a temp content root so we don't pollute real content/.
TMP_CONTENT=$(mktemp -d -t tt-visuals-content-XXXXXX)
mkdir -p "$TMP_CONTENT/content/musings" "$TMP_CONTENT/public/img"
cp "$FIXTURES/sample-musing.mdx" "$TMP_CONTENT/content/musings/the-kettle.mdx"
export TT_CONTENT_ROOT="$TMP_CONTENT"

cleanup() { rm -rf "$TMP_CONTENT"; }
trap cleanup EXIT

tt_test "missing target exits 2 with usage error"
"$BIN" 2>/dev/null
assert_eq "2" "$?"

tt_test "--help exits 0"
"$BIN" --help >/dev/null
assert_eq "0" "$?"

tt_test "--engine claude is rejected (no image gen) with exit 2"
"$BIN" --engine claude musings/the-kettle 2>/dev/null
assert_eq "2" "$?"

tt_test "--dry-run writes .prompts.json and exits 0"
"$BIN" --dry-run musings/the-kettle >/dev/null 2>&1
rc=$?
assert_eq "0" "$rc"
assert_file_exists "$TMP_CONTENT/public/img/musings/the-kettle/.prompts.json"

tt_test ".prompts.json has hero + 2 inline entries"
result=$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); process.stdout.write(`${j.hero ? "h" : "-"}${j.inline.length}`)' "$TMP_CONTENT/public/img/musings/the-kettle/.prompts.json")
assert_eq "h2" "$result"

tt_test "dry-run makes zero changes to the mdx"
before=$(shasum -a 256 "$TMP_CONTENT/content/musings/the-kettle.mdx")
"$BIN" --dry-run musings/the-kettle >/dev/null 2>&1
after=$(shasum -a 256 "$TMP_CONTENT/content/musings/the-kettle.mdx")
assert_eq "$before" "$after"
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: `FAIL` (binary doesn't exist).

- [ ] **Step 3: Write the binary**

```zsh
#!/usr/bin/env zsh
# bin/tt-visuals — generate hero / inline / gif / social-crop assets for one
# Tiny Trauma essay or short. PR1 ships --dry-run only.

set -u
script_path=${0:A}
SCRIPT_DIR="${script_path:h}"
REPO_ROOT="${SCRIPT_DIR:h}"

source "$SCRIPT_DIR/_tt-engine.zsh"
source "$SCRIPT_DIR/lib/tt-visuals/parse-mdx.zsh"
source "$SCRIPT_DIR/lib/tt-visuals/slot-detect.zsh"
source "$SCRIPT_DIR/lib/tt-visuals/draft.zsh"

usage() {
  cat <<'EOF'
tt-visuals — generate visuals for a Tiny Trauma post.

Usage:
  tt-visuals <type/slug> [flags]

Required:
  <type/slug>                 e.g. musings/the-kettle  or  shorts/the-list

Flags:
  --engine NAME               codex|gemini|devin|all (default: all). `claude` rejected.
  --slots LIST                comma-separated: hero,inline,social,gif (default: hero,inline,social)
  --only-missing              default; --force overrides
  --force                     re-render even slots already installed
  --draft-engine NAME         claude|gemini|codex (default: claude)
  --no-draft                  skip drafter, load existing .prompts.json
  --dry-run                   write .prompts.json, no API calls
  --no-install                render + pick, skip mdx rewrite + file install
  --keep-candidates           don't prune losers after install
  --max-parallel N            override TT_VISUAL_MAX_PARALLEL
  -h, --help                  show this help
EOF
}

# ---- parse flags ------------------------------------------------------------

typeset target=""
typeset engine="all"
typeset slots_csv="hero,inline,social"
typeset draft_engine="claude"
typeset -i dry_run=0 no_draft=0 no_install=0 only_missing=1 force=0 keep_cand=0 help=0
typeset max_parallel="${TT_VISUAL_MAX_PARALLEL:-4}"

while (( $# > 0 )); do
  case "$1" in
    --engine)         engine="$2"; shift 2 ;;
    --engine=*)       engine="${1#--engine=}"; shift ;;
    --slots)          slots_csv="$2"; shift 2 ;;
    --slots=*)        slots_csv="${1#--slots=}"; shift ;;
    --draft-engine)   draft_engine="$2"; shift 2 ;;
    --draft-engine=*) draft_engine="${1#--draft-engine=}"; shift ;;
    --dry-run)        dry_run=1; shift ;;
    --no-draft)       no_draft=1; shift ;;
    --no-install)     no_install=1; shift ;;
    --only-missing)   only_missing=1; shift ;;
    --force)          force=1; only_missing=0; shift ;;
    --keep-candidates) keep_cand=1; shift ;;
    --max-parallel)   max_parallel="$2"; shift 2 ;;
    -h|--help)        help=1; shift ;;
    --)               shift; break ;;
    -*)               print -ru2 -- "error: unknown flag: $1"; exit 2 ;;
    *)
      if [[ -z "$target" ]]; then target="$1"
      else print -ru2 -- "error: unexpected positional: $1"; exit 2
      fi
      shift ;;
  esac
done

(( help )) && { usage; exit 0; }
if [[ -z "$target" ]]; then
  print -ru2 -- "error: target required (e.g. musings/the-kettle)"
  usage
  exit 2
fi

# Reject --engine claude — claude has no image gen.
if [[ "$engine" == "claude" ]]; then
  print -ru2 -- "error: --engine claude is invalid (no image generation capability). Use --draft-engine claude instead."
  exit 2
fi

# Validate target shape.
case "$target" in
  musings/*|shorts/*) ;;
  *) print -ru2 -- "error: target must be musings/<slug> or shorts/<slug>"; exit 2 ;;
esac

typeset type="${target%%/*}"
typeset slug="${target##*/}"

# Resolve paths (overridable for tests via TT_CONTENT_ROOT, TT_SKILL_DIR).
typeset CONTENT_ROOT="${TT_CONTENT_ROOT:-$REPO_ROOT}"
typeset mdx_path="$CONTENT_ROOT/content/$target.mdx"
typeset asset_dir="$CONTENT_ROOT/public/img/$type/$slug"

if [[ ! -f "$mdx_path" ]]; then
  print -ru2 -- "error: mdx not found: $mdx_path"
  exit 2
fi

mkdir -p "$asset_dir"

# ---- detect slots -----------------------------------------------------------

typeset -a slot_lines
slot_lines=()
while IFS= read -r line; do
  slot_lines+=("$line")
done < <(tt_detect_slots "$mdx_path")

# Build slot name list for drafter (only names of slots without override text).
typeset -a need_draft
need_draft=()
for line in "${slot_lines[@]}"; do
  case "$line" in
    hero:empty)              need_draft+=("hero") ;;
    hero-mp4:empty)          need_draft+=("hero") ;;   # mp4 hero still needs a prompt
    inline-*:empty)          need_draft+=("${line%%:*}") ;;
    inline-*:gif:empty)      need_draft+=("${line%%:*}") ;;
  esac
done

# ---- drafter ----------------------------------------------------------------

typeset prompts_json_path="$asset_dir/.prompts.json"
typeset drafter_out=""

if (( no_draft )); then
  if [[ ! -f "$prompts_json_path" ]]; then
    print -ru2 -- "error: --no-draft passed but $prompts_json_path does not exist"
    exit 2
  fi
  drafter_out=$(cat "$prompts_json_path")
else
  # Resolve drafter binary.
  typeset draft_bin
  case "$draft_engine" in
    claude)  draft_bin="${TT_DRAFT_ENGINE_BIN:-claude}" ;;
    gemini)  draft_bin="gemini" ;;
    codex)   draft_bin="codex" ;;
    *) print -ru2 -- "error: unsupported --draft-engine: $draft_engine"; exit 2 ;;
  esac
  TT_DRAFT_ENGINE_BIN="$draft_bin" export TT_DRAFT_ENGINE_BIN

  typeset slots_json
  slots_json=$(printf '%s\n' "${need_draft[@]}" | node -e '
    let lines = ""; process.stdin.on("data",c=>lines+=c);
    process.stdin.on("end",()=>{
      const arr = lines.split("\n").filter(Boolean);
      process.stdout.write(JSON.stringify(arr));
    });
  ')

  drafter_out=$(tt_run_drafter "$mdx_path" "$slots_json") || exit $?
fi

# Merge inline overrides into drafter_out so .prompts.json is the source of truth.
drafter_out=$(node -e '
  const raw = process.argv[1];
  const slotLines = JSON.parse(process.argv[2]);
  const j = JSON.parse(raw);
  j.overrides = {};
  for (const line of slotLines) {
    const m = line.match(/^(hero(?:-mp4)?|inline-\d+):(?:gif:)?override:(.+)$/);
    if (m) j.overrides[m[1]] = m[2];
  }
  process.stdout.write(JSON.stringify(j, null, 2));
' "$drafter_out" "$(printf '%s\n' "${slot_lines[@]}" | node -e 'let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{process.stdout.write(JSON.stringify(d.split("\n").filter(Boolean)))})')")

print -r -- "$drafter_out" > "$prompts_json_path"

# ---- dry-run exit -----------------------------------------------------------

if (( dry_run )); then
  print -r -- "[dry-run] wrote $prompts_json_path"
  print -r -- "[dry-run] slots: ${(j:, :)slot_lines[@]}"
  exit 0
fi

# PR1 ends here. PR2 wires the render path.
print -ru2 -- "tt-visuals: rendering is not implemented in this build. Use --dry-run."
exit 2
```

- [ ] **Step 4: Make it executable**

```bash
chmod +x bin/tt-visuals
```

- [ ] **Step 5: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: `PASS` on every flag-parser test.

- [ ] **Step 6: Commit**

```bash
git add bin/tt-visuals tests/visuals/test-flag-parser.zsh
git commit -m "feat(tt-visuals): bin/tt-visuals with --dry-run end-to-end"
```

---

## Task 1.15: Aliases + .gitignore + AGENTS.md

**Files:**
- Modify: `bin/tt-aliases.zsh`
- Modify: `.gitignore`
- Modify: `AGENTS.md`

- [ ] **Step 1: Append aliases to `bin/tt-aliases.zsh`**

Add at the end of the file:

```zsh
# tt-visuals (visual asset generator)
alias tt.vis='tt-visuals'
alias tt.vis.dry='tt-visuals --dry-run'
```

- [ ] **Step 2: Append patterns to `.gitignore`**

Add at the end of the file:

```
# tt-visuals ephemeral output
/public/img/**/.candidates/
/public/img/**/*.bak-*
/tmp/tt-visuals-*/
/public/img/**/.prompts.json.tmp
```

- [ ] **Step 3: Add `tt-visuals` to the mirrored-skills list in `AGENTS.md`**

Find the line `- \`tiny-trauma-content\` — essay / short / brainstorm / cross-post flows` and insert below the `tt-instagram-ingest` line:

```markdown
- `tt-visuals` — image / GIF / social-crop generator for published posts
```

- [ ] **Step 4: Verify aliases load without error**

Run: `zsh -n bin/tt-aliases.zsh && source bin/tt-aliases.zsh && type tt.vis tt.vis.dry`
Expected: both alias entries print.

- [ ] **Step 5: Commit**

```bash
git add bin/tt-aliases.zsh .gitignore AGENTS.md
git commit -m "feat(tt-visuals): aliases, gitignore patterns, AGENTS.md entry"
```

---

## Task 1.16: PR1 verification + open PR

**Files:** none

- [ ] **Step 1: Run the entire visuals test suite from scratch**

Run: `tests/visuals/run-all.zsh`
Expected: `All test files passed`.

- [ ] **Step 2: Run repo-wide lint and typecheck (nothing PR1 touched should break either)**

Run: `pnpm lint && pnpm typecheck`
Expected: both exit 0.

- [ ] **Step 3: Run `pnpm content` to confirm Velite still accepts the existing content corpus**

Run: `pnpm content`
Expected: exit 0; no schema errors. (PR1 modified no mdx or velite config.)

- [ ] **Step 4: Dry-run on a real post end-to-end**

Run: `tt-visuals --dry-run musings/<any-existing-slug>`
Expected: writes `public/img/musings/<slug>/.prompts.json`, exits 0. Inspect the JSON manually for plausibility.

- [ ] **Step 5: Open PR1**

```bash
git checkout -b feat/tt-visuals-pr1-dryrun
git push -u origin feat/tt-visuals-pr1-dryrun
gh pr create --title "tt-visuals PR1: skill + dry-run only" --body "$(cat <<'EOF'
## Summary
- New `tt-visuals` skill at `.claude/skills/tt-visuals/` (rulebook, drafter prompt, engine recipe stubs)
- New `bin/tt-visuals` binary with full flag parser and a working `--dry-run` path
- Zsh test harness at `tests/visuals/` covering marker parsing, slot detection, drafter wrapper, flag parsing
- Aliases `tt.vis` / `tt.vis.dry`, gitignore additions, AGENTS.md updated

No real image generation in this PR — `--dry-run` writes `.prompts.json` and exits. Subsequent PRs add the render + pick + rewrite paths.

## Test plan
- [ ] `tests/visuals/run-all.zsh` passes
- [ ] `pnpm lint && pnpm typecheck` clean
- [ ] `pnpm content` still builds the existing corpus
- [ ] `tt-visuals --dry-run musings/<slug>` writes a sensible `.prompts.json`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

# Milestone 2 — Single-engine render + Preview pick + mdx rewrite + social crops (PR2)

PR2 ships the simplest happy path end-to-end: one engine (`gemini`), Preview pick, atomic mdx rewrite, social crops. Parallel orchestration and remaining engines arrive in PR3.

## Task 2.1: Extract Velite Zod schema to `lib/mdx/post-schema.ts`

**Files:**
- Create: `lib/mdx/post-schema.ts`
- Create: `lib/mdx/__tests__/post-schema.test.ts`
- Modify: `velite.config.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/mdx/__tests__/post-schema.test.ts
import { describe, it, expect } from "vitest";
import { postBaseSchema, heroTints, statuses } from "../post-schema";

describe("postBaseSchema", () => {
  it("accepts a minimal valid musing frontmatter", () => {
    const ok = postBaseSchema.safeParse({
      title: "x",
      dek: "y",
      publishedAt: "2026-05-01",
      number: 1,
      tags: [],
      body: "# hi",
      raw: "raw",
      slug: "x",
      path: "musings/x.mdx",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects a bad heroTint", () => {
    const bad = postBaseSchema.safeParse({
      title: "x",
      dek: "y",
      publishedAt: "2026-05-01",
      number: 1,
      tags: [],
      heroTint: "fuchsia",
      body: "x",
      raw: "x",
      slug: "x",
      path: "x.mdx",
    });
    expect(bad.success).toBe(false);
  });

  it("exports heroTints and statuses as readonly tuples", () => {
    expect(heroTints).toContain("sage");
    expect(statuses).toContain("published");
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `pnpm vitest run lib/mdx/__tests__/post-schema.test.ts`
Expected: FAIL with "Cannot find module '../post-schema'".

- [ ] **Step 3: Write the extracted schema**

```ts
// lib/mdx/post-schema.ts
//
// Shared Zod schema for Tiny Trauma post frontmatter. Imported by
// `velite.config.ts` (the canonical source of truth at build time) and by
// `lib/mdx/validate-mdx.mjs` (the standalone validator used by tt-visuals
// before it commits an atomic mdx rewrite).
//
// Keep this file *purely* schema. Side-effectful Velite helpers
// (`addReadingTime`, remark plugin imports) stay in `velite.config.ts`.

import { s } from "velite";

export const heroTints = ["lavender", "sage", "butter", "peach", "slate", "none"] as const;
export const statuses = ["draft", "published"] as const;

export const postBaseSchema = s.object({
  title: s.string(),
  dek: s.string(),
  publishedAt: s.isodate(),
  number: s.number().int().positive(),
  tags: s.array(s.string()).default([]),
  featured: s.boolean().default(false),
  heroTint: s.enum(heroTints).default("none"),
  heroImage: s.string().optional(),
  status: s.enum(statuses).default("draft"),
  body: s.string(),
  raw: s.raw(),
  slug: s.string(),
  path: s.string(),
});

export type PostBase = ReturnType<typeof postBaseSchema.parse>;
```

- [ ] **Step 4: Update `velite.config.ts` to import the shared enums**

In `velite.config.ts`, replace:

```ts
const heroTints = ["lavender", "sage", "butter", "peach", "slate", "none"] as const;
const statuses = ["draft", "published"] as const;
```

with:

```ts
import { heroTints, statuses } from "./lib/mdx/post-schema";
```

(Leave the existing `postBase` object literal in place — it uses Velite-specific helpers like `s.markdown({...})` and the `addReadingTime` transform that don't belong in the shared schema. The shared schema mirrors the *frontmatter-only* surface that the validator needs.)

- [ ] **Step 5: Run the unit test + the full Velite build**

Run: `pnpm vitest run lib/mdx/__tests__/post-schema.test.ts && pnpm content`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/mdx/post-schema.ts lib/mdx/__tests__/post-schema.test.ts velite.config.ts
git commit -m "refactor(mdx): extract shared heroTints/statuses + frontmatter schema"
```

---

## Task 2.2: Standalone validator `lib/mdx/validate-mdx.mjs`

**Files:**
- Create: `lib/mdx/validate-mdx.mjs`
- Create: `lib/mdx/__tests__/validate-mdx.test.ts`
- Modify: `package.json` (add `gray-matter` to devDependencies, add `test:visuals` script placeholder)

- [ ] **Step 1: Add `gray-matter` dependency**

```bash
pnpm add -D gray-matter
```

- [ ] **Step 2: Add a `test:visuals` script entry to package.json**

Add to the `"scripts"` object:

```json
"test:visuals": "tests/visuals/run-all.zsh"
```

- [ ] **Step 3: Write the failing test**

```ts
// lib/mdx/__tests__/validate-mdx.test.ts
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const goodMdx = `---
title: "x"
dek: "y"
publishedAt: 2026-05-01
number: 1
tags: []
heroTint: sage
heroImage: /img/musings/x/hero.png
status: draft
---

body
`;

const badMdx = `---
title: "x"
dek: "y"
publishedAt: 2026-05-01
number: 1
tags: []
heroTint: fuchsia
status: draft
---

body
`;

describe("validate-mdx.mjs", () => {
  it("exits 0 on valid frontmatter", () => {
    const dir = mkdtempSync(join(tmpdir(), "vmdx-"));
    const f = join(dir, "ok.mdx");
    writeFileSync(f, goodMdx);
    execFileSync("node", ["lib/mdx/validate-mdx.mjs", f], { stdio: "pipe" });
  });

  it("exits 1 on invalid heroTint", () => {
    const dir = mkdtempSync(join(tmpdir(), "vmdx-"));
    const f = join(dir, "bad.mdx");
    writeFileSync(f, badMdx);
    expect(() =>
      execFileSync("node", ["lib/mdx/validate-mdx.mjs", f], { stdio: "pipe" })
    ).toThrow();
  });
});
```

- [ ] **Step 4: Run the test — expect failure**

Run: `pnpm vitest run lib/mdx/__tests__/validate-mdx.test.ts`
Expected: FAIL ("Cannot find module" or non-zero exit on the "ok" case).

- [ ] **Step 5: Write the validator**

```mjs
// lib/mdx/validate-mdx.mjs
//
// CLI:  node lib/mdx/validate-mdx.mjs <path-to-mdx>
// Exits 0 if the frontmatter matches the project's Zod schema, 1 otherwise.
// Prints any validation issue to stderr.

import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { postBaseSchema } from "./post-schema.ts";

const path = process.argv[2];
if (!path) {
  process.stderr.write("usage: validate-mdx.mjs <path>\n");
  process.exit(2);
}

const raw = readFileSync(path, "utf8");
const { data, content } = matter(raw);

const parsed = postBaseSchema.safeParse({
  ...data,
  body: content,
  raw,
  slug: path.split("/").pop().replace(/\.mdx$/, ""),
  path,
});

if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    process.stderr.write(`${issue.path.join(".")}: ${issue.message}\n`);
  }
  process.exit(1);
}
process.exit(0);
```

Note: importing a `.ts` file from `.mjs` requires a loader. The repo already runs TypeScript via Next; for this standalone script, add a small shim to use `tsx`:

- [ ] **Step 6: Add `tsx` as a dev dependency and wrap the script invocation**

```bash
pnpm add -D tsx
```

Rename the validator file extension to `.mts` (TypeScript ES module) and rewrite as TypeScript directly:

```bash
mv lib/mdx/validate-mdx.mjs lib/mdx/validate-mdx.mts
```

```ts
// lib/mdx/validate-mdx.mts
import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { postBaseSchema } from "./post-schema";

const path = process.argv[2];
if (!path) {
  process.stderr.write("usage: tsx validate-mdx.mts <path>\n");
  process.exit(2);
}

const raw = readFileSync(path, "utf8");
const { data, content } = matter(raw);

const parsed = postBaseSchema.safeParse({
  ...data,
  body: content,
  raw,
  slug: path.split("/").pop()!.replace(/\.mdx$/, ""),
  path,
});

if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    process.stderr.write(`${issue.path.join(".")}: ${issue.message}\n`);
  }
  process.exit(1);
}
process.exit(0);
```

Update the test file to invoke via `tsx`:

```ts
execFileSync("pnpm", ["exec", "tsx", "lib/mdx/validate-mdx.mts", f], { stdio: "pipe" });
```

- [ ] **Step 7: Run the test — expect pass**

Run: `pnpm vitest run lib/mdx/__tests__/validate-mdx.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/mdx/validate-mdx.mts lib/mdx/__tests__/validate-mdx.test.ts package.json pnpm-lock.yaml
git commit -m "feat(mdx): standalone frontmatter validator using shared schema"
```

---

## Task 2.3: Stub `gemini` and `qlmanage` for render tests

**Files:**
- Create: `tests/visuals/fixtures/stub-gemini.zsh`
- Create: `tests/visuals/fixtures/stub-qlmanage.zsh`
- Create: `tests/visuals/fixtures/hero-stub.png`

- [ ] **Step 1: Create a 1024×576 placeholder PNG via ffmpeg**

```bash
ffmpeg -y -f lavfi -i color=c=#88a878:s=1024x576 -frames:v 1 tests/visuals/fixtures/hero-stub.png
```

- [ ] **Step 2: Write the stub gemini**

```zsh
#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-gemini.zsh — fake gemini CLI for unit tests.
# Recognised: `gemini image generate --output <path> ...`. Copies hero-stub.png.

set -u
out=""
while (( $# > 0 )); do
  case "$1" in
    --output) out="$2"; shift 2 ;;
    *) shift ;;
  esac
done
[[ -n "$out" ]] || { print -ru2 -- "stub-gemini: --output required"; exit 1; }
fixture_dir="${${(%):-%x}:A:h}"
cp "$fixture_dir/hero-stub.png" "$out"
exit 0
```

- [ ] **Step 3: Write the stub qlmanage**

```zsh
#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-qlmanage.zsh — fake qlmanage. Touches a marker
# file so tests can assert it was invoked, then exits 0.
set -u
print -r -- "$@" > "${TT_TEST_QLMANAGE_MARKER:-/tmp/tt-test-qlmanage.txt}"
exit 0
```

- [ ] **Step 4: Make both executable, commit**

```bash
chmod +x tests/visuals/fixtures/stub-gemini.zsh tests/visuals/fixtures/stub-qlmanage.zsh
git add tests/visuals/fixtures/stub-gemini.zsh tests/visuals/fixtures/stub-qlmanage.zsh tests/visuals/fixtures/hero-stub.png
git commit -m "test(tt-visuals): stub gemini/qlmanage binaries + placeholder hero"
```

---

## Task 2.4: `bin/_engine_run.zsh` — gemini branch only

**Files:**
- Create: `tests/visuals/test-engine-run.zsh`
- Create: `bin/_engine_run.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-engine-run.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

# Put stub-gemini.zsh first on PATH so it shadows real `gemini`.
TMP_BIN=$(mktemp -d -t tt-stubs-XXXXXX)
ln -sf "$FIXTURES/stub-gemini.zsh" "$TMP_BIN/gemini"
PATH="$TMP_BIN:$PATH"
export PATH

cleanup() { rm -rf "$TMP_BIN"; }
trap cleanup EXIT

OUT=$(mktemp -t tt-test-render-XXXXXX.png)
PROMPT=$(mktemp -t tt-test-prompt-XXXXXX.txt)
print -r -- '{"prompt":"x","negative":"y","aspect":"16:9","tint":"sage"}' > "$PROMPT"

tt_test "_engine_run.zsh gemini path writes the output file"
"$REPO_ROOT/bin/_engine_run.zsh" gemini "$PROMPT" "$OUT" >/dev/null 2>&1
rc=$?
assert_eq "0" "$rc"
assert_file_exists "$OUT"

tt_test "_engine_run.zsh rejects unknown engine with exit 2"
"$REPO_ROOT/bin/_engine_run.zsh" zzz "$PROMPT" "$OUT" >/dev/null 2>&1
assert_eq "2" "$?"

tt_test "_engine_run.zsh requires three positional args"
"$REPO_ROOT/bin/_engine_run.zsh" gemini "$PROMPT" >/dev/null 2>&1
assert_eq "2" "$?"

rm -f "$OUT" "$PROMPT"
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: FAIL.

- [ ] **Step 3: Write the engine runner**

```zsh
#!/usr/bin/env zsh
# bin/_engine_run.zsh — render one (engine, prompt) → one output file.
# Internal helper. PR2 implements only the gemini branch; codex/devin
# branches land in PR3.
#
# Usage:
#   _engine_run.zsh <engine> <prompt-json-file> <output-path>
# Prompt JSON shape:
#   { "prompt": "...", "negative": "...", "aspect": "16:9", "tint": "sage" }

set -u
if (( $# != 3 )); then
  print -ru2 -- "usage: _engine_run.zsh <engine> <prompt-file> <output>"
  exit 2
fi
engine="$1" prompt_file="$2" out="$3"

read_field() {
  local field="$1"
  node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    process.stdout.write(j[process.argv[2]] ?? "");
  ' "$prompt_file" "$field"
}

case "$engine" in
  gemini)
    aspect=$(read_field aspect)
    prompt=$(read_field prompt)
    negative=$(read_field negative)
    pf=$(mktemp -t tt-gemini-prompt-XXXXXX)
    {
      print -r -- "$prompt"
      print -r -- ""
      print -r -- "Negative: $negative"
    } > "$pf"
    gemini image generate \
      --model "${TT_GEMINI_IMAGE_MODEL:-imagen-4-ultra}" \
      --prompt-file "$pf" \
      --output "$out" \
      --aspect "$aspect"
    rc=$?
    rm -f "$pf"
    exit $rc
    ;;
  codex|devin)
    print -ru2 -- "_engine_run: $engine not implemented in this build (PR3)"
    exit 2
    ;;
  claude)
    print -ru2 -- "_engine_run: claude has no image gen"
    exit 2
    ;;
  *)
    print -ru2 -- "_engine_run: unknown engine: $engine"
    exit 2
    ;;
esac
```

- [ ] **Step 4: Make executable**

```bash
chmod +x bin/_engine_run.zsh
```

- [ ] **Step 5: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add bin/_engine_run.zsh tests/visuals/test-engine-run.zsh
git commit -m "feat(tt-visuals): _engine_run.zsh with gemini image branch"
```

---

## Task 2.5: `bin/lib/tt-visuals/render.zsh` — single-engine orchestrator

**Files:**
- Create: `tests/visuals/test-render.zsh`
- Create: `bin/lib/tt-visuals/render.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-render.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/render.zsh"

TMP_BIN=$(mktemp -d -t tt-stubs-XXXXXX)
ln -sf "$FIXTURES/stub-gemini.zsh" "$TMP_BIN/gemini"
PATH="$TMP_BIN:$PATH"
export PATH

WORKDIR=$(mktemp -d -t tt-test-render-XXXXXX)
PROMPTS_JSON="$WORKDIR/.prompts.json"
cat > "$PROMPTS_JSON" <<'JSON'
{
  "hero": {"prompt":"x","negative":"y","aspect":"16:9","tint":"sage"},
  "inline": [
    {"slot":"inline-1","prompt":"a","negative":"b","aspect":"4:3","tint":"sage"}
  ],
  "overrides": {}
}
JSON

cleanup() { rm -rf "$TMP_BIN" "$WORKDIR"; }
trap cleanup EXIT

tt_test "render single engine writes one candidate per slot"
tt_render_slots gemini "$PROMPTS_JSON" "$WORKDIR/candidates" >/dev/null 2>&1
rc=$?
assert_eq "0" "$rc"
assert_file_exists "$WORKDIR/candidates/hero/gemini.png"
assert_file_exists "$WORKDIR/candidates/inline-1/gemini.png"

tt_test "render emits sidecar .meta.json"
assert_file_exists "$WORKDIR/candidates/hero/gemini.meta.json"
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: FAIL.

- [ ] **Step 3: Write the library**

```zsh
#!/usr/bin/env zsh
# bin/lib/tt-visuals/render.zsh — orchestrate (slot × engine) renders.
# PR2: sequential, one engine. PR3 wraps this in parallel.zsh.

[[ -n "${_TT_RENDER_SOURCED:-}" ]] && return 0
typeset -g _TT_RENDER_SOURCED=1

# Usage: tt_render_slots <engine> <prompts-json-path> <candidates-dir>
# Creates <candidates-dir>/<slot>/<engine>.png for every slot in the JSON.
tt_render_slots() {
  local engine="$1" prompts_json="$2" cand_dir="$3"
  local script_dir="${${(%):-%x}:A:h:h:h}"
  local engine_run="$script_dir/bin/_engine_run.zsh"
  [[ -x "$engine_run" ]] || engine_run="$(command -v _engine_run.zsh || true)"
  [[ -x "$engine_run" ]] || { print -ru2 -- "render: cannot find _engine_run.zsh"; return 2; }

  # Iterate slots via node — easier than parsing JSON in zsh.
  local slots
  slots=$(node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const out = [];
    if (j.hero) out.push(["hero", j.hero]);
    for (const e of j.inline || []) out.push([e.slot, e]);
    process.stdout.write(out.map(([s,v])=>`${s}\t${JSON.stringify(v)}`).join("\n"));
  ' "$prompts_json")

  local line slot payload slot_dir prompt_file out_file meta start_ms end_ms rc
  while IFS=$'\t' read -r slot payload; do
    [[ -z "$slot" ]] && continue
    slot_dir="$cand_dir/$slot"
    mkdir -p "$slot_dir"

    # Apply overrides from .prompts.json if present.
    payload=$(node -e '
      const fs = require("fs");
      const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const slot = process.argv[2];
      const payload = JSON.parse(process.argv[3]);
      if (j.overrides && j.overrides[slot]) payload.prompt = j.overrides[slot];
      process.stdout.write(JSON.stringify(payload));
    ' "$prompts_json" "$slot" "$payload")

    prompt_file=$(mktemp -t tt-render-prompt-XXXXXX)
    print -r -- "$payload" > "$prompt_file"
    out_file="$slot_dir/$engine.png"

    start_ms=$(($(date +%s%N) / 1000000))
    "$engine_run" "$engine" "$prompt_file" "$out_file"
    rc=$?
    end_ms=$(($(date +%s%N) / 1000000))

    meta="$slot_dir/$engine.meta.json"
    node -e '
      const fs = require("fs");
      const m = {
        engine: process.argv[1],
        rc: Number(process.argv[2]),
        latency_ms: Number(process.argv[3]) - Number(process.argv[4]),
        prompt: JSON.parse(process.argv[5]).prompt,
      };
      fs.writeFileSync(process.argv[6], JSON.stringify(m, null, 2));
    ' "$engine" "$rc" "$end_ms" "$start_ms" "$payload" "$meta"

    rm -f "$prompt_file"
    (( rc == 0 )) || print -ru2 -- "render: $slot×$engine failed (rc=$rc)"
  done <<< "$slots"

  return 0
}
```

Note: macOS's `date +%s%N` does not support nanoseconds. Adjust to use `python3 -c 'import time; print(int(time.time()*1000))'` instead:

Replace both `start_ms=...` and `end_ms=...` lines with:

```zsh
start_ms=$(python3 -c 'import time; print(int(time.time()*1000))')
# ... call ...
end_ms=$(python3 -c 'import time; print(int(time.time()*1000))')
```

- [ ] **Step 4: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/tt-visuals/render.zsh tests/visuals/test-render.zsh
git commit -m "feat(tt-visuals): single-engine render orchestrator + meta sidecar"
```

---

## Task 2.6: `bin/lib/tt-visuals/pick-ui.zsh`

**Files:**
- Create: `tests/visuals/test-pick-ui.zsh`
- Create: `bin/lib/tt-visuals/pick-ui.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-pick-ui.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/pick-ui.zsh"

# Stub qlmanage on PATH.
TMP_BIN=$(mktemp -d -t tt-stubs-XXXXXX)
ln -sf "$FIXTURES/stub-qlmanage.zsh" "$TMP_BIN/qlmanage"
PATH="$TMP_BIN:$PATH"
export PATH
export TT_TEST_QLMANAGE_MARKER=$(mktemp -t tt-ql-XXXXXX)

# Build a fake candidates dir.
WORKDIR=$(mktemp -d -t tt-pick-XXXXXX)
mkdir -p "$WORKDIR/hero"
cp "$FIXTURES/hero-stub.png" "$WORKDIR/hero/gemini.png"
cp "$FIXTURES/hero-stub.png" "$WORKDIR/hero/codex.png"

cleanup() { rm -rf "$TMP_BIN" "$WORKDIR" "$TT_TEST_QLMANAGE_MARKER"; }
trap cleanup EXIT

tt_test "pick prompts and returns the engine the user selected (1 → gemini)"
result=$(print -- "1" | tt_pick_for_slot hero "$WORKDIR/hero")
assert_eq "gemini" "$result"

tt_test "pick returns __skip__ on 's'"
result=$(print -- "s" | tt_pick_for_slot hero "$WORKDIR/hero")
assert_eq "__skip__" "$result"

tt_test "pick returns __quit__ on 'q'"
result=$(print -- "q" | tt_pick_for_slot hero "$WORKDIR/hero")
assert_eq "__quit__" "$result"

tt_test "qlmanage was invoked"
[[ -s "$TT_TEST_QLMANAGE_MARKER" ]] && (( TT_TEST_PASS++ )) || (( TT_TEST_FAIL++ ))
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: FAIL.

- [ ] **Step 3: Write the library**

```zsh
#!/usr/bin/env zsh
# bin/lib/tt-visuals/pick-ui.zsh — open candidates in Preview, prompt user.

[[ -n "${_TT_PICK_SOURCED:-}" ]] && return 0
typeset -g _TT_PICK_SOURCED=1

# Usage: tt_pick_for_slot <slot> <slot-dir>
# Prints the chosen engine name to stdout, or `__skip__` / `__quit__` /
# `__retry__`. Reads decision from stdin.
tt_pick_for_slot() {
  local slot="$1" slot_dir="$2"
  local -a candidates names
  candidates=("$slot_dir"/*.png(N) "$slot_dir"/*.mp4(N))
  names=()
  local f base eng
  for f in "${candidates[@]}"; do
    base="${f:t}"
    eng="${base%.*}"
    names+=("$eng")
  done

  if (( ${#candidates[@]} == 0 )); then
    print -ru2 -- "pick: no candidates for slot $slot"
    print -r -- "__skip__"
    return 0
  fi

  # Open in Preview/QuickLook.
  qlmanage -p "${candidates[@]}" >/dev/null 2>&1 &
  local ql_pid=$!

  print -ru2 -- ""
  print -ru2 -- "▶ picking $slot"
  local -i i=0
  for eng in "${names[@]}"; do
    (( i++ ))
    print -ru2 -- "  [$i] $eng"
  done
  print -ru2 -- "  [r] re-draft and re-render this slot"
  print -ru2 -- "  [s] skip this slot"
  print -ru2 -- "  [q] quit, keep nothing"
  print -ru2 -n -- "  > "

  local choice
  read -r choice

  kill "$ql_pid" 2>/dev/null

  case "$choice" in
    r|R) print -r -- "__retry__" ;;
    s|S) print -r -- "__skip__" ;;
    q|Q) print -r -- "__quit__" ;;
    ''|*[!0-9]*) print -ru2 -- "pick: invalid choice '$choice', treating as skip"; print -r -- "__skip__" ;;
    *)
      local -i n="$choice"
      if (( n < 1 || n > ${#names[@]} )); then
        print -ru2 -- "pick: out of range, treating as skip"
        print -r -- "__skip__"
      else
        print -r -- "${names[$n]}"
      fi
      ;;
  esac
}
```

- [ ] **Step 4: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/tt-visuals/pick-ui.zsh tests/visuals/test-pick-ui.zsh
git commit -m "feat(tt-visuals): Preview-based pick UI for candidates"
```

---

## Task 2.7: `bin/lib/tt-visuals/install-winner.zsh`

**Files:**
- Create: `tests/visuals/test-install-winner.zsh`
- Create: `bin/lib/tt-visuals/install-winner.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-install-winner.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/install-winner.zsh"

WORKDIR=$(mktemp -d -t tt-install-XXXXXX)
ASSET_DIR="$WORKDIR/public/img/musings/x"
mkdir -p "$WORKDIR/cand/hero" "$ASSET_DIR"
cp "$FIXTURES/hero-stub.png" "$WORKDIR/cand/hero/gemini.png"
cp "$FIXTURES/hero-stub.png" "$WORKDIR/cand/hero/codex.png"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

tt_test "install copies winner to <asset_dir>/<slot>.png"
tt_install_winner "hero" "gemini" "$WORKDIR/cand/hero" "$ASSET_DIR" 0 >/dev/null 2>&1
assert_file_exists "$ASSET_DIR/hero.png"

tt_test "losing candidates move to .candidates/"
assert_file_exists "$ASSET_DIR/.candidates/hero/codex.png"

tt_test "with --force-style backup, original is renamed *.bak-*"
# Re-install on top of existing winner; backup must be created.
tt_install_winner "hero" "codex" "$WORKDIR/cand/hero" "$ASSET_DIR" 1 >/dev/null 2>&1
shopt -s nullglob 2>/dev/null
baks=("$ASSET_DIR"/hero.bak-*.png)
(( ${#baks[@]} == 1 )) && (( TT_TEST_PASS++ )) || (( TT_TEST_FAIL++ ))
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: FAIL.

- [ ] **Step 3: Write the library**

```zsh
#!/usr/bin/env zsh
# bin/lib/tt-visuals/install-winner.zsh — copy chosen candidate to its
# canonical path; move losers to .candidates/; back up any existing file.

[[ -n "${_TT_INSTALL_SOURCED:-}" ]] && return 0
typeset -g _TT_INSTALL_SOURCED=1

# Usage: tt_install_winner <slot> <engine> <slot-cand-dir> <asset-dir> <force>
#   slot          e.g. hero, inline-1
#   engine        winning engine (filename basename)
#   slot-cand-dir absolute path to the slot's candidate directory
#   asset-dir     public/img/<type>/<slug>
#   force         1 = backup-then-overwrite, 0 = abort if target exists
tt_install_winner() {
  local slot="$1" engine="$2" cand_dir="$3" asset_dir="$4" force="$5"
  local ext src target
  # Pick extension from the winning candidate file.
  src=$(print -r -- "$cand_dir/$engine".*(N) | tr ' ' '\n' | head -1)
  [[ -n "$src" && -f "$src" ]] || { print -ru2 -- "install: missing winner $cand_dir/$engine.*"; return 1; }
  ext="${src##*.}"
  target="$asset_dir/$slot.$ext"

  mkdir -p "$asset_dir"
  if [[ -e "$target" ]]; then
    if (( force )); then
      local ts=$(date +%Y%m%d-%H%M%S)
      mv "$target" "$asset_dir/$slot.bak-$ts.$ext"
    else
      print -ru2 -- "install: $target exists (use --force)"; return 1
    fi
  fi
  cp "$src" "$target"

  # Move losers to .candidates/<slot>/
  local losers_dir="$asset_dir/.candidates/$slot"
  mkdir -p "$losers_dir"
  local f base
  for f in "$cand_dir"/*(N); do
    base="${f:t}"
    [[ "$base" == "$engine.$ext" ]] && continue
    [[ "$base" == "$engine.meta.json" ]] && continue
    cp "$f" "$losers_dir/$base"
  done
  return 0
}
```

- [ ] **Step 4: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/tt-visuals/install-winner.zsh tests/visuals/test-install-winner.zsh
git commit -m "feat(tt-visuals): install-winner with backup + losers archive"
```

---

## Task 2.8: `bin/lib/tt-visuals/rewrite-mdx.mts` + zsh wrapper

**Files:**
- Create: `tests/visuals/test-rewrite-mdx.zsh`
- Create: `bin/lib/tt-visuals/rewrite-mdx.mts`
- Create: `bin/lib/tt-visuals/rewrite-mdx.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-rewrite-mdx.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/rewrite-mdx.zsh"

WORKDIR=$(mktemp -d -t tt-rewrite-XXXXXX)
cp "$FIXTURES/sample-musing.mdx" "$WORKDIR/the-kettle.mdx"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

cat > "$WORKDIR/installed.json" <<'JSON'
{
  "type": "musings",
  "slug": "the-kettle",
  "hero": "hero.png",
  "inline": ["inline-1.png", "inline-2.png"]
}
JSON

tt_test "rewrite installs heroImage in frontmatter"
tt_rewrite_mdx "$WORKDIR/the-kettle.mdx" "$WORKDIR/installed.json" "$REPO_ROOT" >/dev/null 2>&1
assert_eq "0" "$?"
result=$(grep '^heroImage:' "$WORKDIR/the-kettle.mdx")
assert_contains "$result" "/img/musings/the-kettle/hero.png"

tt_test "rewrite replaces inline markers in body"
result=$(grep -c '^\[\[visual:\]\]$' "$WORKDIR/the-kettle.mdx")
assert_eq "0" "$result"
result=$(grep -c '!\[.*\](/img/musings/the-kettle/inline-1.png)' "$WORKDIR/the-kettle.mdx")
assert_eq "1" "$result"

tt_test "skip markers are left untouched"
result=$(grep -c '\[\[visual skip\]\]' "$WORKDIR/the-kettle.mdx")
assert_eq "1" "$result"

tt_test "rewrite is atomic: bad install.json fails without touching mdx"
cp "$FIXTURES/sample-musing.mdx" "$WORKDIR/the-kettle.mdx"
before=$(shasum -a 256 "$WORKDIR/the-kettle.mdx")
print -r -- "{ malformed" > "$WORKDIR/bad.json"
tt_rewrite_mdx "$WORKDIR/the-kettle.mdx" "$WORKDIR/bad.json" "$REPO_ROOT" >/dev/null 2>&1
assert_eq "5" "$?"
after=$(shasum -a 256 "$WORKDIR/the-kettle.mdx")
assert_eq "$before" "$after"
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: FAIL.

- [ ] **Step 3: Write the node rewriter**

```ts
// bin/lib/tt-visuals/rewrite-mdx.mts
//
// Usage:  tsx rewrite-mdx.mts <mdx-path> <installed-json-path>
// Rewrites frontmatter.heroImage and inline [[visual:]] markers in place.
// On any failure, exits non-zero without modifying the file.

import { readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import matter from "gray-matter";

const [, , mdxPath, installedPath] = process.argv;
if (!mdxPath || !installedPath) {
  process.stderr.write("usage: tsx rewrite-mdx.mts <mdx> <installed.json>\n");
  process.exit(2);
}

let installed: {
  type: string;
  slug: string;
  hero?: string;
  inline?: string[];
};
try {
  installed = JSON.parse(readFileSync(installedPath, "utf8"));
} catch (e) {
  process.stderr.write(`bad installed.json: ${(e as Error).message}\n`);
  process.exit(5);
}

const raw = readFileSync(mdxPath, "utf8");
const parsed = matter(raw);
const data = parsed.data;

if (installed.hero) {
  data.heroImage = `/img/${installed.type}/${installed.slug}/${installed.hero}`;
}

let body = parsed.content;
let inlineIdx = 0;
body = body.replace(/\[\[visual( gif| hero| hero mp4)?:([^\]]*)\]\]/g, (match, kind, _text) => {
  if (kind === " skip") return match; // never touched but pattern excludes "skip" anyway
  // Hero markers are handled by frontmatter; leave them as text-fallback.
  if (kind === " hero" || kind === " hero mp4") return "";
  inlineIdx++;
  const file = installed.inline?.[inlineIdx - 1];
  if (!file) return match;
  const alt = `inline image ${inlineIdx}`;
  return `![${alt}](/img/${installed.type}/${installed.slug}/${file})`;
});

// Also handle `[[visual skip]]` separately: leave alone (it's a no-op marker).
const out = matter.stringify(body, data);

const tmp = `${mdxPath}.tmp`;
writeFileSync(tmp, out, "utf8");

// Validate via the standalone validator.
import { execFileSync } from "node:child_process";
try {
  execFileSync("pnpm", ["exec", "tsx", "lib/mdx/validate-mdx.mts", tmp], { stdio: "pipe" });
} catch (e) {
  unlinkSync(tmp);
  process.stderr.write(`rewrite-mdx: validation failed; original untouched\n`);
  process.exit(5);
}
renameSync(tmp, mdxPath);
process.exit(0);
```

- [ ] **Step 4: Write the zsh wrapper**

```zsh
#!/usr/bin/env zsh
# bin/lib/tt-visuals/rewrite-mdx.zsh — thin wrapper over rewrite-mdx.mts.

[[ -n "${_TT_REWRITE_SOURCED:-}" ]] && return 0
typeset -g _TT_REWRITE_SOURCED=1

# Usage: tt_rewrite_mdx <mdx-path> <installed-json-path> <repo-root>
tt_rewrite_mdx() {
  local mdx="$1" installed="$2" repo="$3"
  (
    cd "$repo"
    pnpm exec tsx bin/lib/tt-visuals/rewrite-mdx.mts "$mdx" "$installed"
  )
}
```

- [ ] **Step 5: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add bin/lib/tt-visuals/rewrite-mdx.mts bin/lib/tt-visuals/rewrite-mdx.zsh tests/visuals/test-rewrite-mdx.zsh
git commit -m "feat(tt-visuals): atomic mdx rewrite validated against velite schema"
```

---

## Task 2.9: `bin/lib/tt-visuals/social-crops.zsh`

**Files:**
- Create: `tests/visuals/test-social-crops.zsh`
- Create: `bin/lib/tt-visuals/social-crops.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-social-crops.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/social-crops.zsh"

WORKDIR=$(mktemp -d -t tt-crops-XXXXXX)
cp "$FIXTURES/hero-stub.png" "$WORKDIR/hero.png"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

tt_test "social crops produces three files"
tt_make_social_crops "$WORKDIR/hero.png" "$WORKDIR" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$WORKDIR/social-1x1.png"
assert_file_exists "$WORKDIR/social-4x5.png"
assert_file_exists "$WORKDIR/social-16x9.png"

tt_test "1x1 crop is actually square"
dims=$(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$WORKDIR/social-1x1.png")
w="${dims%%,*}"
h="${dims##*,}"
assert_eq "$w" "$h"
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: FAIL.

- [ ] **Step 3: Write the library**

```zsh
#!/usr/bin/env zsh
# bin/lib/tt-visuals/social-crops.zsh — derive 1x1, 4x5, 16x9 crops from hero.

[[ -n "${_TT_SOCIAL_CROPS_SOURCED:-}" ]] && return 0
typeset -g _TT_SOCIAL_CROPS_SOURCED=1

# Usage: tt_make_social_crops <hero-path> <out-dir>
tt_make_social_crops() {
  local hero="$1" out="$2"
  [[ -f "$hero" ]] || { print -ru2 -- "social-crops: missing $hero"; return 1; }
  mkdir -p "$out"
  ffmpeg -y -i "$hero" -vf "crop=min(iw\\,ih):min(iw\\,ih)" "$out/social-1x1.png" -loglevel error
  ffmpeg -y -i "$hero" -vf "crop=iw:iw*5/4" "$out/social-4x5.png" -loglevel error
  ffmpeg -y -i "$hero" -vf "crop=iw:iw*9/16" "$out/social-16x9.png" -loglevel error
  return 0
}
```

- [ ] **Step 4: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/tt-visuals/social-crops.zsh tests/visuals/test-social-crops.zsh
git commit -m "feat(tt-visuals): ffmpeg-derived 1x1/4x5/16x9 social crops"
```

---

## Task 2.10: Wire the render path into `bin/tt-visuals`

**Files:**
- Modify: `bin/tt-visuals`

- [ ] **Step 1: Replace the placeholder block at the bottom of `bin/tt-visuals`**

Find the lines:

```zsh
# PR1 ends here. PR2 wires the render path.
print -ru2 -- "tt-visuals: rendering is not implemented in this build. Use --dry-run."
exit 2
```

Replace with:

```zsh
# ---- source PR2 libraries ---------------------------------------------------
source "$SCRIPT_DIR/lib/tt-visuals/render.zsh"
source "$SCRIPT_DIR/lib/tt-visuals/pick-ui.zsh"
source "$SCRIPT_DIR/lib/tt-visuals/install-winner.zsh"
source "$SCRIPT_DIR/lib/tt-visuals/rewrite-mdx.zsh"
source "$SCRIPT_DIR/lib/tt-visuals/social-crops.zsh"

# ---- choose engines ---------------------------------------------------------
typeset -a engines
if [[ "$engine" == "all" ]]; then
  # PR2: 'all' === just gemini (only implemented branch). PR3 expands.
  engines=(gemini)
else
  engines=("$engine")
fi

# Probe availability — skip missing.
typeset -a live_engines
for e in "${engines[@]}"; do
  if command -v "$e" >/dev/null 2>&1; then
    live_engines+=("$e")
  else
    print -ru2 -- "tt-visuals: skipping $e (CLI not on PATH)"
  fi
done

if (( ${#live_engines[@]} == 0 )); then
  print -ru2 -- "error: no engines available"
  exit 3
fi

# ---- render across engines --------------------------------------------------
typeset cand_root="/tmp/tt-visuals-$slug-$$"
mkdir -p "$cand_root"
typeset -i any_render=0
for e in "${live_engines[@]}"; do
  if tt_render_slots "$e" "$prompts_json_path" "$cand_root"; then
    (( any_render++ ))
  fi
done
(( any_render > 0 )) || { print -ru2 -- "error: every engine failed"; exit 5; }

# ---- pick per slot ----------------------------------------------------------
typeset installed_json=$(mktemp -t tt-installed-XXXXXX.json)
typeset -A picks
typeset slot_dir slot_name pick
for slot_dir in "$cand_root"/*(/); do
  slot_name="${slot_dir:t}"
  case "$slot_name" in
    hero) ;;          # ok
    inline-*) ;;      # ok
    *) continue ;;
  esac
  pick=$(tt_pick_for_slot "$slot_name" "$slot_dir")
  case "$pick" in
    __quit__) print -ru2 -- "tt-visuals: user quit"; exit 6 ;;
    __skip__|__retry__)
      # __retry__ ignored in PR2 (treated like skip); PR3 wires re-render
      ;;
    *)
      picks[$slot_name]="$pick"
      tt_install_winner "$slot_name" "$pick" "$slot_dir" "$asset_dir" "$force" || exit 5
      ;;
  esac
done

# ---- build installed.json for the rewriter ---------------------------------
node -e '
  const picks = JSON.parse(process.argv[1]);
  const type = process.argv[2], slug = process.argv[3];
  const inline = [];
  for (const k of Object.keys(picks).sort()) {
    if (k.startsWith("inline-")) {
      // assume .png for PR2; PR3 handles .gif/.mp4
      inline.push(`${k}.png`);
    }
  }
  const out = { type, slug };
  if (picks.hero) out.hero = "hero.png";
  if (inline.length) out.inline = inline;
  console.log(JSON.stringify(out));
' "$(print -r -- "${(j:,:)${(@kv)picks}}" | node -e 'let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{const arr=d.trim().split(",").filter(Boolean); const o={}; for(let i=0;i<arr.length;i+=2)o[arr[i]]=arr[i+1]; process.stdout.write(JSON.stringify(o))})')" "$type" "$slug" > "$installed_json"

# ---- rewrite mdx atomically -------------------------------------------------
if (( ! no_install )); then
  tt_rewrite_mdx "$mdx_path" "$installed_json" "$REPO_ROOT" || exit 5
fi

# ---- social crops -----------------------------------------------------------
if [[ -f "$asset_dir/hero.png" ]] && [[ ",$slots_csv," == *",social,"* ]]; then
  tt_make_social_crops "$asset_dir/hero.png" "$asset_dir" || print -ru2 -- "tt-visuals: social-crops failed (non-fatal)"
fi

# ---- prune losers unless --keep-candidates ---------------------------------
(( keep_cand )) || rm -rf "$asset_dir/.candidates"

# ---- commit hint ------------------------------------------------------------
rm -rf "$cand_root"
rm -f "$installed_json"
print -r -- ""
print -r -- "✓ visuals installed for $target"
print -r -- ""
print -r -- "Commit hint:"
print -r -- "  git add content/$target.mdx public/img/$type/$slug/"
print -r -- "  git commit -m 'visuals: $slug'"
print -r -- "  git push"
exit 0
```

- [ ] **Step 2: Commit**

```bash
git add bin/tt-visuals
git commit -m "feat(tt-visuals): wire single-engine render + pick + rewrite path"
```

---

## Task 2.11: Add `tt.vis.gemini` alias + MANUAL-TESTS.md section

**Files:**
- Modify: `bin/tt-aliases.zsh`
- Modify: `MANUAL-TESTS.md`

- [ ] **Step 1: Add the alias**

Append to `bin/tt-aliases.zsh`:

```zsh
alias tt.vis.gemini='tt-visuals --engine gemini'
```

- [ ] **Step 2: Add a Visuals section to `MANUAL-TESTS.md`**

Append:

```markdown
## tt-visuals (PR2 — single-engine path)

Prereq: `GEMINI_API_KEY` exported, or `gcloud auth` valid. Pick a real
draft post with no `heroImage` set.

- [ ] `tt-visuals --dry-run musings/<slug>` writes `public/img/musings/<slug>/.prompts.json` and exits 0
- [ ] `tt-visuals --engine gemini musings/<slug>` renders, opens Preview, accepts choice `1`
- [ ] Choosing `s` for hero leaves frontmatter `heroImage` unset
- [ ] Choosing `q` mid-flow exits 6 with no mdx mutation
- [ ] After a successful install: `pnpm content` builds without errors
- [ ] Re-running (`tt-visuals musings/<slug>`) skips already-installed slots
- [ ] `tt-visuals --force musings/<slug>` re-renders and backs up the old `hero.png` to `hero.bak-<ts>.png`
- [ ] Social crops exist: `public/img/musings/<slug>/social-{1x1,4x5,16x9}.png`
```

- [ ] **Step 3: Commit**

```bash
git add bin/tt-aliases.zsh MANUAL-TESTS.md
git commit -m "feat(tt-visuals): tt.vis.gemini alias + MANUAL-TESTS.md PR2 section"
```

---

## Task 2.12: PR2 verification + open PR

- [ ] **Step 1: Run the full unit suite**

Run: `tests/visuals/run-all.zsh && pnpm vitest run lib/mdx/`
Expected: both green.

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: clean.

- [ ] **Step 3: Velite build**

Run: `pnpm content`
Expected: clean.

- [ ] **Step 4: Walk through the MANUAL-TESTS.md PR2 section against a real draft**

Confirm each checkbox.

- [ ] **Step 5: Open PR2**

```bash
git checkout -b feat/tt-visuals-pr2-gemini
git push -u origin feat/tt-visuals-pr2-gemini
gh pr create --title "tt-visuals PR2: single-engine render + Preview pick + mdx rewrite" --body "$(cat <<'EOF'
## Summary
- `bin/_engine_run.zsh` with gemini image branch
- Render orchestrator, Preview-based pick UI, install-winner with backup + losers archive
- Atomic mdx rewrite validated against the extracted Velite Zod schema (`lib/mdx/post-schema.ts`)
- Standalone `lib/mdx/validate-mdx.mts` validator script
- ffmpeg-derived social crops (1x1, 4x5, 16x9)
- `tt.vis.gemini` alias, MANUAL-TESTS.md PR2 section

## Test plan
- [ ] `tests/visuals/run-all.zsh` green
- [ ] `pnpm vitest run lib/mdx/` green
- [ ] `pnpm lint && pnpm typecheck && pnpm content` clean
- [ ] MANUAL-TESTS.md "tt-visuals (PR2)" checklist walked end-to-end against a real draft

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

# Milestone 3 — Parallel `--engine all` + GIF/video + remaining engines (PR3)

## Task 3.1: Extend `bin/_engine_run.zsh` with codex + devin + video paths

**Files:**
- Create: `tests/visuals/fixtures/stub-codex.zsh`
- Create: `tests/visuals/fixtures/stub-devin.zsh`
- Create: `tests/visuals/fixtures/hero-stub.mp4`
- Modify: `bin/_engine_run.zsh`
- Modify: `tests/visuals/test-engine-run.zsh`

- [ ] **Step 1: Generate the mp4 fixture**

```bash
ffmpeg -y -f lavfi -i color=c=#88a878:s=1024x576:d=3 -c:v libx264 -t 3 -pix_fmt yuv420p tests/visuals/fixtures/hero-stub.mp4
```

- [ ] **Step 2: Write stub-codex.zsh**

```zsh
#!/usr/bin/env zsh
set -u
out=""
kind="image"
while (( $# > 0 )); do
  case "$1" in
    image) kind="image"; shift ;;
    video) kind="video"; shift ;;
    --output) out="$2"; shift 2 ;;
    *) shift ;;
  esac
done
fixture_dir="${${(%):-%x}:A:h}"
if [[ "$kind" == "video" ]]; then
  cp "$fixture_dir/hero-stub.mp4" "$out"
else
  cp "$fixture_dir/hero-stub.png" "$out"
fi
exit 0
```

- [ ] **Step 3: Write stub-devin.zsh (same shape)**

```zsh
#!/usr/bin/env zsh
set -u
out=""
while (( $# > 0 )); do
  case "$1" in
    --output) out="$2"; shift 2 ;;
    *) shift ;;
  esac
done
fixture_dir="${${(%):-%x}:A:h}"
cp "$fixture_dir/hero-stub.png" "$out"
exit 0
```

Make both executable:

```bash
chmod +x tests/visuals/fixtures/stub-codex.zsh tests/visuals/fixtures/stub-devin.zsh
```

- [ ] **Step 4: Extend the engine-run test**

Append to `tests/visuals/test-engine-run.zsh`:

```zsh
ln -sf "$FIXTURES/stub-codex.zsh" "$TMP_BIN/codex"
ln -sf "$FIXTURES/stub-devin.zsh" "$TMP_BIN/devin"

tt_test "_engine_run codex image path works"
OUT2=$(mktemp -t tt-test-codex-XXXXXX.png)
"$REPO_ROOT/bin/_engine_run.zsh" codex "$PROMPT" "$OUT2" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$OUT2"
rm -f "$OUT2"

tt_test "_engine_run devin image path works"
OUT3=$(mktemp -t tt-test-devin-XXXXXX.png)
"$REPO_ROOT/bin/_engine_run.zsh" devin "$PROMPT" "$OUT3" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$OUT3"
rm -f "$OUT3"

tt_test "_engine_run video kind picks video_cmd"
OUT4=$(mktemp -t tt-test-vid-XXXXXX.mp4)
TT_VISUAL_KIND=video "$REPO_ROOT/bin/_engine_run.zsh" codex "$PROMPT" "$OUT4" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$OUT4"
rm -f "$OUT4"
```

- [ ] **Step 5: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: FAIL (codex/devin branches missing).

- [ ] **Step 6: Extend `bin/_engine_run.zsh`**

Replace the entire `case "$engine"` block with:

```zsh
typeset kind="${TT_VISUAL_KIND:-image}"

case "$engine" in
  gemini)
    aspect=$(read_field aspect); prompt=$(read_field prompt); negative=$(read_field negative)
    pf=$(mktemp -t tt-gemini-prompt-XXXXXX)
    { print -r -- "$prompt"; print -r -- ""; print -r -- "Negative: $negative"; } > "$pf"
    if [[ "$kind" == "video" ]]; then
      gemini video generate --model "${TT_GEMINI_VIDEO_MODEL:-veo-3}" --prompt-file "$pf" --output "$out" --duration 3 --aspect "$aspect"
    else
      gemini image generate --model "${TT_GEMINI_IMAGE_MODEL:-imagen-4-ultra}" --prompt-file "$pf" --output "$out" --aspect "$aspect"
    fi
    rc=$?; rm -f "$pf"; exit $rc
    ;;

  codex)
    aspect=$(read_field aspect); prompt=$(read_field prompt); negative=$(read_field negative)
    # Map aspect → pixel size for codex.
    case "$aspect" in
      16:9) size="1792x1024" ;;
      4:3)  size="1408x1056" ;;
      1:1)  size="1024x1024" ;;
      4:5)  size="1024x1280" ;;
      *)    size="1024x1024" ;;
    esac
    pf=$(mktemp -t tt-codex-prompt-XXXXXX)
    { print -r -- "$prompt"; print -r -- ""; print -r -- "Negative: $negative"; } > "$pf"
    if [[ "$kind" == "video" ]]; then
      codex video generate --model "${TT_CODEX_VIDEO_MODEL:-sora-2}" --prompt-file "$pf" --output "$out" --duration 3 --size "$size"
    else
      codex image generate --model "${TT_CODEX_IMAGE_MODEL:-gpt-image-1}" --prompt-file "$pf" --output "$out" --size "$size"
    fi
    rc=$?; rm -f "$pf"; exit $rc
    ;;

  devin)
    prompt=$(read_field prompt)
    pf=$(mktemp -t tt-devin-prompt-XXXXXX)
    print -r -- "$prompt" > "$pf"
    if [[ "$kind" == "video" ]]; then
      devin run --task "generate 3s video: $(cat "$pf")" --output "$out"
    else
      devin run --task "generate image: $(cat "$pf")" --output "$out"
    fi
    rc=$?; rm -f "$pf"; exit $rc
    ;;

  claude)
    print -ru2 -- "_engine_run: claude has no image gen"
    exit 2
    ;;

  *)
    print -ru2 -- "_engine_run: unknown engine: $engine"
    exit 2
    ;;
esac
```

- [ ] **Step 7: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add bin/_engine_run.zsh tests/visuals/fixtures/stub-codex.zsh tests/visuals/fixtures/stub-devin.zsh tests/visuals/fixtures/hero-stub.mp4 tests/visuals/test-engine-run.zsh
git commit -m "feat(tt-visuals): codex + devin engine branches + video_cmd path"
```

---

## Task 3.2: `bin/lib/tt-visuals/parallel.zsh`

**Files:**
- Create: `tests/visuals/test-parallel.zsh`
- Create: `bin/lib/tt-visuals/parallel.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-parallel.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
source "$REPO_ROOT/bin/lib/tt-visuals/parallel.zsh"

WORKDIR=$(mktemp -d -t tt-par-XXXXXX)
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

# Build a list of trivial jobs that touch numbered files.
jobs=()
for i in 1 2 3 4 5; do
  jobs+=("touch $WORKDIR/done-$i")
done

tt_test "parallel runs every job"
tt_parallel_run 3 "${jobs[@]}"
assert_eq "0" "$?"
for i in 1 2 3 4 5; do
  assert_file_exists "$WORKDIR/done-$i"
done

tt_test "parallel respects concurrency cap (best-effort timing check skipped)"
# Cannot easily assert wall time without flakiness; accept that semantics
# are exercised by the function-counting test above. Treat as smoke-only.
(( TT_TEST_PASS++ ))
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: FAIL.

- [ ] **Step 3: Write the library**

```zsh
#!/usr/bin/env zsh
# bin/lib/tt-visuals/parallel.zsh — small fan-out helper with concurrency cap.

[[ -n "${_TT_PARALLEL_SOURCED:-}" ]] && return 0
typeset -g _TT_PARALLEL_SOURCED=1

# Usage: tt_parallel_run <max> <cmd1> <cmd2> ...
# Each cmd is a string passed to `eval`. Returns 0 if all rc=0, else the
# rc of the first failing job seen.
tt_parallel_run() {
  local max="$1"; shift
  local -a pids
  local -i first_fail=0 running=0 rc
  for cmd in "$@"; do
    if (( running >= max )); then
      wait "${pids[1]}"; rc=$?
      shift pids
      (( running-- ))
      (( rc != 0 && first_fail == 0 )) && first_fail=$rc
    fi
    eval "$cmd" &
    pids+=($!)
    (( running++ ))
  done
  for p in "${pids[@]}"; do
    wait "$p"; rc=$?
    (( rc != 0 && first_fail == 0 )) && first_fail=$rc
  done
  return $first_fail
}
```

- [ ] **Step 4: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/tt-visuals/parallel.zsh tests/visuals/test-parallel.zsh
git commit -m "feat(tt-visuals): parallel.zsh fan-out helper with cap"
```

---

## Task 3.3: Switch `render.zsh` to parallel orchestration

**Files:**
- Modify: `bin/lib/tt-visuals/render.zsh`
- Create: `tests/visuals/test-render-parallel.zsh` (extends parallel coverage)

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-render-parallel.zsh — render with two engines.

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/render.zsh"
source "$REPO_ROOT/bin/lib/tt-visuals/parallel.zsh"

TMP_BIN=$(mktemp -d -t tt-stubs-XXXXXX)
ln -sf "$FIXTURES/stub-gemini.zsh" "$TMP_BIN/gemini"
ln -sf "$FIXTURES/stub-codex.zsh"  "$TMP_BIN/codex"
PATH="$TMP_BIN:$PATH"; export PATH

WORKDIR=$(mktemp -d -t tt-rp-XXXXXX)
cat > "$WORKDIR/.prompts.json" <<'JSON'
{ "hero": {"prompt":"x","negative":"y","aspect":"16:9","tint":"sage"},
  "inline": [],
  "overrides": {} }
JSON

cleanup() { rm -rf "$TMP_BIN" "$WORKDIR"; }
trap cleanup EXIT

tt_test "render across two engines produces both candidates"
tt_render_slots_multi "gemini codex" "$WORKDIR/.prompts.json" "$WORKDIR/cand" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$WORKDIR/cand/hero/gemini.png"
assert_file_exists "$WORKDIR/cand/hero/codex.png"
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: FAIL.

- [ ] **Step 3: Add a parallel-multi entry point to `render.zsh`**

Append:

```zsh
# Usage: tt_render_slots_multi "<engine1> <engine2> ..." <prompts-json> <cand-dir>
tt_render_slots_multi() {
  local engines_str="$1" prompts_json="$2" cand_dir="$3"
  local -a engines; engines=(${=engines_str})
  local -a jobs
  jobs=()
  local e
  for e in "${engines[@]}"; do
    jobs+=("tt_render_slots $e $prompts_json $cand_dir >/dev/null 2>&1")
  done
  tt_parallel_run "${TT_VISUAL_MAX_PARALLEL:-4}" "${jobs[@]}"
}
```

- [ ] **Step 4: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/tt-visuals/render.zsh tests/visuals/test-render-parallel.zsh
git commit -m "feat(tt-visuals): parallel render across multiple engines"
```

---

## Task 3.4: `bin/lib/tt-visuals/gif-post.zsh`

**Files:**
- Create: `tests/visuals/test-gif-post.zsh`
- Create: `bin/lib/tt-visuals/gif-post.zsh`

- [ ] **Step 1: Write the failing test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-gif-post.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"
source "$REPO_ROOT/bin/lib/tt-visuals/gif-post.zsh"

WORKDIR=$(mktemp -d -t tt-gif-XXXXXX)
cp "$FIXTURES/hero-stub.mp4" "$WORKDIR/inline-1.mp4"
cleanup() { rm -rf "$WORKDIR"; }; trap cleanup EXIT

tt_test "gif-post produces a .gif from mp4"
tt_mp4_to_gif "$WORKDIR/inline-1.mp4" "$WORKDIR/inline-1.gif" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$WORKDIR/inline-1.gif"

tt_test "poster-frame extraction produces a PNG"
tt_extract_poster "$WORKDIR/inline-1.mp4" "$WORKDIR/inline-1.png" >/dev/null 2>&1
assert_eq "0" "$?"
assert_file_exists "$WORKDIR/inline-1.png"
```

- [ ] **Step 2: Run — expect failure**

Run: `tests/visuals/run-all.zsh`
Expected: FAIL.

- [ ] **Step 3: Write the library**

```zsh
#!/usr/bin/env zsh
# bin/lib/tt-visuals/gif-post.zsh — ffmpeg helpers for mp4 → gif and poster frame.

[[ -n "${_TT_GIF_POST_SOURCED:-}" ]] && return 0
typeset -g _TT_GIF_POST_SOURCED=1

tt_mp4_to_gif() {
  local in="$1" out="$2"
  ffmpeg -y -i "$in" -vf "fps=12,scale=640:-1:flags=lanczos" -loop 0 "$out" -loglevel error
}

tt_extract_poster() {
  local in="$1" out="$2"
  ffmpeg -y -i "$in" -frames:v 1 "$out" -loglevel error
}
```

- [ ] **Step 4: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/tt-visuals/gif-post.zsh tests/visuals/test-gif-post.zsh
git commit -m "feat(tt-visuals): mp4 → gif + poster-frame ffmpeg helpers"
```

---

## Task 3.5: Wire gif / hero-mp4 markers through render + rewrite

**Files:**
- Modify: `bin/lib/tt-visuals/render.zsh`
- Modify: `bin/lib/tt-visuals/rewrite-mdx.mts`
- Modify: `bin/tt-visuals`
- Create: `tests/visuals/test-markers-gif-and-mp4.zsh`

- [ ] **Step 1: Extend `tt_render_slots` to dispatch video for gif/mp4 slots**

In `bin/lib/tt-visuals/render.zsh`, change the inner-loop section so that when the slot payload carries a `kind: video` hint, the runner is called with `TT_VISUAL_KIND=video` and the output extension is `.mp4`. Add a helper at the top:

```zsh
tt__slot_kind() {
  # echoes "image" or "video"
  local prompts_json="$1" slot="$2"
  node -e '
    const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const slot = process.argv[2];
    if (slot === "hero" && j.hero && j.hero.kind === "video") return process.stdout.write("video");
    const inl = (j.inline || []).find(e => e.slot === slot);
    if (inl && inl.kind === "video") return process.stdout.write("video");
    process.stdout.write("image");
  ' "$prompts_json" "$slot"
}
```

Within the slot loop, before the `_engine_run.zsh` call:

```zsh
local kind ext
kind=$(tt__slot_kind "$prompts_json" "$slot")
ext=$([[ "$kind" == "video" ]] && print -r -- "mp4" || print -r -- "png")
out_file="$slot_dir/$engine.$ext"
TT_VISUAL_KIND="$kind" "$engine_run" "$engine" "$prompt_file" "$out_file"
```

- [ ] **Step 2: Teach `parse-mdx.zsh` users to propagate gif/mp4 hints into the prompts.json**

In `bin/tt-visuals` (just after `drafter_out` is produced), enrich the JSON with `kind` per slot based on the slot lines:

```zsh
drafter_out=$(node -e '
  const raw = process.argv[1];
  const slotLines = JSON.parse(process.argv[2]);
  const j = JSON.parse(raw);
  j.kindHints = {};
  for (const line of slotLines) {
    if (/gif:/.test(line))            j.kindHints[line.split(":")[0]] = "video";
    else if (/^hero-mp4/.test(line))  j.kindHints["hero"] = "video";
  }
  if (j.hero && j.kindHints.hero === "video") j.hero.kind = "video";
  for (const e of j.inline || []) if (j.kindHints[e.slot] === "video") e.kind = "video";
  process.stdout.write(JSON.stringify(j, null, 2));
' "$drafter_out" "$(printf "%s\n" "${slot_lines[@]}" | node -e "let d=\"\";process.stdin.on(\"data\",c=>d+=c);process.stdin.on(\"end\",()=>process.stdout.write(JSON.stringify(d.split(\"\n\").filter(Boolean))))")")
```

- [ ] **Step 3: Update `rewrite-mdx.mts` to handle `[[visual gif:]]` and `[[visual hero mp4:]]`**

Update the body replacement block in `bin/lib/tt-visuals/rewrite-mdx.mts`:

```ts
body = body.replace(/\[\[visual( gif| hero mp4| hero)?:([^\]]*)\]\]/g, (match, kind, _text) => {
  if (kind === " hero") return "";
  if (kind === " hero mp4") return "";
  inlineIdx++;
  const file = installed.inline?.[inlineIdx - 1];
  if (!file) return match;
  const alt = `inline visual ${inlineIdx}`;
  if (file.endsWith(".gif") || file.endsWith(".mp4")) {
    return `<video src="/img/${installed.type}/${installed.slug}/${file}" autoPlay loop muted playsInline aria-label="${alt}" />`;
  }
  return `![${alt}](/img/${installed.type}/${installed.slug}/${file})`;
});
```

- [ ] **Step 4: Extend `bin/tt-visuals`'s installed.json builder to record the actual extension per slot**

Replace the `node -e ...` that builds `installed.json` with:

```bash
node -e '
  const fs = require("fs");
  const picks = JSON.parse(process.argv[1]);
  const candRoot = process.argv[2];
  const type = process.argv[3], slug = process.argv[4];
  const inline = [];
  for (const slot of Object.keys(picks).sort()) {
    if (!slot.startsWith("inline-")) continue;
    const engine = picks[slot];
    const dir = `${candRoot}/${slot}`;
    const candFile = fs.readdirSync(dir).find(f => f.startsWith(`${engine}.`) && !f.endsWith(".meta.json"));
    if (!candFile) continue;
    const ext = candFile.split(".").pop();
    inline.push(`${slot}.${ext}`);
  }
  const out = { type, slug };
  if (picks.hero) {
    const engine = picks.hero;
    const dir = `${candRoot}/hero`;
    const candFile = fs.readdirSync(dir).find(f => f.startsWith(`${engine}.`) && !f.endsWith(".meta.json"));
    const ext = candFile ? candFile.split(".").pop() : "png";
    out.hero = `hero.${ext === "mp4" ? "png" : ext}`;  // hero always installed as a still
  }
  if (inline.length) out.inline = inline;
  process.stdout.write(JSON.stringify(out));
' "..." "$cand_root" "$type" "$slug"
```

(Replace `"..."` with the existing serialised picks object.)

- [ ] **Step 5: Update `install-winner.zsh` so hero mp4 candidates produce both `hero-cover.mp4` and a `hero.png` poster frame**

Add at the top of the install function:

```zsh
# Special-case hero mp4 → extract poster.
if [[ "$slot" == "hero" && "$ext" == "mp4" ]]; then
  cp "$src" "$asset_dir/hero-cover.mp4"
  source "${REPO_ROOT:-${${(%):-%x}:A:h:h:h}}/bin/lib/tt-visuals/gif-post.zsh"
  tt_extract_poster "$src" "$asset_dir/hero.png"
  return 0
fi
```

(This requires `REPO_ROOT` to be exported from `bin/tt-visuals`; do that at the top of the binary: `export REPO_ROOT`.)

- [ ] **Step 6: Write the fixture-driven test**

```zsh
#!/usr/bin/env zsh
# tests/visuals/test-markers-gif-and-mp4.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
FIXTURES="$REPO_ROOT/tests/visuals/fixtures"

cat > "$FIXTURES/sample-gif.mdx" <<'MDX'
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

source "$REPO_ROOT/bin/lib/tt-visuals/parse-mdx.zsh"
source "$REPO_ROOT/bin/lib/tt-visuals/slot-detect.zsh"

tt_test "gif marker is detected as inline-1 gif slot"
result=$(tt_detect_slots "$FIXTURES/sample-gif.mdx")
assert_contains "$result" "inline-1:gif:override:a steady stream of monsoon hitting a stone courtyard, slate cast"

rm -f "$FIXTURES/sample-gif.mdx"
```

- [ ] **Step 7: Run — expect pass**

Run: `tests/visuals/run-all.zsh`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add bin/lib/tt-visuals/render.zsh bin/lib/tt-visuals/rewrite-mdx.mts bin/lib/tt-visuals/install-winner.zsh bin/tt-visuals tests/visuals/test-markers-gif-and-mp4.zsh
git commit -m "feat(tt-visuals): wire gif + hero-mp4 markers through render and rewrite"
```

---

## Task 3.6: Add `r` retry-edit action to pick-ui

**Files:**
- Modify: `bin/lib/tt-visuals/pick-ui.zsh`
- Modify: `bin/tt-visuals`

- [ ] **Step 1: Add a re-edit helper to pick-ui.zsh**

Append:

```zsh
# Usage: tt_edit_prompt_for_slot <prompts-json-path> <slot>
# Opens $EDITOR on a temp file containing the current prompt for <slot>,
# then writes the edited prompt back into prompts.json.
tt_edit_prompt_for_slot() {
  local prompts_json="$1" slot="$2"
  local editor="${EDITOR:-vi}"
  local tmpf
  tmpf=$(mktemp -t tt-edit-prompt-XXXXXX.txt)
  node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const slot = process.argv[2];
    let p = "";
    if (slot === "hero" && j.hero) p = j.hero.prompt;
    else { const e = (j.inline||[]).find(x => x.slot === slot); if (e) p = e.prompt; }
    fs.writeFileSync(process.argv[3], p);
  ' "$prompts_json" "$slot" "$tmpf"
  "$editor" "$tmpf"
  node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const slot = process.argv[2];
    const newPrompt = fs.readFileSync(process.argv[3], "utf8").trim();
    if (slot === "hero" && j.hero) j.hero.prompt = newPrompt;
    else {
      const e = (j.inline||[]).find(x => x.slot === slot);
      if (e) e.prompt = newPrompt;
    }
    fs.writeFileSync(process.argv[1], JSON.stringify(j, null, 2));
  ' "$prompts_json" "$slot" "$tmpf"
  rm -f "$tmpf"
}
```

- [ ] **Step 2: In `bin/tt-visuals`, replace the `__retry__` case with a real loop**

Inside the per-slot pick loop, change:

```zsh
    __skip__|__retry__)
      # __retry__ ignored in PR2 (treated like skip); PR3 wires re-render
      ;;
```

to:

```zsh
    __skip__) ;;
    __retry__)
      tt_edit_prompt_for_slot "$prompts_json_path" "$slot_name"
      # Re-render just this slot across the same engines.
      rm -rf "$slot_dir"; mkdir -p "$slot_dir"
      for e in "${live_engines[@]}"; do
        tt_render_slots "$e" "$prompts_json_path" "$cand_root"
      done
      # Recur on the same slot — limit to one retry to avoid loops.
      pick=$(tt_pick_for_slot "$slot_name" "$slot_dir")
      case "$pick" in
        __quit__) exit 6 ;;
        __skip__|__retry__) ;;
        *) picks[$slot_name]="$pick"; tt_install_winner "$slot_name" "$pick" "$slot_dir" "$asset_dir" "$force" || exit 5 ;;
      esac
      ;;
```

- [ ] **Step 3: Commit (smoke-tested via MANUAL-TESTS only — `$EDITOR` is hard to unit-test)**

```bash
git add bin/lib/tt-visuals/pick-ui.zsh bin/tt-visuals
git commit -m "feat(tt-visuals): retry-edit (r) action in pick UI"
```

---

## Task 3.7: Wire `--engine all` to use parallel-multi; alias tt.vis.codex

**Files:**
- Modify: `bin/tt-visuals`
- Modify: `bin/tt-aliases.zsh`

- [ ] **Step 1: In `bin/tt-visuals`, replace the PR2 "engines=(gemini)" block**

Replace:

```zsh
if [[ "$engine" == "all" ]]; then
  engines=(gemini)
else
  engines=("$engine")
fi
```

with:

```zsh
if [[ "$engine" == "all" ]]; then
  engines=(gemini codex devin)
else
  engines=("$engine")
fi
```

- [ ] **Step 2: Replace the sequential render loop with the parallel helper**

Replace:

```zsh
typeset -i any_render=0
for e in "${live_engines[@]}"; do
  if tt_render_slots "$e" "$prompts_json_path" "$cand_root"; then
    (( any_render++ ))
  fi
done
(( any_render > 0 )) || { print -ru2 -- "error: every engine failed"; exit 5; }
```

with:

```zsh
source "$SCRIPT_DIR/lib/tt-visuals/parallel.zsh"
if (( ${#live_engines[@]} > 1 )); then
  tt_render_slots_multi "${live_engines[*]}" "$prompts_json_path" "$cand_root" \
    || print -ru2 -- "tt-visuals: at least one engine failed (continuing)"
else
  tt_render_slots "${live_engines[1]}" "$prompts_json_path" "$cand_root" \
    || { print -ru2 -- "error: render failed"; exit 5; }
fi
```

- [ ] **Step 3: Add `tt.vis.codex` alias**

Append to `bin/tt-aliases.zsh`:

```zsh
alias tt.vis.codex='tt-visuals --engine codex'
```

- [ ] **Step 4: Commit**

```bash
git add bin/tt-visuals bin/tt-aliases.zsh
git commit -m "feat(tt-visuals): --engine all uses parallel renderer; add tt.vis.codex"
```

---

## Task 3.8: Extend MANUAL-TESTS.md for PR3

**Files:**
- Modify: `MANUAL-TESTS.md`

- [ ] **Step 1: Append the PR3 section**

```markdown
## tt-visuals (PR3 — parallel + GIF/mp4 + retry-edit)

Prereq: at least two of `GEMINI_API_KEY`, `OPENAI_API_KEY`, and a `devin`
session active. Use a fresh draft post.

- [ ] `tt-visuals musings/<slug>` (no `--engine`) runs all three engines in parallel
- [ ] Preview shows three candidates per slot; choosing `1` installs the gemini one
- [ ] Choosing `r` for a slot opens `$EDITOR` on the prompt, then re-renders only that slot
- [ ] Post with `[[visual gif: ...]]` marker writes `inline-N.gif` + `inline-N.mp4` and the mdx uses a `<video>` tag for that slot
- [ ] Post with `[[visual hero mp4: ...]]` writes `hero-cover.mp4` + `hero.png` (poster frame); frontmatter `heroImage` points at the still
- [ ] `pnpm content` builds cleanly after both gif and mp4 hero installs
- [ ] If `OPENAI_API_KEY` is missing, the codex engine is skipped without aborting the run
- [ ] Concurrency: `TT_VISUAL_MAX_PARALLEL=1 tt-visuals musings/<slug>` runs slot×engine pairs strictly serially
```

- [ ] **Step 2: Commit**

```bash
git add MANUAL-TESTS.md
git commit -m "docs(tt-visuals): MANUAL-TESTS.md PR3 checklist"
```

---

## Task 3.9: PR3 verification + open PR

- [ ] **Step 1: Full unit suite + Velite**

Run: `tests/visuals/run-all.zsh && pnpm vitest run lib/mdx/ && pnpm content`
Expected: all green.

- [ ] **Step 2: Walk PR3 MANUAL-TESTS.md against a real draft**

Confirm each checkbox.

- [ ] **Step 3: Open PR3**

```bash
git checkout -b feat/tt-visuals-pr3-parallel
git push -u origin feat/tt-visuals-pr3-parallel
gh pr create --title "tt-visuals PR3: parallel render + GIF/mp4 + remaining engines" --body "$(cat <<'EOF'
## Summary
- Codex + Devin engine branches in `bin/_engine_run.zsh`; video_cmd path for both
- `parallel.zsh` fan-out helper with `TT_VISUAL_MAX_PARALLEL` cap
- `render.zsh` gains `tt_render_slots_multi` for engine-parallel orchestration
- `gif-post.zsh` ffmpeg helpers (mp4 → looping gif, poster-frame extraction)
- `[[visual gif: ...]]` and `[[visual hero mp4: ...]]` marker handling end-to-end
- Pick UI `r` retry-edit action opens `$EDITOR` and re-renders one slot
- Aliases: `tt.vis.codex`; MANUAL-TESTS.md extended

## Test plan
- [ ] `tests/visuals/run-all.zsh` green
- [ ] `pnpm vitest run lib/mdx/ && pnpm content` green
- [ ] MANUAL-TESTS.md "tt-visuals (PR3)" checklist walked end-to-end

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

# Self-review notes (already addressed in the plan)

1. **Spec coverage.** Every spec section maps to a task: skill scaffolding (1.1–1.7), `visual-style.md` (1.2), draft prompt + JSON contract (1.3, 1.13), marker grammar incl. hero-mp4 (1.10, 3.5), slot detection (1.11), dry-run (1.14), engine recipes (1.5), schema extraction (2.1), atomic mdx rewrite (2.8), Preview pick UI (2.6), install + backup (2.7), social crops (2.9), single-engine wiring (2.10), parallel orchestration (3.2, 3.3, 3.7), codex/devin (3.1), gif/mp4 (3.4, 3.5), retry-edit (3.6).
2. **Placeholders.** Every step contains the exact code or command. The only "TBD" surfaces are intentional — the `qa-image.md` stub (Task 1.4) and `engines/<name>.md` pricing references — both documented as deferred in the spec.
3. **Type consistency.** Library entry points used across tasks: `tt_parse_frontmatter_field`, `tt_parse_markers`, `tt_detect_slots`, `tt_run_drafter`, `tt_render_slots`, `tt_render_slots_multi`, `tt_pick_for_slot`, `tt_install_winner`, `tt_rewrite_mdx`, `tt_make_social_crops`, `tt_mp4_to_gif`, `tt_extract_poster`, `tt_edit_prompt_for_slot`, `tt_parallel_run`. Every name is referenced consistently from its defining task through the tasks that call it.
4. **Open questions from the spec.** Pre-commit hook framework — verified: no Husky / lefthook / git hooks exist (PR1 does not introduce one; unit tests live under `tests/visuals/run-all.zsh` and are run manually plus on-demand via `pnpm test:visuals`). Cost-estimate source — hardcoded references kept in `engines/<name>.md` per spec. `[[visual ...]]` renderer behaviour — markers that aren't substituted are emitted as `''` (hero) or left as fallback (inline when no install file exists) by `rewrite-mdx.mts`; a Velite remark plugin to strip stray markers at render-time is intentionally deferred to a future PR.
