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

- [Neon](https://neon.tech) — free Postgres. Create a project, copy the connection string.
- [Resend](https://resend.com) — free email. Verify your sending domain
  (`tinytrauma.in` if you have it; use `onboarding@resend.dev` for testing
  otherwise).
- [Anthropic Console](https://console.anthropic.com) — API key. Top up with $10
  to start; the build itself will cost cents.
- (Later) [Vercel](https://vercel.com) for deploy.

Have your `OWNER_EMAIL` ready — the email that gets owner access on first
sign-in.

## 3. Install Claude Code

```bash
# macOS
brew install anthropic/claude-code/claude-code
# or via npm
npm install -g @anthropic-ai/claude-code
```

Auth:

```bash
claude /login
```

## 4. Kick off the agent

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
run dev server, and stop at the end of phase 0 (≈30 min). Verify it works
(`pnpm dev`, open localhost:3000), then say "phase 0 done, start phase 1".

## 5. Pace

Don't try to do all seven phases in one sitting. Suggested rhythm:

- **Evening 1**: phases 0, 1, 2 — by end you have a fully-styled static blog
- **Evening 2**: phases 3, 4 — admin + editor + publish flow
- **Evening 3**: phases 5, 6, 7 — AI, newsletter, cross-post, deploy

After phase 6, you can write your first real essay in the app, schedule it for
the next Sunday, and have it actually go out by email when the day comes.

## When the agent gets stuck

- Open the relevant `handoff/design/*.html` file and show the agent.
- Open `handoff/ARCHITECTURE.md` and point at the section it needs.
- If it's a product decision (e.g. "should the chip color follow the tag or
  the type?"), make the call yourself — don't let it guess.

## When you want to change scope

Edit the prompt file before starting that phase. The prompt is the contract.

## When something feels off in voice

It probably is. Run it past the rules in `handoff/CLAUDE.md` "Voice". The most
common drift: the agent adds polite "we" phrasing or sneaks in emoji. Push back.
