# CONTENT-MODEL.md — Tiny Trauma v2

**Posts live as MDX files in the repo, not in the database.**

```
content/
├── musings/
│   ├── why-i-cry-at-ads.mdx
│   ├── on-leaving-messages-on-read.mdx
│   └── ...
└── shorts/
    ├── the-3am-cart.mdx
    ├── the-grandmother-and-the-kettle.mdx
    └── ...
```

When you push to `main`, DO App Platform rebuilds and the new files appear
on the site.

## Frontmatter (validated at build time)

```mdx
---
title: "Why I cry at ads but not at things *that matter*"
dek: "A theory about distance, another about shame, and an apology that arrived eight weeks too late."
type: musing                     # or "short"
publishedAt: 2026-05-12
number: 23                       # monotonic per-type
tags: [grief, phones]
featured: false
heroTint: sage                   # lavender | sage | butter | peach | slate | none
heroImage: ""                    # optional path under /public
status: published                # draft | published — drafts don't render
wordCount: 0                     # auto-filled by the build; leave 0
readingTimeMinutes: 0            # auto-filled by the build; leave 0
---

Body in markdown / MDX.
```

### Field reference

| Field             | Type        | Notes                                            |
|-------------------|-------------|--------------------------------------------------|
| `title`           | string      | Can contain `*italics*` for emphasis on render   |
| `dek`             | string      | Standfirst (italic on render). ≤ 30 words.       |
| `type`            | enum        | `musing` or `short`                              |
| `publishedAt`     | YYYY-MM-DD  | The publication date                             |
| `number`          | integer     | Manually incremented per type. Mistakes can be fixed by editing the file. |
| `tags`            | string[]    | Lowercase, can contain spaces                    |
| `featured`        | boolean     | Only one per type can be true                    |
| `heroTint`        | enum        | Pastel art-slot tint for cards. `none` = no art-slot. |
| `heroImage`       | string      | Optional. Path under `/public`, e.g. `/img/3am-cart.jpg` |
| `status`          | enum        | `draft` files don't appear publicly. Useful for WIP. |
| `wordCount`       | integer     | Auto-computed at build; leave 0                  |
| `readingTimeMinutes` | integer  | Auto-computed at build; leave 0                  |

Validation uses **Zod** in the MDX loader. Bad frontmatter = build fails with
a clear error message.

## Custom MDX syntax

Three extensions on top of standard markdown:

### Handwritten inline phrase

```mdx
A personal blog about ==the small daily friction== between who you are…
```

Renders as `<span class="hand-inline">the small daily friction</span>` — Caveat
coral inline.

**Use sparingly.** Once per essay if at all.

### Pull quote

```mdx
>>> The advertisement asked nothing of me except to be moved.
>>> The friend, somehow, asked *more.*
```

Renders as a surface-tinted `<PullQuote>` block with the coral corner mark.

### Handwritten aside (block)

```mdx
[[aside]] I would like a third, kinder theory, please.
```

Renders as a `<HandAside>` — Caveat coral, slightly rotated, on its own line.

**Use sparingly.** One per essay max.

### Forbidden

- `**bold**` inside body — emphasis is italic. The build warns (doesn't fail).
- Inline HTML except the three custom marks above. Markdown only.
- Emoji.

## How the two types differ on render

| Aspect             | Musing                          | Short                          |
|--------------------|---------------------------------|--------------------------------|
| Detail layout      | Marginalia column + reading col | Centered, atmospheric           |
| Drop cap           | No                              | Yes, on first paragraph        |
| Reading time shown | Yes ("4 min read")              | No (don't pace fiction)        |
| Word count shown   | No                              | Yes ("~ 800 words")            |
| Numbering          | "no. 023"                       | "№ 007"                        |
| List card          | Wide riverbed item              | Cover-style (book-jacket)      |
| Tags               | Required, filterable            | Optional                       |

## Slug = filename

The slug is the filename without `.mdx`:

```
content/musings/why-i-cry-at-ads.mdx  → /musings/why-i-cry-at-ads
content/shorts/the-3am-cart.mdx       → /shorts/the-3am-cart
```

Lowercase, hyphens for spaces, no other punctuation. The skill enforces this.

## Drafts

- `status: draft` files don't render publicly and don't show in `/musings` or
  `/shorts` lists, the sitemap, or the RSS feed.
- They DO appear in dev mode (`NODE_ENV !== "production"`) on the public list
  with a "DRAFT" pill, so you can preview before committing.
- A draft still gets a page generated at its URL in the static build, but that
  page renders the 404 view rather than the essay.

## The newsletter

The list lives on Substack, and letters are composed there. Nothing in this
repo builds, stores or sends email.

An MDX file is therefore only ever a web page. There is no campaign record, no
body snapshot, and no link between a post and a sent letter — the earlier
`/admin/campaigns` flow and its Postgres tables were removed when the site
became a static export.

## Cross-post copy (out of the app)

Cross-post generation (Twitter / LinkedIn / Instagram caption variants) lives
in the `tiny-trauma-content` skill, not the deployed app. The skill reads the
MDX file, calls Claude locally, generates variants, prints them. You paste.
No DB storage needed.
