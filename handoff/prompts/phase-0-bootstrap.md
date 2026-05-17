# Phase 0 · Bootstrap

Set up an empty, runnable Next.js 15 project with the stack we'll use across all
phases. No features yet — just the foundation.

## Steps

1. Initialize Next.js 15 with TypeScript, app router, ESLint, src dir = no,
   import alias `@/*`, Turbopack for dev. Use `pnpm`:
   ```
   pnpm dlx create-next-app@latest . --typescript --eslint --app --tailwind --no-src-dir --import-alias "@/*" --turbopack
   ```
   (If the directory isn't empty because of handoff/, move handoff/ aside, run
   the command, then restore.)

2. Install Tailwind v4 if the scaffold didn't pull it in:
   ```
   pnpm add -D tailwindcss @tailwindcss/postcss
   ```
   Configure PostCSS in `postcss.config.mjs`. Tailwind v4 is CSS-first — no
   `tailwind.config.ts`; tokens go in `app/globals.css` under `@theme { ... }`
   in phase 1.

3. Install runtime deps:
   ```
   pnpm add drizzle-orm postgres @t3-oss/env-nextjs zod
   pnpm add -D drizzle-kit @types/pg dotenv-cli
   pnpm add better-auth
   pnpm add resend react-email @react-email/components
   pnpm add @anthropic-ai/sdk
   pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
   pnpm add date-fns
   pnpm add class-variance-authority clsx tailwind-merge
   ```

4. Install dev deps:
   ```
   pnpm add -D vitest @vitest/ui happy-dom @types/node
   pnpm add -D prettier prettier-plugin-tailwindcss
   ```

5. Create `.env.local.example` at the repo root:
   ```
   # ─── Database (local docker postgres in dev; DO managed in prod) ────
   DATABASE_URL=postgresql://tt:tt@localhost:5432/tinytrauma

   # ─── Auth (Better Auth) ──────────────────────────────────────────────
   BETTER_AUTH_SECRET=
   BETTER_AUTH_URL=http://localhost:3000

   # ─── Mail (Resend) ───────────────────────────────────────────────────
   RESEND_API_KEY=
   RESEND_FROM=hi@tinytrauma.in
   RESEND_REPLY_TO=hi@tinytrauma.in

   # ─── AI (Anthropic) ──────────────────────────────────────────────────
   ANTHROPIC_API_KEY=

   # ─── Cron (used by GitHub Actions in prod to hit /api/cron/*) ───────
   CRON_SECRET=

   # ─── Owner ───────────────────────────────────────────────────────────
   OWNER_EMAIL=
   ```

6. **Local Postgres via Docker.** Create `docker-compose.yml` at the repo root:
   ```yaml
   services:
     postgres:
       image: postgres:16-alpine
       restart: unless-stopped
       environment:
         POSTGRES_USER: tt
         POSTGRES_PASSWORD: tt
         POSTGRES_DB: tinytrauma
       ports:
         - "5432:5432"
       volumes:
         - tt_pgdata:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U tt -d tinytrauma"]
         interval: 5s
         timeout: 3s
         retries: 5

   volumes:
     tt_pgdata:
   ```
   The owner runs `pnpm db:up` before `pnpm dev` on a fresh checkout.

7. Add `next.config.mjs` with `output: "standalone"` (required for DO App
   Platform deploy in the final phase).

8. Add `"packageManager": "pnpm@9.0.0"` to `package.json` so DO autodetects pnpm.

9. Create `lib/env.ts` using `@t3-oss/env-nextjs` to validate env at build time.
   Throw clear errors if any required var is missing in production.

10. Create `lib/fonts.ts` with **Fraunces**, IBM Plex Mono, Caveat — exact code in
    `handoff/DESIGN-SYSTEM.md`. (The design originally explored Newsreader; the
    final decision is Fraunces. Don't import Newsreader.)

11. Replace `app/layout.tsx`:
    - Set `<html lang="en" data-theme="dark">`
    - Apply the three font variables to `<html>` class
    - Set page metadata: title `"Tiny Trauma — daily friction, mostly"`,
      description = the hero lede from `handoff/design/index.html`
    - Apply `font-family: var(--font-body)` on body via globals.css

12. Replace `app/globals.css` with the dark-mode tokens from
    `handoff/DESIGN-SYSTEM.md` (just the tokens for now; component styles come
    in phase 1). Make sure `:root` and `[data-theme="light"]` blocks both
    exist. Set body background to `var(--bg)` and color to `var(--ink)`.

13. Replace `app/page.tsx` with a one-screen "hello" page:
    - Centered vertically and horizontally
    - The wordmark "tiny *trauma*" using Fraunces 800 lowercase, italic coral on "trauma"
    - Below: italic standfirst "*the application is being built. one phase at a time.*"
    - Below that: a tiny "phase 0 · bootstrap" mono caption
    - Use only inline class names; no new components yet

14. Configure `prettier.config.mjs` with the Tailwind plugin. Run `pnpm format`
    to format everything.

15. Add scripts to `package.json`:
    ```json
    {
      "dev": "next dev --turbo",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "format": "prettier --write .",
      "typecheck": "tsc --noEmit",
      "db:up": "docker compose up -d postgres",
      "db:down": "docker compose down",
      "db:logs": "docker compose logs -f postgres",
      "db:generate": "drizzle-kit generate",
      "db:migrate": "drizzle-kit migrate",
      "db:studio": "drizzle-kit studio",
      "test": "vitest"
    }
    ```

16. `.gitignore` ensures `.env.local`, `node_modules`, `.next`, `dist` are ignored.

17. Write a top-level `README.md` (not the one in handoff/):
    - Short description: "Tiny Trauma — a writing platform that looks like a
      blog. Built with Next.js, Drizzle, Better Auth, Anthropic."
    - "How to run" steps: clone, `pnpm install`, copy `.env.local.example`,
      `pnpm db:up`, `pnpm db:migrate` (after phase 4 lands the schema), `pnpm dev`.
    - Link to `handoff/` folder for full project docs.

## Acceptance

- [ ] `pnpm db:up` starts a postgres container; `docker compose ps` shows healthy.
- [ ] `pnpm dev` boots without errors or warnings.
- [ ] http://localhost:3000 shows the "hello" page in Fraunces on warm dark.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm lint` passes.
- [ ] No `.env.local` committed.
- [ ] `docker-compose.yml` and `next.config.mjs` committed.
- [ ] `git status` clean after commit.

## Commit

```
chore: bootstrap next 15 + tailwind v4 + drizzle + better auth + resend + anthropic
```

Then stop and tell the user phase 0 is done. Wait for confirmation before phase 1.
