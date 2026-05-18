# frontmatter-spec.md

Every MDX file in `content/musings/` or `content/shorts/` starts with
frontmatter validated by Velite + Zod at build time. Bad frontmatter = build
fails.

## Template — musing

```mdx
---
title: "Why I cry at ads but not at things *that matter*"
dek: "A theory about distance, another about shame, and an apology that arrived eight weeks too late."
type: musing
publishedAt: 2026-05-12
number: 23
tags: [grief, phones]
featured: false
heroTint: sage
status: published
---

Body in markdown / MDX.
```

## Template — short

```mdx
---
title: "The 3 a.m. *cart*"
dek: "A man cannot stop adding things to a shopping cart he will never check out."
type: short
publishedAt: 2026-05-09
number: 7
tags: []
featured: true
heroTint: peach
status: published
---

Body in markdown / MDX.
```

## Field reference

| Field         | Type       | Required | Notes                                                   |
| ------------- | ---------- | -------- | ------------------------------------------------------- | ----------------------------- | ------ | ----- | ----- | ----- |
| `title`       | string     | yes      | Sentence case; one `*italic*` word                      |
| `dek`         | string     | yes      | ≤ 30 words                                              |
| `type`        | enum       | yes      | `musing` or `short`                                     |
| `publishedAt` | YYYY-MM-DD | yes      | Date string                                             |
| `number`      | integer    | yes      | Increment per type. Skill computes from existing files. |
| `tags`        | string[]   | yes      | Lowercase, can have spaces. Use vocab below.            |
| `featured`    | boolean    | no       | Only one `true` per type at a time                      |
| `heroTint`    | enum       | no       | `lavender                                               | sage                          | butter | peach | slate | none` |
| `heroImage`   | string     | no       | Path under `/public`, e.g. `/img/cart.jpg`              |
| `status`      | enum       | no       | `draft`                                                 | `published` (default `draft`) |

## Tag vocabulary (so far)

Use existing tags when applicable. Add new ones only when nothing fits.

- `grief`
- `phones`
- `bangalore`
- `small humiliations`
- `love`
- `family`
- `competence`

For shorts, tags are optional and rarely used (fiction doesn't classify well).

## Computing `number`

Before writing the file, the skill reads the existing files of the same type
and picks `max(number) + 1`.

## Computing the slug (filename)

Take the title. Strip italics markers. Lowercase. Replace spaces with hyphens.
Strip punctuation except hyphens. That's the filename (without `.mdx`).

Examples:

- "Why I cry at ads but not at things _that matter_" →
  `why-i-cry-at-ads-but-not-at-things-that-matter`
- "The 3 a.m. _cart_" → `the-3-am-cart`
- "Bangalore auto and the philosophy of _maybe_" →
  `bangalore-auto-and-the-philosophy-of-maybe`

If a slug already exists in the target folder, append `-2`, `-3`, etc.

## Body — three custom marks

### Inline handwritten

```mdx
A personal blog about ==the small daily friction== between who you are…
```

One per essay maximum. Use the phrase that the writer would actually
underline by hand in a margin.

### Pullquote (block)

```mdx
> > > The advertisement asked nothing of me except to be moved.
> > > The friend, somehow, asked _more._
```

Pull the line that's doing the most work. Multi-line allowed; each line
starts with `>>>`.

### Block handwritten aside

```mdx
[[aside]] I would like a third, kinder theory, please.
```

One per essay max. Lives on its own line. Reads like a margin note.

## Forbidden

- `**bold**` anywhere in body
- Numbered lists inside essays (unless the form really demands it)
- Inline HTML beyond the three custom marks
- Emoji
- Front-matter `wordCount` or `readingTimeMinutes` — those are computed at
  build time, don't set them in the file
