# Phase 4 · MDX content pipeline + admin posts viewer

Phase 2 already set up the basics of reading MDX. This phase hardens the
pipeline (Zod validation, typed manifest, dev hot-reload) and builds an
**admin posts viewer** — a read-only window into `/content/` so the owner can
see status of every essay/short without leaving the admin.

There is **no editor** in the deployed app. Writing happens locally in Claude
Code via the `tiny-trauma-content` skill, which outputs MDX files directly.

## Steps

### 4.1 Velite (or custom loader) config

If phase 2 used a quick-and-dirty MDX loader, formalise it here. Recommended:
**Velite** — opinionated content layer for Next.js, Zod-validated, generates
typed imports.

```ts
// velite.config.ts
import { defineConfig, defineCollection, s } from "velite";

const postBase = {
  title: s.string(),
  dek: s.string(),
  publishedAt: s.isodate(),
  number: s.number().int().positive(),
  tags: s.array(s.string()).default([]),
  featured: s.boolean().default(false),
  heroTint: s.enum(["lavender","sage","butter","peach","slate","none"]).default("none"),
  heroImage: s.string().optional(),
  status: s.enum(["draft","published"]).default("draft"),
  body: s.mdx(),
  slug: s.path(),
  wordCount: s.number().optional(),
  readingTimeMinutes: s.number().optional(),
};

const musings = defineCollection({
  name: "Musing",
  pattern: "musings/**/*.mdx",
  schema: s.object({ ...postBase, type: s.literal("musing").default("musing") })
    .transform(addReadingTime),
});

const shorts = defineCollection({
  name: "Short",
  pattern: "shorts/**/*.mdx",
  schema: s.object({ ...postBase, type: s.literal("short").default("short") })
    .transform(addReadingTime),
});

export default defineConfig({
  root: "content",
  output: { data: ".velite", clean: true },
  collections: { musings, shorts },
  mdx: { remarkPlugins: [remarkHandwritten, remarkPullquote, remarkAside] },
});

function addReadingTime(data: any) {
  const words = (data.body as string).split(/\s+/).filter(Boolean).length;
  return {
    ...data,
    wordCount: words,
    readingTimeMinutes: Math.max(1, Math.round(words / 220)),
  };
}
```

### 4.2 Custom remark plugins

Three small plugins in `lib/mdx/`:

- `remark-handwritten.ts` — `==text==` → `<HandInline>{text}</HandInline>`
- `remark-pullquote.ts` — block `>>> text` → `<PullQuote>{text}</PullQuote>`
- `remark-aside.ts` — block `[[aside]] text` → `<HandAside>{text}</HandAside>`

Each plugin is ≤ 40 lines. Test cases in `lib/mdx/__tests__/`.

### 4.3 Public pages read from Velite manifest

Replace whatever phase 2 used with:

```ts
import { musings, shorts } from "#site/content";
```

(`#site/content` is the Velite path alias — set in `tsconfig.json`.)

Filter `status: "published"` on public pages. Include drafts in dev mode with a
"DRAFT" pill.

### 4.4 Hot reload in dev

Velite watches `content/` and rebuilds the manifest on file save. Next.js
picks up the regenerated manifest and hot-reloads. Confirm: edit a `.mdx`
file, see the change live in the browser within a second.

### 4.5 Admin posts viewer

`app/admin/posts/page.tsx`:

- Read-only table of every post from both collections.
- Columns: number, title (italics preserved), type chip, status chip,
  publishedAt, tags, file path.
- Filters: status (all / draft / published), type (musing / short).
- Sort by publishedAt desc by default.
- Search by title or tag.
- Each row links to `/admin/posts/[type]/[slug]`.

`app/admin/posts/[type]/[slug]/page.tsx`:

- Left: rendered MDX body (in the real reading layout).
- Right sidebar: frontmatter shown as a definition list, copy-pasteable.
- Top action: "open in editor" — a link with `href={vscodeOpenUrl}`:
  ```ts
  const vscodeOpenUrl = `vscode://file${path.resolve("content", type, `${slug}.mdx`)}`;
  ```
  Clicking opens VS Code at the file (or Cursor — same protocol). Add a
  fallback "copy path" button for non-VS-Code users.
- Below the action: a "create campaign from this post" button → goes to
  `/admin/campaigns/new?slug=<slug>&type=<type>`.

### 4.6 No editor, no autosave, no revisions

These are explicitly out of scope. Writing happens in the local skill.

If the owner wants to edit a published essay:
1. Open the MDX file in VS Code (via the link in admin or directly).
2. Edit. Save.
3. `git commit` + `git push`. DO rebuilds. Change is live in 2 min.

## Acceptance

- [ ] `pnpm dev` watches `/content/` and reloads on file change.
- [ ] Add a new `.mdx` file with valid frontmatter → it appears on `/musings`
      automatically.
- [ ] Add a file with bad frontmatter → build fails with a clear error.
- [ ] `/admin/posts` shows the full list including drafts.
- [ ] Click "open in editor" → VS Code opens the right file (if VS Code is
      installed).
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.

## Commit

```
feat(content): velite mdx pipeline + zod validation + remark plugins
feat(admin): read-only posts viewer with "open in editor" link
```

Stop. Ask the owner to add one new MDX file by hand and verify the round trip
before phase 5.
