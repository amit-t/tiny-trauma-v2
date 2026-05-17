# tiny-trauma-content

A Claude Code skill for writing Tiny Trauma essays and shorts. Runs locally
on your machine. Outputs ready-to-commit `.mdx` files.

This is **v0**. It works, but it's a starting point. After you write one or
two essays with it, run a grill-me session with Claude Code to refine it
based on what felt off.

## What this skill does

A structured grill-me session for writing one essay or short, end-to-end:

1. **Open** — pick mode (essay / short / brainstorm-only)
2. **Notice** — asks what you've been noticing this week. Captures three to
   five small frictions in your own words.
3. **Angle** — proposes 3–5 possible essays from those notes, each with a
   one-line thesis. You pick one (or "none of those, here's what I mean").
4. **Outline** — 4–6 beats, in voice. You approve or redirect.
5. **Draft** — writes a first draft. Reads it back to you. Asks one question
   that would sharpen it.
6. **Edit pass** — tightens, suggests italics, suggests the handwritten
   inline phrase, suggests where to break to a pullquote. You accept or push
   back, paragraph by paragraph.
7. **Title** — three options, each in voice (italics in the right place).
8. **Tags + heroTint + number** — fills frontmatter.
9. **Write the file** — emits `content/musings/<slug>.mdx` or
   `content/shorts/<slug>.mdx`. Tells you what to `git add`.

There is also a "cross-post" sub-mode that takes an already-published MDX
file and generates Twitter / LinkedIn / Instagram variants for you to paste.

## How to install

**Repo-local (recommended):**

```bash
mkdir -p .claude/skills
cp -R handoff/skills/tiny-trauma-content .claude/skills/
git add .claude/skills && git commit -m "chore: install tiny-trauma-content skill"
```

**Global (across all projects):**

```bash
mkdir -p ~/.claude/skills
cp -R handoff/skills/tiny-trauma-content ~/.claude/skills/
```

## How to use

From inside the repo, open Claude Code:

```
claude
```

Then:

```
> /skill tiny-trauma-content essay
```

Or for a short fiction:

```
> /skill tiny-trauma-content short
```

Or just brainstorm without committing to an output:

```
> /skill tiny-trauma-content brainstorm
```

Or generate cross-posts for an already-published essay:

```
> /skill tiny-trauma-content cross-post musings/why-i-cry-at-ads
```

## Files

```
tiny-trauma-content/
├── SKILL.md            ← the entry-point skill prompt
├── voice-rules.md      ← the voice spec (read every invocation)
├── frontmatter-spec.md ← the MDX frontmatter schema
└── prompts/
    ├── essay.md        ← the essay flow
    ├── short.md        ← the short fiction flow
    ├── brainstorm.md   ← brainstorm without committing
    └── cross-post.md   ← Twitter / LinkedIn / Instagram variants
```

`SKILL.md` is the entry point Claude Code reads. Everything else is referenced
from there.
