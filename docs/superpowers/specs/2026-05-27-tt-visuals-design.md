---
title: tt-visuals — local-CLI image & GIF generator for Tiny Trauma posts
date: 2026-05-27
author: amit-t (with Claude)
status: approved (brainstorm)
---

# tt-visuals — design spec

The third leg of the Tiny Trauma authoring tripod. Given a published or
draft `.mdx` essay or short, generate the hero image, inline illustrations,
short looping GIFs, and social crops by orchestrating image-gen CLIs that
are already installed on the local machine (`gemini`, `codex`, optionally
others), then install the picked winners into the repo and rewrite the mdx
so the post ships with art.

## Workflow context

```
tt-ingest                  → inspirations/instagram/posts/*.mdx
tt-essay / tt-short        → content/{musings,shorts}/<slug>.mdx
tt-visuals  ← THIS SPEC →  public/img/{musings,shorts}/<slug>/*
```

Manual invocation per slug. Mirrors the existing `bin/tt-*` + skill
convention so all three legs feel like one toolbox.

## Decisions captured from brainstorm

| Question | Decision |
|----------|----------|
| Output scope | Hero + inline illustrations + GIFs/mp4s + social crops (all four) |
| Invocation | Manual CLI per slug |
| Engine policy | `--engine all` default (parallel + pick); single `--engine <name>` overrides; per-engine aliases |
| Prompt source | Hybrid — LLM drafts from mdx + style guide; inline `[[visual: ...]]` markers override |
| Pick UI | macOS Preview / QuickLook |
| Asset layout | Per-post folder under `public/img/<type>/<slug>/` |
| Visual style | Hand-drawn editorial illustration + muted heroTint palette + no faces |
| Prompt gate | Fire-through (no editor gate before render); `r` retry escape hatch lives inside the pick UI |

## Architecture & file layout

### New surfaces

```
.claude/skills/tt-visuals/
  SKILL.md                 # contract + flow
  visual-style.md          # brand rulebook (hand-drawn editorial, muted heroTints, no faces)
  prompts/
    draft-prompts.md       # LLM prompt: read mdx + style → emit per-slot prompts as JSON
    qa-image.md            # stub for v1; vision QA in a later release
  engines/
    gemini.md              # CLI invocation recipe (image + video)
    codex.md               # CLI invocation recipe (image + video)
    claude.md              # orchestration + vision QA only (no native image gen)
  README.md

bin/
  tt-visuals               # zsh entrypoint, uses _tt-engine.zsh
  _engine_run.zsh          # internal: dispatch one slot×engine render to the right CLI

.agent/skills/tt-visuals   # symlink → .claude/skills/tt-visuals

tests/visuals/
  fixtures/sample-musing.mdx
  fixtures/hero-stub.png
  *.zsh                    # unit tests for parser, slot detection, frontmatter rewrite

docs/superpowers/specs/2026-05-27-tt-visuals-design.md   # this file
```

### Asset & content surfaces

```
public/img/<type>/<slug>/    # type ∈ {musings, shorts}; created on first run
  hero.png                   # frontmatter heroImage rewrites to /img/<type>/<slug>/hero.png
  inline-1.png               # numbered by source-order of [[visual: ...]] markers in mdx
  inline-2.gif               # animated if marker reads [[visual gif: ...]]
  hero-cover.mp4             # optional looped hero, if [[visual hero: ... mp4 ...]]
  social-1x1.png             # ffmpeg-derived crops from final hero
  social-4x5.png
  social-16x9.png
  .prompts.json              # auditable record of every prompt sent to every engine
  .candidates/               # losing candidates retained until next run, then pruned
```

### Verified local toolchain

`command -v` probe on the dev machine on 2026-05-27 found:
`gemini`, `codex`, `claude`, `devin`, `ffmpeg`. No local diffusion CLIs
(no `flux`, `mflux`, `sdxl`, `comfy`). Skill is multi-engine-pluggable —
dropping a new `engines/<name>.md` plus a branch in `_engine_run.zsh` adds
support for any future CLI.

