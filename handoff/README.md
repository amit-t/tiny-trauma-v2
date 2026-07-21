# Tiny Trauma — v2 handoff

This folder is the design-phase bundle Claude Code used to build the v2 app.

> **Status.** The site has since become a **fully static export** hosted on
> here.now, and the newsletter moved to **Substack**. The database, the auth
> layer, the admin dashboard and every API route are gone. The phase prompts,
> `ROADMAP.md` and `QUICKSTART.md` are kept as a record of how the project was
> originally built — they describe a stack that no longer exists. For current
> reality, read [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DEPLOY.md`](./DEPLOY.md)
> and the root [`README.md`](../README.md).

## What this is

**Two pieces:**

1. **A small reading website** (`tinytrauma.com`) — public essays and short
   fictions, plus a link to the newsletter. A static site, published to
   here.now.
2. **A local writing studio** — runs entirely on your laptop inside Claude
   Code via the `tiny-trauma-content` skill. Brainstorms with you, drafts
   essays in voice, outputs ready-to-commit MDX files.

Content flows: **brainstorm locally → MDX file → git commit → git push → CI
rebuilds the static site → essay is live.**

This split is intentional. The website has no server, no database and no
secrets at all. All the AI heavy-lifting happens locally in your existing
Claude Code workflow, so the deployed site stays a directory of files and your
Anthropic costs stay local.

## Two stacks, clearly separated

**Website (deployed):**
- **Next.js 16** (app router, `output: "export"`) + **TypeScript** + **React 19**
- **Tailwind v4** (CSS-first config; tokens in `design/styles-v3.css`)
- **No database.** Nothing is stored at runtime, because there is no runtime.
- **Velite** compiles the MDX in `content/` at build time, with custom remark
  plugins for the handwritten / pullquote / aside marks
- **Substack** hosts the newsletter; the site links out to it
- **here.now** static hosting, republished on push to `main`
- **Plausible** (optional) for public analytics

Retired with the move to static: Postgres, Drizzle, Better Auth, Resend,
react-email, DigitalOcean App Platform and the GitHub Actions send cron.

**Studio (local-only, Claude Code skill):**
- A `.claude/skills/tiny-trauma-content/` skill folder
- Uses your existing Claude Code subscription — no separate API key needed
- Outputs MDX files into `content/musings/` or `content/shorts/`
- You commit + push when you're ready to publish

## How to use this bundle

1. Clone the empty repo locally: `git clone git@github.com:amit-t/tiny-trauma-v2.git`
2. Copy this entire `handoff/` folder into the repo root.
3. From inside the repo, run **Claude Code**:
   ```
   claude
   ```
4. Paste this prompt to begin:
   ```
   Read handoff/CLAUDE.md and handoff/ROADMAP.md in full. Then start
   handoff/prompts/phase-0-bootstrap.md. Work one phase at a time.
   Stop after each phase and ask me to verify before moving on.
   ```
5. The agent works phase-by-phase. Each phase has its own prompt file with
   acceptance criteria. Verify, then say "phase N done, start phase N+1".

The **content skill** is installed separately — see `skills/tiny-trauma-content/`
in this bundle. Drop it into `.claude/skills/` in the repo (or `~/.claude/skills/`
globally) and invoke when you want to write.

## File map

```
handoff/
├── README.md                  ← this file
├── QUICKSTART.md              ← human-facing 3-min setup
├── CLAUDE.md                  ← agent rules, voice, conventions
├── ARCHITECTURE.md            ← stack, data model, routing, key flows
├── ROADMAP.md                 ← six build phases (historical)
├── DESIGN-SYSTEM.md           ← tokens, type, components, voice rules
├── CONTENT-MODEL.md           ← MDX schema, frontmatter, custom marks
├── DEPLOY.md                  ← static export + here.now deployment
├── design/                    ← static reference — do not modify
│   ├── styles-v3.css
│   ├── index.html, musings.html, musing.html
│   ├── shorts.html, short.html
│   ├── about.html, newsletter.html
├── prompts/                   ← one prompt per phase, paste into Claude Code
│   ├── phase-0-bootstrap.md
│   ├── phase-1-design-system.md
│   ├── phase-2-public-site.md
│   ├── phase-3-auth-admin-shell.md
│   ├── phase-4-mdx-content.md
│   ├── phase-5-newsletter.md
│   └── phase-6-polish-deploy.md
└── skills/                    ← Claude Code skill for the writing studio
    └── tiny-trauma-content/
        ├── SKILL.md           ← v0 skill — refine with you in a grill-me session later
        └── voice-rules.md     ← the voice spec the skill reads on every invocation
```

## A note on scope

Build for one writer (you). Don't add roles, teams, multi-tenant, or moderation.
Optimise for "Sunday morning, coffee in hand, write the essay, hit send, done."

## A note on voice

Read `DESIGN-SYSTEM.md`. Tiny Trauma's tone is dry, slightly literary,
lowercase-first, italics for emphasis (never bold), and the handwritten font
is for the writer's margin asides only. Every empty state inherits the same
voice — they say things like *"no drafts. probably for the best."* not
*"You don't have any drafts yet!"*

The voice is part of the product. Microcopy reviews are a real PR.
