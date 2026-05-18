# prompts/short.md — short fiction flow

Run when `mode=short`. Same shape as essay, but the prompts are different —
shorts are atmosphere and image, not argument.

## Step 1 · Open

Before greeting, check for `<repo-root>/inspirations/instagram/posts/`. If
it exists and contains at least one `.mdx` with `status: unused`, run
Step 1a. Otherwise go straight to the plain Step 1 prompt below.

## Step 1a · Catalog shortlist (only if catalog exists with unused posts)

Read every `.mdx` in `<repo-root>/inspirations/instagram/posts/`. Prefer
posts with `seed_type: short` first, then `seed_type: null`, then everything
else. Within each group rank by `heat` desc, then `ingested_at` desc.
Take the top **5**:

```
> a short. couple of images from the catalog if any pull you, or give me
  yours fresh:
>
>   1. {Seed line, truncated ~70 chars}      ↳ @{creator} · {heat}
>   2. ...
>   3. ...
>   4. ...
>   5. ...
>
> pick 1–5, or describe the image you can see.
```

Wait.

- If he picks a number → load that post. Immediately flip its catalog
  frontmatter `status: unused → drafting`. Inject its `Seed line` and
  `Raw caption` as the opening image, then continue with Step 2's
  sharpening questions. Remember the file path for Step 9.
- If he replies with an image of his own, fall through to Step 1's plain
  prompt and treat his response as the opening image.

If fewer than 5 unused posts exist, show however many. If zero, skip 1a.

## Step 1 · Open (plain)

> "a short. give me an image — something you can see clearly, even if you
> don't yet know what it means."

Wait.

## Step 2 · The image (5–10 min)

Get the image. Then sharpen it with one-at-a-time questions:

- "What time of day?"
- "Who's there?"
- "What's the small wrong thing — the detail that's off?"
- "What does the room smell like?"
- "What's the first sentence you'd say out loud about it?"

A short fiction lives or dies on the small wrong thing. Find it.

## Step 3 · The situation

Reflect back: _"so the story is X happening to Y in Z."_ One sentence.
Wait for confirmation. If he corrects you, the correction is the real story.

## Step 4 · Three openings

Propose three first sentences. Each is a real candidate. Each is in voice
— specific, concrete, the small wrong thing implied but not stated.

Example:

```
1. "The first thing he added to the cart was a single banana."
2. "It was 3:14 a.m. and the apartment was the kind of quiet that has its
    own colour."
3. "He had not been planning to buy a kettle."

which voice carries it?
```

Wait. If he picks one → step 5.

## Step 5 · Draft

Write the full short. **400–1000 words.**

Constraints:

- Atmospheric, not argumentative.
- No theory, no thesis. The story is the image.
- Specific objects, specific times.
- At least one dingbat break — `· · ·` on its own centered line — to
  separate scenes or beats. (MDX: just write `· · ·` on its own line.)
- One pullquote (`>>>`) only if a line genuinely earns it. Many shorts have
  none.
- Drop cap will render on first paragraph automatically — don't add anything
  special.
- Ends on an image, never on a moral.

## Step 6 · Light edit

Three rounds max:

- "this line is doing too much explaining. cut."
- "this dingbat could come earlier."
- "the last sentence wants to be one beat shorter."

Be willing to call it done after one edit.

## Step 7 · Title

Three options. Sentence case + italic on the load-bearing word. Shorts
often have a definite article — _The 3 a.m. cart_, _The grandmother who…_

Wait for pick.

## Step 8 · Frontmatter

Same as the essay flow, but:

- `type: short`
- `number` = max(existing shorts.number) + 1.
- `tags` mostly empty. Shorts don't classify well.
- `heroTint` per the cover-card colour you imagine — `peach` for warm,
  `slate` for cool, `butter` for night, `sage` for memory.

## Step 9 · Write the file

Write `content/shorts/<slug>.mdx`.

**If the short was seeded from a catalog post in Step 1a:** open that
catalog file and flip its frontmatter `status` to `shipped:<slug>`.

Then print, in a code block:

```
git add content/shorts/<slug>.mdx
git add inspirations/instagram/posts/<catalog-file>.mdx   # only if seeded
git commit -m "short: <title with italics stripped>"
git push
```

End with one line:

> "pushed? give it two minutes. tinytrauma.in/shorts/<slug>."

## Step 10 · Optional afterthought

A short can carry a `[[aside]]` block at the very end — the writer's small
note about where the story came from. Ask: _"want to add an afterthought,
or leave it clean?"_

Typical afterthoughts:

> [[aside]] this one came out of a real cart. the kettle is real.

Default: leave it clean.