## Marker grammar

New mdx body syntax, parsed by `tt-visuals` only. The site renderer
already ignores unrecognised bracket tokens, so any unprocessed marker
falls through as literal text fallback rather than breaking the build.

```
[[visual: <prompt override>]]            # inline still image, default style
[[visual gif: <prompt override>]]        # inline animated loop (2–5s), uses video engine
[[visual hero: <prompt override>]]       # override hero prompt mid-body (rare)
[[visual skip]]                          # explicit "no image here" — drafter must not fill
```

Position in source = render position. The drafter receives the surrounding
paragraph as caption-context when filling an empty `[[visual:]]`.

## Slot detection

| Slot | Generated when | Prompt source |
|------|----------------|---------------|
| `hero` | `frontmatter.heroImage` absent **or** explicit `[[visual hero: ...]]` present | inline override > drafter; skip if `heroImage` already set and no override |
| `inline-N` | one per `[[visual: ...]]` or `[[visual gif: ...]]` marker, source-order | inline text wins; drafter fills only bracket-only `[[visual:]]` (empty body) |
| `social-1x1` / `4x5` / `16x9` | always, after hero is final | ffmpeg centered crop, no prompt |

## Prompt drafter

Lives at `prompts/draft-prompts.md`. Default drafter engine: `claude`
(temperature 0.3). Overridable with `--draft-engine`.

**Inputs (in this order, into the LLM context window):**
1. `voice-rules.md` (re-read from the `tiny-trauma-content` skill — visuals must match tone)
2. `visual-style.md` (the v1 rulebook below)
3. Full mdx body + frontmatter (including `heroTint`)
4. JSON list of slots needing drafting (`["hero", "inline-1", "inline-2"]`)

**Output (strict JSON, schema-validated; one retry on parse fail, then exit 4):**

```json
{
  "hero": {
    "prompt": "A copper kettle whistling on a kitchen sill at first light...",
    "negative": "no faces, no people centered, no text, no logos, no watermark, no photoreal, no 3D, no anime, no glossy",
    "aspect": "16:9",
    "tint": "sage"
  },
  "inline": [
    {
      "slot": "inline-1",
      "prompt": "...",
      "negative": "...",
      "aspect": "4:3",
      "tint": "sage"
    }
  ]
}
```

### `visual-style.md` v1

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

### Frontmatter precedence

- `heroTint: none` + `[[visual hero: ...]]` → drafter respects `none` (uncoloured ink).
- `heroTint: sage` + no hero marker → drafter writes a sage-cast hero prompt.
- Author can override tint per-slot inside the marker: `[[visual: a kettle on a sill, butter cast]]`.

## Engine recipes

Each `engines/<name>.md` is a declarative recipe loaded at runtime:

```yaml
name: gemini
image_cmd: 'gemini image generate --model {model} --prompt-file {prompt} --output {out} --aspect {aspect}'
video_cmd: 'gemini video generate --model {model} --prompt-file {prompt} --output {out} --duration 3'
default_image_model: imagen-4-ultra
default_video_model: veo-3
env_required: [GEMINI_API_KEY]      # or gcloud auth — CLI handles, this is the env-fallback
aspect_map: { "16:9": "16:9", "4:3": "4:3", "1:1": "1:1", "4:5": "4:5" }
```

### v1 model defaults (editable per file)

| Engine | Image model | Video/GIF model | Auth |
|--------|-------------|------------------|------|
| `gemini` | `imagen-4-ultra` | `veo-3` | `GEMINI_API_KEY` or `gcloud auth` |
| `codex` | `gpt-image-1` | `sora-2` | `OPENAI_API_KEY` |
| `claude` | none (orchestration + vision QA only) | none | `ANTHROPIC_API_KEY` |
| `devin` | passthrough (delegates internally) | passthrough | devin session |

Skill probes `command -v <engine>` + required env at startup. Missing CLI
or missing env → engine silently skipped for that run, logged to
`.prompts.json`. If **zero** engines available → exit 3.

