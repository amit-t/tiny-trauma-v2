# tiny trauma

A writing platform that looks like a blog. Built with Next.js, Drizzle, Better Auth, Resend.

## How to run

```bash
pnpm install
cp .env.local.example .env.local   # fill in secrets
pnpm db:up                          # start local postgres in docker
pnpm db:migrate                     # apply schema (after phase 4 lands it)
pnpm dev                            # http://localhost:3000
```

Full project docs live in [`handoff/`](./handoff/).
