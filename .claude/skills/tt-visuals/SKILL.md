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

> Note: M1 of this skill ships only the dry-run drafter path. Render, pick, install, social-crops, and atomic mdx rewrite arrive in M2/M3.

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