## Runtime flow (one slug)

```
tt-visuals musings/<slug>
  ├─ load mdx, parse frontmatter + body
  ├─ detect slots:
  │    hero      = absent if frontmatter.heroImage missing
  │    inline-N  = one per [[visual ...]] marker
  │    social-*  = always (post-hero, deterministic)
  ├─ LLM drafter (claude by default) reads voice-rules + visual-style + post
  │     → emits JSON {hero: {...}, inline: [{...}, ...]}
  ├─ inline overrides win: marker text replaces drafted prompt for that slot
  ├─ parallel render across available engines (configurable via --engine)
  ├─ write candidates → /tmp/tt-visuals-<slug>/<slot>/<engine>.{png|mp4}
  ├─ Preview UI per slot: open candidates → user picks one (or retry / skip / quit)
  ├─ install winners → public/img/<type>/<slug>/
  ├─ rewrite mdx (atomic):
  │    frontmatter.heroImage = "/img/<type>/<slug>/hero.png"
  │    [[visual ...]] markers → ![alt](/img/<type>/<slug>/inline-N.png)
  ├─ ffmpeg derives social crops from hero
  └─ print git add/commit/push hint
```

## Parallel render orchestration

```
for slot in [hero, inline-1, inline-2, ...]:
  for engine in (available_image_engines  if --engine all
                 else [--engine arg]):
    spawn  _engine_run.zsh <engine> <prompt.json> /tmp/tt-visuals-<slug>/<slot>/<engine>.<ext> &
wait
# all candidates land before Preview opens for picking
```

- Concurrency cap: env `TT_VISUAL_MAX_PARALLEL`, default `4`. Engines × slots can multiply fast on long posts.
- Per-engine retry: 1 retry on transient (network) error, 0 retries on policy/auth errors.
- Each candidate gets a sidecar `.meta.json` with engine, model, prompt, latency-ms, cost-estimate.

## Pick UI (Preview / QuickLook)

Phase per slot, hero first then inline-1, inline-2, ...:

```
$ tt-visuals musings/grandmother-forgets-kettle
[draft] claude → prompts.json written (3 slots: hero, inline-1, inline-2)
[render] hero × {gemini, codex} ......... 2/2 ok
[render] inline-1 × {gemini, codex} ..... 2/2 ok
[render] inline-2 × {gemini, codex} ..... 1/2 ok (codex: policy refusal — see .prompts.json)

▶ picking hero
  opening Preview with 2 candidates...
  qlmanage -p /tmp/tt-visuals-.../hero/gemini.png /tmp/tt-visuals-.../hero/codex.png

  Which one wins?
    [1] gemini.png    (imagen-4-ultra, 2.4s, ~$0.04)
    [2] codex.png     (gpt-image-1,    4.1s, ~$0.08)
    [r] re-draft prompt and re-render (opens prompt in $EDITOR)
    [s] skip this slot (leave frontmatter / marker untouched)
    [q] quit, keep nothing
  > 1
  ✓ installed → public/img/musings/grandmother-forgets-kettle/hero.png
```

- Numeric pick = winner installed; losers stay in `.candidates/` until next run prunes.
- `r` reopens prompt in `$EDITOR`, reruns *only* that slot. The single escape hatch the fire-through default needs.
- `s` writes nothing; if hero, frontmatter unchanged; if inline, `[[visual: ...]]` marker stays as fallback text.

### GIF / video slots

Same flow, QuickLook auto-plays mp4. Codex emits mp4 → ffmpeg post-step
writes both `.mp4` (for `<video>` tag) and `.gif` (for fallback + cross-post).

### Social crops (no pick UI — deterministic post-step on chosen hero)

```
ffmpeg -i hero.png -vf "crop=min(iw\,ih):min(iw\,ih)"     social-1x1.png
ffmpeg -i hero.png -vf "crop=iw:iw*5/4"                    social-4x5.png
ffmpeg -i hero.png -vf "crop=iw:iw*9/16"                   social-16x9.png
```

