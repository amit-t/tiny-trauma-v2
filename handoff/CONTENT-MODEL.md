# CONTENT-MODEL.md — Tiny Trauma v2

How content is shaped in the DB and rendered on the page.

## Post types

Two: `musing` (essay) and `short` (short fiction). They share schema but render
differently:

| Aspect             | Musing                          | Short                          |
|--------------------|---------------------------------|--------------------------------|
| Detail layout      | Marginalia column + reading col | Centered, atmospheric           |
| Drop cap           | No                              | Yes, on first paragraph        |
| Reading time       | Shown ("4 min read")            | Hidden (don't pace fiction)    |
| Wordcount shown    | No                              | Yes (~ X words)                |
| Numbering          | "no. 023"                       | "№ 007" (with the symbol)      |
| List card          | Wide riverbed item              | Cover-style (book-jacket feel) |
| Tags               | Required (filterable)           | Optional                       |
| Pull quote         | Surface-tinted, coral mark      | Surface-tinted, full-width     |
| Hero illustration  | Optional, 16:9                  | Required, 16:9                 |
| Drop cap color     | n/a                             | accent (coral)                 |

## Markdown extensions (TipTap custom marks)

The body is Markdown. These extensions render as the design specifies:

- `*italic*` → `<em>` (accent color when in titles/deks; ink color in body)
- `==handwritten phrase==` → `<span class="hand-inline">…</span>` (Caveat coral inline)
  - Use sparingly — once per post body if at all.
- `> blockquote` with no extra prefix → standard quote
- `>>> blockquote` (three chevrons) → `.pullquote` — the surface-tinted block-level moment
- `[[aside]] short text` → `<span class="aside-line">…</span>` (Caveat coral block; rotated)
- `--- dingbat` → centered `· · ·` separator (between scenes in fiction)
- `**bold**` → forbidden inside body. Editor warns, doesn't render bold.

## Frontmatter / sidebar fields (admin)

When editing a post, the right sidebar controls:

```
type          [musing | short]
title         (text, can contain *italics*)
slug          (auto from title, editable)
dek           (standfirst, italic on render — keep ≤ 30 words)
tags          (multi-select chip; existing values + free entry)
number        (auto-incremented per type on publish; manually overridable)
status        [draft | scheduled | published | archived]
scheduledFor  (datetime; default = next sunday 9am IST when scheduling)
publishedAt   (read-only; set on transition to published)
featured      (boolean; only one per type can be true)
heroImage     (image URL or upload)
wordCount     (auto-computed)
readingTimeSeconds (auto-computed; words / 200 * 60, rounded up)
```

## Slug generation

`slugify(title.toLowerCase().replace(/[^a-z0-9 ]/g, ""))` plus trailing `-N`
if collision. e.g. "Why I cry at ads but not at things that matter" →
`why-i-cry-at-ads-but-not-at-things-that-matter`.

## Numbering

On `posts.status` transition from any state → `published`, if `number` is null,
assign `max(number) + 1` for that type. Numbering is permanent — archiving a post
doesn't free the number, and unpublishing doesn't either (would create confusing
gaps). Manual override allowed for backfilling.

## Tag conventions

Tags from `design/musings.html`:
- `grief`, `phones`, `bangalore`, `small humiliations`, `love`, `family`,
  `competence`. (Use these for seed data.)

Tags are lowercase, can contain spaces, no commas. Stored in `posts.tags` text[].

## Sample seed data

For phase 2 (before DB exists) and phase 4 (initial seed), use the essays
referenced in `design/musings.html` and the shorts in `design/shorts.html`.
Body copy doesn't need to be the full essay — first three paragraphs is fine for
visual fidelity. Real content comes later from the owner.

## Newsletter campaign content

A campaign is usually built from a post. The flow:

1. Owner clicks "create campaign" on a published post in admin.
2. Server pre-fills:
   - subject = post.title (with italics stripped, e.g. "Why I cry at ads…")
   - preheader = post.dek (first 90 chars)
   - body = post.body (full)
3. Owner can edit any of these. Adds a personal note at the top if they want.
4. Final email template (in `react-email`):
   - Newsreader serif heading (web fonts fall back to Georgia)
   - Plex Mono not used in emails (poor support); Georgia + system mono only
   - Coral accent on links + the title
   - Footer with unsubscribe link (required by law and good manners)
   - Owner-personal note above the essay (italic, sets the week's mood)

## Cross-post variants

For a published post, generate three platform-specific takes:

- **Twitter thread**: 4–6 tweets, each ≤ 280 chars. First tweet = hook (italic
  question or line from essay). Last tweet = link.
- **LinkedIn post**: 600–800 chars. Soft hook, no "happy to share", no emojis,
  three short paragraphs. Last line = link.
- **Instagram caption**: 1500 chars max. Image is the post's hero illustration
  (if exists). Caption opens with the dek. Includes 3–5 lowercase hashtags at
  the end: `#small writing` etc.

## Newsletter "what lands in your inbox" content

From `design/newsletter.html`:
1. One musing (essay)
2. A small fiction sometimes (~ monthly)
3. One footnote — the "currently" block from the website footer, sent early.

Phase 6 just needs to render whatever's in the campaign body — the editorial
shape above is for owner's reference, not a constraint on what they send.
