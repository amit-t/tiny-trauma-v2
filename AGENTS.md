<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:skills -->

# Skills

This repo follows the `.agent/skills/` convention. Each directory under
`.agent/skills/` is a skill — load its `SKILL.md` to learn how to run it.

The entries are symlinks into `.claude/skills/` (project-local) and into
`~/.claude/skills/` (user-global, e.g. `grill-me`), which remain the
canonical sources. Edit the originals, not the symlinks.

Skills currently mirrored:

- `tiny-trauma-content` — essay / short / brainstorm / cross-post flows
- `tt-currently` — update the homepage "currently" footer block
- `tt-instagram-ingest` — refresh the Instagram saves catalog
- `tt-visuals` — image / GIF / social-crop generator for published posts
- `grill-me` — stress-test plans and designs via interview

Local CLI wrappers for the first three live in `bin/tt-*` and dispatch
to any of `claude`, `codex`, `gemini`, or `devin` via `--engine`. See
`docs/superpowers/specs/2026-05-19-tt-content-cli-design.md`.

<!-- END:skills -->
