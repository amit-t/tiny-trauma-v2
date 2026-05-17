# Phase 2 · Public site (static)

Build every public-facing page using **hardcoded sample data**. No database yet.
The point is to match the design pixel-for-pixel and prove the system works
across every layout.

## Pages to build

In order:

1. `app/page.tsx` → home (`handoff/design/index.html`)
2. `app/musings/page.tsx` → musings list (`musings.html`)
3. `app/musings/[slug]/page.tsx` → musing detail (`musing.html`)
4. `app/shorts/page.tsx` → shorts list (`shorts.html`)
5. `app/shorts/[slug]/page.tsx` → short detail (`short.html`)
6. `app/about/page.tsx` → about (`about.html`)
7. `app/newsletter/page.tsx` → newsletter (`newsletter.html`)

## Sample data

Create `lib/sample-data.ts` that exports:

- `musings: Musing[]` — the 12 essays referenced in `design/musings.html`
- `shorts: Short[]` — the 7 fictions in `design/shorts.html`
- `pastLetters: PastLetter[]` — the 5 from `design/newsletter.html`
- `currentlyBlock` — { reading, writing, noticing } from the footer

Types in `lib/types.ts`:

```ts
export type PostType = "musing" | "short";

export type BasePost = {
  slug: string;
  type: PostType;
  title: string;           // can contain <em>
  dek: string;
  body: string;            // markdown — for detail pages, hand-write 4–6 paragraphs each
  tags: string[];
  number: number;
  publishedAt: Date;
  featured?: boolean;
  heroTint?: "lavender"|"sage"|"butter"|"peach"|"slate";
  readingTimeMinutes: number;
  wordCount?: number;      // shorts only
};
```

For body copy, lift the prose from the matching essays in `design/musing.html`
and `design/short.html`. Don't fabricate more than the design shows — fewer
paragraphs is fine.

## Notes per page

### Home
- Hero kicker reads "last essay — may 12, 2026 *· four days ago*" (italic in `text-accent`).
- Section heading "Recent *musings.*" uses the large scale (40–56px clamp).
- Recent musings grid shows 4 cards, each with `heroTint` matching the design.
- Featured short with split-column layout below the grid.
- Newsletter band before the colophon.

### Musings list
- Filter pills wrap; active state matches `design/musings.html`.
- Year separators ("2026 *so far*", "2025 *(a selection)*").
- Editor's pick card at top with split layout.
- River items: number + date column on left (small on mobile — see mobile rules
  in `design/musings.html`).
- Pager at the bottom (static — no actual pagination needed in phase 2).

### Musing detail
- Marginalia left, reading column right, empty right gutter.
- Title in Fraunces 60-ish.
- Drop cap **does not appear** on essays.
- Pullquote uses the corner-mark style.
- Inline `aside-line` (handwritten coral, rotated) appears once mid-essay.
- Share row + reply prompt + prev/next at the bottom.

### Shorts list
- Cover-style grid (3 cols desktop, 2 cols 900px, 1 col 600px).
- Featured short at the top with the large book-cover lockup.
- Each cover has its own `heroTint`.

### Short detail
- Centered atmospheric layout.
- Drop cap **does** appear on first paragraph.
- Dingbat separators (`· · ·`) between scenes.
- Handwritten "afterthought" near the end.

### About
- Two-column with author photo placeholder (4:5) + facts + mini-subscribe form.
- Design banner in the middle.
- Contact band before the colophon.

### Newsletter
- Big subscribe card with tier picker (radio buttons styled as pills, weekly
  default).
- "What lands in your inbox" 3-card grid.
- "Past letters" list with open counts (from sample data).
- FAQ section.
- Tiny secondary CTA at the bottom.

## Markdown rendering

For phase 2, use `react-markdown` with a custom component map that:
- Renders `<em>` with the accent color when inside a heading; ink color in body.
- Renders `>>> blockquote` as `.pullquote` (with the `"` mark).
- Renders `==text==` as `<HandInline>text</HandInline>` (use a small mark
  extension).
- Renders `[[aside]] text` as `<HandAside>text</HandAside>`.

In phase 4 we'll replace this with TipTap output, but the same component map
applies to rendering.

## Layout wrappers

- `<Wrap>` → max-w-[1240px], `px-14 md:px-6 sm:px-6`
- `<WrapNarrow>` → max-w-[760px]
- Both center horizontally.

## SEO

`app/layout.tsx` default metadata:

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://tinytrauma.in"),
  title: {
    default: "Tiny Trauma — daily friction, mostly",
    template: "%s — Tiny Trauma",
  },
  description: "A personal blog about the small daily friction…",
  openGraph: { /* same */ },
  twitter: { card: "summary_large_image" },
};
```

Each detail page exports its own `generateMetadata` using sample-data lookup.

## Extras

- `app/feed.xml/route.ts` → builds an RSS feed from sample-data musings + shorts.
- `app/sitemap.ts` → Next 15 sitemap function reading sample-data.
- `app/robots.ts` → `User-agent: * / Allow: / / Disallow: /admin/`.
- `app/not-found.tsx` → 404 in voice: *"this page does not exist, and probably
  never did. ↳ try the [musings](/musings)?"* (handwritten arrow on "try the").
- `app/error.tsx` → in voice: *"something broke. it's me, not you."*

## Acceptance

- [ ] Every page from the list above renders.
- [ ] Navigating between pages works (no 404s).
- [ ] Theme toggle persists.
- [ ] `/feed.xml` returns valid RSS XML.
- [ ] `/sitemap.xml` returns valid sitemap.
- [ ] 404 page renders for unknown URLs.
- [ ] Lighthouse on `/` reports perf ≥ 95 (run via `pnpm build && pnpm start`).
- [ ] Visual diff vs `design/*.html` passes — open each side-by-side.

## Commit

```
feat(public): build all public pages with sample data, rss, sitemap, 404
```

Stop and ask the user to click through every page.
