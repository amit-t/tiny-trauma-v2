# Tiny Trauma — v2 handoff

This folder is everything Claude Code needs to build the v2 app from the v3 design.

## What this is

**A writing platform that looks like a literary blog.** Public-facing it's a small,
honest personal site for essays and short fiction. Behind the auth wall it's a full
workshop — drafting, brainstorming with Claude, editing, scheduling, newsletter
sending, light social cross-posting. One person uses the admin (you). Everyone else
reads.

It is **not** a static MDX blog. Posts live in Postgres so they can be drafted,
re-edited, scheduled, and AI-assisted in-app.

## The stack (decisions already made — do not re-litigate)

- **Next.js 15** (app router) + **TypeScript** + **React 19**
- **Tailwind v4** (CSS-first config, tokens already drafted in `design/styles-v3.css`)
- **Postgres** via **Neon** (serverless, free tier) + **Drizzle ORM** + **drizzle-kit**
- **Better Auth** (single owner account; email + magic-link, no password)
- **Anthropic SDK** for AI assists (Claude Sonnet 4.5 default, Haiku for cheap calls)
- **Resend** for transactional + newsletter sends, **react-email** for templates
- **TipTap** editor (markdown-flavored, with custom marks for pullquote, marginalia, handwritten aside)
- **Vercel** deploy (project secrets in dashboard; env.local.example included)
- **Plausible** (self-hosted or paid) for public analytics — optional, phase 5

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
5. The agent will work phase-by-phase. Each phase has its own prompt file with
   acceptance criteria. Verify, then say "phase N done, start phase N+1".

## File map

```
handoff/
├── README.md                  ← this file
├── CLAUDE.md                  ← agent rules, voice, conventions
├── ARCHITECTURE.md            ← stack, data model, routing, key flows
├── ROADMAP.md                 ← seven phases, what each delivers
├── DESIGN-SYSTEM.md           ← tokens, type, components, voice rules
├── CONTENT-MODEL.md           ← schema for posts, drafts, campaigns, etc.
├── design/                    ← static reference — do not modify
│   ├── styles-v3.css          ← the design tokens (already final)
│   ├── index.html             ← home — visual ground truth
│   ├── musings.html, musing.html
│   ├── shorts.html,  short.html
│   ├── about.html
│   └── newsletter.html
└── prompts/                   ← one prompt per phase, paste into Claude Code
    ├── phase-0-bootstrap.md
    ├── phase-1-design-system.md
    ├── phase-2-public-site.md
    ├── phase-3-auth-admin-shell.md
    ├── phase-4-content-crud.md
    ├── phase-5-ai-workshop.md
    ├── phase-6-newsletter.md
    └── phase-7-cross-posting.md
```

## A note on scope

Build for one writer (you). Don't add roles, teams, multi-tenant, or moderation.
Optimise for "Sunday morning, coffee in hand, write the essay, hit send, done."

## A note on voice

Read DESIGN-SYSTEM.md. Tiny Trauma's tone is dry, slightly literary, lowercase-first,
italics for emphasis (never bold), and the handwritten font is for the writer's
margin asides only. The admin UI inherits the same voice — empty states say things
like *"no drafts. probably for the best."* not *"You don't have any drafts yet!"*

The voice is part of the product. Microcopy reviews are a real PR.
