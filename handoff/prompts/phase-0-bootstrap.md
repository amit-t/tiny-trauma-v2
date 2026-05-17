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
   # ─── Database ────────────────────────────────────────────────────────
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

   # ─── Auth (Better Auth) ──────────────────────────────────────────────
   BETTER_AUTH_SECRET=
   BETTER_AUTH_URL=http://localhost:3000

   # ─── Mail (Resend) ───────────────────────────────────────────────────
   RESEND_API_KEY=
   RESEND_FROM=hi@tinytrauma.in
   RESEND_REPLY_TO=hi@tinytrauma.in

   # ─── AI (Anthropic) ──────────────────────────────────────────────────
   ANTHROPIC_API_KEY=

   # ─── Owner ───────────────────────────────────────────────────────────
   OWNER_EMAIL=
   ```

6. Create `lib/env.ts` using `@t3-oss/env-nextjs` to validate env at build time.
   Throw clear errors if any required var is missing in production.

7. Create `lib/fonts.ts` with Newsreader, IBM Plex Mono, Caveat — exact code in
   `handoff/DESIGN-SYSTEM.md`. Note: the wordmark and design use **Fraunces**,
   not Newsreader. Use Fraunces.

8. Replace `app/layout.tsx`:
   - Set `<html lang="en" data-theme="dark">`
   - Apply the three font variables to `<html>` class
   - Set page metadata: title `"Tiny Trauma — daily friction, mostly"`,
     description = the hero lede from `handoff/design/index.html`
   - Apply `font-family: var(--font-body)` on body via globals.css

9. Replace `app/globals.css` with the dark-mode tokens from
   `handoff/DESIGN-SYSTEM.md` (just the tokens for now; component styles come in
   phase 1). Make sure `:root` and `[data-theme="light"]` blocks both exist.
   Set body background to `var(--bg)` and color to `var(--ink)`.

10. Replace `app/page.tsx` with a one-screen "hello" page:
    - Centered vertically and horizontally
    - The wordmark "tiny *trauma*" using Fraunces 800 lowercase, italic coral on "trauma"
    - Below: italic standfirst "*the application is being built. one phase at a time.*"
    - Below that: a tiny "phase 0 · bootstrap" mono caption
    - Use only inline class names; no new components yet

11. Configure `prettier.config.mjs` with the Tailwind plugin. Run `pnpm format`
    to format everything.

12. Add scripts to `package.json`:
    ```json
    {
      "dev": "next dev --turbo",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "format": "prettier --write .",
      "typecheck": "tsc --noEmit",
      "db:generate": "drizzle-kit generate",
      "db:migrate": "drizzle-kit migrate",
      "db:studio": "drizzle-kit studio",
      "test": "vitest"
    }
    ```

13. `.gitignore` ensures `.env.local`, `node_modules`, `.next`, `dist` are ignored.

14. Write a top-level `README.md` (not the one in handoff/):
    - Short description: "Tiny Trauma — a writing platform that looks like a
      blog. Built with Next.js, Drizzle, Better Auth, Anthropic."
    - "How to run" steps: clone, `pnpm install`, copy `.env.local.example`,
      `pnpm dev`.
    - Link to `handoff/` folder for full project docs.

## Acceptance

- [ ] `pnpm dev` boots without errors or warnings.
- [ ] http://localhost:3000 shows the "hello" page in Fraunces on warm dark.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm lint` passes.
- [ ] No `.env.local` committed.
- [ ] `git status` clean after commit.

## Commit

```
chore: bootstrap next 15 + tailwind v4 + drizzle + better auth + resend + anthropic
```

Then stop and tell the user phase 0 is done. Wait for confirmation before phase 1.