Centered crop in v1. Saliency-based smart-crop deferred.

## CLI surface

### `bin/tt-visuals` synopsis

```
tt-visuals <type/slug>           # required positional: musings/<slug> or shorts/<slug>
  [--engine claude|codex|gemini|devin|all]   # default: all (parallel pick)
  [--slots hero,inline,social,gif]           # default: hero,inline,social
  [--only-missing]                           # default behaviour; --force overrides
  [--force]                                  # re-render even slots already installed
  [--draft-engine claude|gemini|codex]       # which engine writes prompts; default: claude
  [--no-draft]                               # skip drafter, load existing .prompts.json verbatim
  [--dry-run]                                # write .prompts.json, render nothing, zero API calls
  [--no-install]                             # render + Preview pick, skip mdx rewrite + file install
  [--keep-candidates]                        # don't prune losing candidates after install
  [--max-parallel N]                         # override TT_VISUAL_MAX_PARALLEL
  [-h|--help]
```

### Aliases (in `bin/tt-aliases.zsh`)

```zsh
alias tt.vis='tt-visuals'
alias tt.vis.gemini='tt-visuals --engine gemini'
alias tt.vis.codex='tt-visuals --engine codex'
alias tt.vis.dry='tt-visuals --dry-run'
```

### Exit codes

| Code | Meaning |
|------|---------|
| 0 | All requested slots installed (or user explicitly skipped) |
| 2 | Usage error (bad flag, missing slug, slug not found) |
| 3 | No engines available (missing CLI + missing env on every engine) |
| 4 | LLM drafter returned invalid JSON twice |
| 5 | Every engine failed on every slot (network / policy / auth) |
| 6 | User quit (`q`) before installing anything |
| 127 | CLI binary missing on PATH (per existing `_tt-engine.zsh` convention) |

## Error handling

- **Single-engine failure on one slot** → log, continue, Preview shows whatever survived. If zero survivors for a slot, prompt user: re-draft / skip / quit.
- **Policy refusal** (safety block) → captured as `error.policy` in `.prompts.json` with the engine's verbatim message. No auto-rewording: drafter has the style guide; if it still triggers policy, that's a human call.
- **Auth error** → engine marked dead for the rest of this invocation; printed once at end with fix hint.
- **Drafter JSON parse fail** → retry once with parse error appended to context. Second fail → exit 4 with `.prompts.json` written so the user can hand-edit and re-run with `--no-draft`.
- **Mdx rewrite is atomic**: write to `<slug>.mdx.tmp`, validate frontmatter against the Velite Zod schema via a small node script, then `mv` over the original. Validation failure → restore original mdx, exit 5.

## Idempotency

- Re-running `tt-visuals musings/<slug>` with no flags = `--only-missing`: skips slots already installed in `public/img/.../`, drafts + renders only the gaps.
- `--force` re-renders everything but backs up existing files to `public/img/.../<slot>.bak-<timestamp>.<ext>` first. `.bak-*` files are gitignored.
- `.prompts.json` is overwritten every run; prior prompts retrievable via git history (it is committed).
- Drafter is deterministic-ish: same mdx + same `visual-style.md` = same prompts (temperature pinned at 0.3, model pinned in engine config). Re-runs without content changes shouldn't drift wildly.

## Dry-run

`--dry-run` runs the drafter, writes `public/img/<type>/<slug>/.prompts.json`,
prints proposed prompts to stdout, makes **zero** image-gen API calls. The
intended pre-flight before committing to parallel render across 3 engines ×
4 slots.

## `.gitignore` additions

```
/public/img/**/.candidates/
/public/img/**/*.bak-*
/tmp/tt-visuals-*/
```

`.prompts.json` is **committed** — the audit trail for every post's visuals.

## Testing

