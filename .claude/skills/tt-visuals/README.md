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
