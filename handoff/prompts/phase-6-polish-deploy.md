# Phase 6 · Polish + deploy

The last phase. Polish empty/error/loading states across admin. Deploy to
DigitalOcean. First essay goes live.

## Part A · Polish (≈45 min)

Open every admin route. Make sure:

- **Empty state**: in voice, one-line, often italic, sometimes handwritten.
  Examples already established:
  - No drafts: *"no drafts yet. probably for the best."*
  - No subscribers: *"no subscribers yet. you have to publish something first."*
  - No campaigns: *"no campaigns. when you publish an essay, this is where you'd
    send it to the people who said yes."*
- **Loading**: italic "*thinking…*" or "*loading the small things…*" — never
  raw spinners.
- **Error**: *"something broke. it's me, not you."* with a small `mailto:` link.
- **Success toasts**: short, in voice — "*saved.*", "*scheduled. see you sunday.*",
  "*sent. now go for a walk.*"

Pass through every form, every button, every confirmation modal. Rewrite
anything that sounds AI-generated. Examples to fix:
- "Are you sure you want to delete this campaign?" → *"delete this campaign?
  it's not coming back."*
- "Sign out" button label → just "sign out", lowercase, no icon.
- "404 not found" → already done in voice — keep that.

### Optional: Plausible

If `PLAUSIBLE_DOMAIN` env is set:
- Add the Plausible script in `app/layout.tsx`.
- Add a small "last 7 days" widget on `/admin` showing visits + top posts.

## Part B · Deploy (≈45 min)

Follow `handoff/DEPLOY.md` end-to-end. Summary:

1. **DigitalOcean Managed Postgres** — create cluster, smallest plan.
   Create `tinytrauma` database. Note the connection string.
2. **DigitalOcean App Platform** — create app from the GitHub repo, branch
   `main`, autodeploy on. Build command `pnpm install --frozen-lockfile &&
   pnpm build`, run command `node .next/standalone/server.js`, port 3000.
3. Set all env vars in App Platform (the full list from `.env.local.example`).
   Mark secrets as encrypted.
4. Add `tinytrauma.in` domain in App Platform → DNS A record → Let's Encrypt
   issues automatically.
5. Add App as a Trusted Source on the DB cluster. Switch `DATABASE_URL` to
   the VPC private connection string.
6. Run the migrations against production once (your laptop, public connection
   string, your IP temporarily whitelisted):
   ```
   DATABASE_URL=... pnpm db:migrate
   ```
   (Remove your IP from trusted sources after.)
7. **Resend** — verify `tinytrauma.in` as a sending domain (DKIM, SPF, DMARC
   records in your DNS). Set `RESEND_FROM=hi@tinytrauma.in`.
8. **GitHub Actions** — add `CRON_SECRET` repo secret. Create
   `.github/workflows/cron-send-campaigns.yml`:
   ```yaml
   name: cron-send-campaigns
   on:
     schedule:
       - cron: "*/15 * * * *"  # every 15 min — adjust as you like
     workflow_dispatch:
   jobs:
     ping:
       runs-on: ubuntu-latest
       steps:
         - run: |
             curl -fsS -X POST https://tinytrauma.in/api/cron/send-campaigns \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               -H "Content-Type: application/json"
   ```
9. **Resend webhook** — point at `https://tinytrauma.in/api/webhooks/resend`,
   subscribe to delivered / opened / bounced / complained, add the signing
   secret to App Platform env as `RESEND_WEBHOOK_SECRET`.

## Smoke test the production deploy

1. Visit `https://tinytrauma.in/` — hero, fonts, theme toggle work.
2. `/sign-in` → submit your email → magic link arrives → click → land on
   `/admin` signed in as owner.
3. View `/admin/posts` — sees all MDX files seeded in phase 2.
4. Subscribe a test email → confirm → check `/admin/subscribers`.
5. Create a campaign from a published essay → send test to yourself.

## Part C · First real essay

After deploy, install the `tiny-trauma-content` skill:

```bash
mkdir -p ~/.claude/skills
cp -R handoff/skills/tiny-trauma-content ~/.claude/skills/
```

Or, for repo-local install (recommended so the skill lives in version control):

```bash
mkdir -p .claude/skills
cp -R handoff/skills/tiny-trauma-content .claude/skills/
git add .claude/skills && git commit -m "chore: install tiny-trauma-content skill"
```

Open a Claude Code session in the repo, invoke the skill, run a brainstorm,
let it draft an essay, accept the MDX output, commit and push.

DO will rebuild (~2 min). Refresh `tinytrauma.in/musings` — new essay is live.

## Part D · Refine the skill (later, with Claude)

The skill ships as **v0** — a working starting point. The right time to
polish it is *after* you've written one or two essays through it and noticed
what's friction.

Run a grill-me session with Claude Code:

```
> I want to refine the tiny-trauma-content skill. Read .claude/skills/tiny-trauma-content/SKILL.md
  and ask me about what didn't work in the last two essays I wrote with it.
```

The agent will interview you, propose edits to the skill prompt and the
voice rules, and commit the diff.

## Acceptance

- [ ] Every admin page has considered empty/error/loading states.
- [ ] Production deploy live at `tinytrauma.in`.
- [ ] Test subscribe → confirm → welcome email arrived.
- [ ] Test campaign sent to self end-to-end.
- [ ] `tiny-trauma-content` skill installed locally.

## Commit

```
chore(polish): empty/error/loading states across admin
docs(deploy): finalize digital ocean deployment
chore(skills): install tiny-trauma-content writing skill
```

Done. Tell the user the app is live and ready for the first sunday letter.
