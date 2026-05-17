# DEPLOY.md — DigitalOcean

Production deployment guide. Run through this once after phase 7 (or whenever
you're ready to ship).

## What we're standing up

- **App** — Next.js 15 in standalone mode, running on **DigitalOcean App
  Platform** (recommended) or a Droplet via Docker (alternative).
- **Database** — **DigitalOcean Managed Postgres** (smallest plan, $15/mo).
- **Email** — Resend (already set up).
- **Crons** — **GitHub Actions** scheduled workflows hit `/api/cron/*` endpoints
  with a bearer token.
- **Domain + HTTPS** — `tinytrauma.in` mapped via DO Domains; cert auto-issued.

## 0 · prerequisites

- DigitalOcean account with billing set up.
- Domain registered (`tinytrauma.in` or whatever).
- GitHub repo (`amit-t/tiny-trauma-v2`) ready to deploy from.
- Resend domain verified (DKIM/SPF/DMARC records added to your DNS).

## 1 · Managed Postgres

1. DO Console → Databases → Create Database Cluster.
2. PostgreSQL 16, smallest plan (Basic, 1GB RAM, 10GB disk, $15/mo).
3. Region: closest to your users (Bangalore → Bangalore region).
4. Name: `tiny-trauma-db`.
5. After provisioning (~5 min): create a database named `tinytrauma`
   inside the cluster (Databases tab in the cluster UI).
6. Copy the connection string from "Connection details" → "Connection string"
   → **Public network** for first time setup. Save for later.

## 2 · App Platform

### 2a · Create the app

1. DO Console → App Platform → Create App.
2. Source: GitHub → select `amit-t/tiny-trauma-v2` → branch `main` → autodeploy on.
3. Resource type: **Web Service**.
4. Build command: `pnpm install --frozen-lockfile && pnpm build`
   (DO autodetects pnpm via `packageManager` field in `package.json` — make sure
   it's set, e.g. `"packageManager": "pnpm@9.0.0"`).
5. Run command: `node .next/standalone/server.js` (since `output: "standalone"`
   is enabled).
6. HTTP port: `3000`.
7. Instance size: Basic, 512MB ($5/mo) is plenty for one-user-blog scale.
8. Environment variables — set all the secrets from `.env.local.example`:
   - `DATABASE_URL` — the connection string from step 1.6, **marked
     "encrypted"**.
   - `BETTER_AUTH_SECRET` — fresh `openssl rand -base64 32`.
   - `BETTER_AUTH_URL` — `https://tinytrauma.in`.
   - `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO` — from Resend.
   - `RESEND_WEBHOOK_SECRET` — from Resend webhook config (step 4 below).
   - `CRON_SECRET` — fresh `openssl rand -base64 32`.
   - `OWNER_EMAIL` — your email.
   - `NODE_ENV=production`.

**No `ANTHROPIC_API_KEY` is needed.** The deployed app makes zero AI calls.
All AI work happens locally in the `tiny-trauma-content` Claude Code skill.

### 2b · Domain

1. App settings → Domains → Add Domain → `tinytrauma.in`.
2. Add to your DNS: `A` record pointing at the IP DO gives you (or `CNAME` to
   the app's `*.ondigitalocean.app` URL).
3. DO will issue a Let's Encrypt cert automatically (~5 min after DNS resolves).

### 2c · Database trust

Managed Postgres only accepts connections from sources in its trusted-sources
list. Add the App as a trusted source:

- Database cluster → Settings → Trusted Sources → Add → select your App.

Now switch `DATABASE_URL` to the **VPC private network** connection string
(faster, no public exposure). Update the env var in App Platform, redeploy.

### 2d · Migrations

App Platform doesn't have a built-in migration step. Two options:

**A** (simpler): run migrations from your laptop, pointing at the production
DB via the public connection string + your laptop's IP whitelisted in trusted
sources.

```bash
DATABASE_URL="postgresql://..." pnpm db:migrate
```

**B** (proper): add a "Pre-Deploy Job" in App Platform that runs
`pnpm db:migrate` before the web service starts. DO has this feature under
Components → Add Component → Job.

Use **B** once the schema stabilises. Use **A** for the first deploy.

## 3 · GitHub Actions crons

After app is live and `tinytrauma.in` resolves:

1. Repo → Settings → Secrets → Actions → New repository secret:
   - `CRON_SECRET` — paste the same value as the App Platform env var.

2. Create `.github/workflows/cron-send.yml`:
   ```yaml
   name: cron-send-campaigns
   on:
     schedule:
       - cron: "*/15 * * * *"  # every 15 min
     workflow_dispatch:
   jobs:
     ping:
       runs-on: ubuntu-latest
       steps:
         - name: Hit send-campaigns endpoint
           run: |
             curl -fsS -X POST https://tinytrauma.in/api/cron/send-campaigns \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               -H "Content-Type: application/json"
   ```

3. Commit, push. GitHub will start running on schedule.

4. Test manually: Actions tab → cron-send-campaigns → "Run workflow" →
   check App Platform logs to verify the request hit.

**There is no publish cron.** Publishing essays is a `git push` (rebuilds
the site with new MDX). Only the newsletter send is on a schedule.

## 4 · Resend webhook

In Resend dashboard → Webhooks → Add endpoint:

- URL: `https://tinytrauma.in/api/webhooks/resend`
- Events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`,
  `email.complained`.
- Copy the signing secret, add to App Platform env as `RESEND_WEBHOOK_SECRET`.
- Update the webhook handler to verify with that secret.

## 5 · Backups

DO Managed Postgres includes daily backups + point-in-time recovery for 7 days
on the Basic plan. That's enough for v1.

Optional: weekly `pg_dump` to a Spaces bucket via a GitHub Actions workflow.

## 6 · Cost estimate (monthly)

| Item                          | Cost      |
|-------------------------------|-----------|
| App Platform Basic            | $5        |
| Managed Postgres Basic        | $15       |
| Domain (annual, amortised)    | ~$1       |
| Resend (free tier ≤3k/mo)     | $0        |
| Anthropic API                 | $0 (local-only via Claude Code) |
| **Total**                     | **~$21/mo** |

Bump Postgres later if you outgrow 1GB. App Platform CPU is rarely the
bottleneck for a blog.

## 7 · First production smoke test

1. Visit `https://tinytrauma.in/` — hero, fonts, theme toggle work.
2. Visit `https://tinytrauma.in/sign-in` — submit your email → check inbox
   → click magic link → land on `/admin`.
3. View `/admin/posts` — see all MDX files seeded in phase 2.
4. Subscribe a test email → confirm → check `/admin/subscribers`.
5. Create a campaign from a published essay → send test to yourself.
6. Open Claude Code locally, install the `tiny-trauma-content` skill (see
   `handoff/skills/tiny-trauma-content/README.md`), write a test essay,
   commit, push. DO rebuilds (≈2 min). New essay appears on `/musings`.

If all six pass, you're live. First Sunday letter is on you.

## Alternative: Droplet + Docker (skip App Platform)

If you'd rather run on a plain Ubuntu Droplet:

1. Create a $6/mo Droplet (1GB RAM is tight for Node + Postgres; bump to $12
   2GB if you also want Postgres on the same box — though I'd keep them separate).
2. Install Docker + Docker Compose.
3. Add a `docker-compose.prod.yml` that runs:
   - The Next.js app (build with `output: standalone`, COPY into a slim image)
   - Nginx as reverse proxy + TLS via certbot
   - (Optional) Postgres in the same compose; safer to use managed Postgres
     anyway.
4. Set env vars in `/etc/tinytrauma/.env` and reference via `env_file:` in
   compose.
5. GitHub Actions deploys: `ssh root@droplet 'cd /srv/tinytrauma && git pull && docker compose up -d --build'`

App Platform is significantly less ops; recommend it unless you specifically
want shell access.