| Layer | What it covers | How |
|-------|----------------|-----|
| Unit (zsh) | flag parsing, slot detection from sample mdx, marker grammar parser, frontmatter rewrite, ffmpeg crop math | `tests/visuals/*.zsh` run via `zsh test.zsh`. Mocks `_engine_run.zsh` with a stub that copies fixture PNGs from `tests/visuals/fixtures/` |
| Integration (node) | Velite Zod schema accepts every rewritten mdx; `<video>` / `<img>` mdx renders without remark plugin errors | One-shot script `pnpm test:visuals` runs `velite build` on a fixture content dir |
| Smoke (manual) | Real CLI calls — single slot single engine, `--dry-run` first then real render | New "Visuals" section in `MANUAL-TESTS.md`: dry-run, single engine, parallel pick, retry-edit, social crops, mdx rewrite, re-run idempotency |

Fixtures: `tests/visuals/fixtures/sample-musing.mdx` with every marker
variant (empty `[[visual:]]`, override `[[visual: kettle]]`, gif
`[[visual gif: rain]]`, skip `[[visual skip]]`) plus three placeholder
PNGs for engine stubs.

No CI for integration / smoke layers — they cost API money. Unit layer
runs in the pre-commit hook (existing hook setup to be confirmed during
planning).

## Observability

- `.prompts.json` per post — full audit, committed.
- Per-run log to `~/.tt-visuals/log/<slug>-<iso>.json`: timings, costs, engine choices, retries, user picks. Local-only, gitignored at user level.
- `tt-visuals --stats` (deferred to a later release): aggregates logs across runs into total spend, picks-per-engine, avg latency.

## Rollout plan

Three PRs, smallest first. Each independently revertable.

1. **Skill + style guide + dry-run only.** Ships the `tt-visuals` skill
   folder, `bin/tt-visuals` binary, marker parser, drafter, `--dry-run`.
   No real image gen — only writes `.prompts.json`. Mergeable + immediately
   useful for iterating on `visual-style.md` without spending a cent on
   Imagen / GPT-Image. Includes `visual-style.md` v1.

2. **Single-engine render + Preview pick + mdx rewrite.** Adds `--engine`
   flag, real `gemini` invocation, Preview pick UI, atomic mdx rewrite,
   idempotent re-runs. Single engine = the simplest happy path. Codex /
   devin recipes deferred.

3. **Parallel `--engine all` + GIF/video + social crops + remaining engines.**
   Adds codex + devin engine recipes, parallel orchestration, ffmpeg
   gif/mp4 + social crop post-step, candidate pruning, retry-edit (`r`)
   escape hatch.

Backout: each PR is one new directory plus one new binary. Revert = `git
revert`; no schema migrations, no runtime services, no third-party
dependencies added to `package.json` (gemini / codex / devin are external
CLIs).

## Out of scope for v1 (documented, deferred)

- Vision QA (`prompts/qa-image.md`) — auto-rejection of style-violating candidates. Stub the file, leave empty.
- Smart-crop via saliency detection.
- File-watcher auto-rerun on content edit.
- `--stats` aggregator.
- Web companion picker (Preview is enough for v1).
- Local diffusion engines (no `flux` / `mflux` / `sdxl` / `comfy` on PATH today) — skill is multi-engine-pluggable, can add `engines/flux.md` later when installed.

## Open questions for the implementation plan

1. Pre-commit hook framework — does this repo use Husky, lefthook, or a
   raw `.git/hooks/pre-commit`? The unit-test runner attaches to whatever
   is already in place; if nothing exists, do **not** introduce a new
   framework as part of this work.
2. Cost-estimate source — are official per-image / per-second pricing
   numbers available from each CLI's `--help` or do we hardcode in the
   `engines/<name>.md` files? Hardcode for v1 with a comment pointing at
   the vendor pricing page.
3. The `[[visual ...]]` markers need a Velite remark plugin behaviour
   confirmation: today the renderer ignores unknown bracket tokens as
   plain text, but on a `[[visual:]]` line we want it to render as
   *nothing* visible rather than literal text once `tt-visuals` has
   processed and replaced it. Add a tiny `remark-visual-marker.ts` that
   strips any remaining markers at render time as a safety net — confirm
   the velite plugin pipeline supports this during planning.
