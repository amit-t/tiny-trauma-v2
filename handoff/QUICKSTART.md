# QUICKSTART — for you (the human)

Three minutes to start the agent.

## 1. Set up the local repo

```bash
git clone git@github.com:amit-t/tiny-trauma-v2.git
cd tiny-trauma-v2
```

The repo is empty. Drop this entire `handoff/` folder in the root.

```bash
# from inside tiny-trauma-v2
git add handoff/
git commit -m "docs: handoff bundle from design phase"
git push
```

## 2. Get the prerequisites

Sign up / get keys:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop)** —
  for the local Postgres. Free.
- **[Resend](https://resend.com)** — free email. Verify your sending domain
  later in deploy phase.
- (Later) **[DigitalOcean](https://www.digitalocean.com)** for deploy +
  managed Postgres.

**You do NOT need an Anthropic API key.** All AI in this project happens
locally inside Claude Code (your existing subscription covers it).

Have your `OWNER_EMAIL` ready — the email that gets owner access on first
sign-in.

## 3. Install Claude Code

```bash
brew install anthropic/claude-code/claude-code   # macOS
# or: npm install -g @anthropic-ai/claude-code

claude /login
```

## 4. Kick off the build

From inside `tiny-trauma-v2/`:

```bash
claude
```

Paste this prompt:

```
Read handoff/CLAUDE.md and handoff/ROADMAP.md in full. Then start
handoff/prompts/phase-0-bootstrap.md. Work one phase at a time.
Stop after each phase and ask me to verify before moving on.
```

The agent will set up the project, install dependencies, write code,
run dev server, and stop at the end of phase 0 (~30 min). Verify it works
(`pnpm db:up && pnpm dev`, open localhost:3000), then say "phase 0 done,
start phase 1".

## 5. Pace

Don't do all six phases in one sitting. Suggested rhythm:

- **Evening 1**: phases 0, 1, 2 — fully-styled public blog reading from MDX
- **Evening 2**: phases 3, 4 — admin shell + MDX viewer
- **Evening 3**: phases 5, 6 — newsletter + DigitalOcean deploy

After phase 6 you're live on `tinytrauma.in`.

## 6. Install the writing skill

After phase 6, install the local content skill (lives in this bundle, not
in the deployed app):

```bash
mkdir -p .claude/skills
cp -R handoff/skills/tiny-trauma-content .claude/skills/
git add .claude/skills && git commit -m "chore: install tiny-trauma-content skill"
git push
```

Then open Claude Code in the repo and write your first essay:

```
> /skill tiny-trauma-content essay
```

It'll grill you for noticings, propose angles, draft, edit, and write an
MDX file. You review, commit, push. DO redeploys. Essay is live.

## 7. Refine the skill (later)

The skill ships as v0. After 1–2 essays, you'll know what doesn't work.
In Claude Code:

```
> I want to refine the tiny-trauma-content skill. Ask me what felt off in
  the last essay I wrote with it.
```

The agent walks you through revisions, commits the diff.

## When the agent gets stuck during the build

- Point at the relevant `handoff/design/*.html` file.
- Point at `handoff/ARCHITECTURE.md` for data flows.
- If it's a product decision, make the call. Don't let it guess.

## When you want to change scope

Edit the prompt file before starting that phase. The prompt is the contract.

## When something feels off in voice

It probably is. Push back. Most common drift: polite "we" phrasing or sneaky
emoji. Check against `handoff/CLAUDE.md` "Voice" section.
