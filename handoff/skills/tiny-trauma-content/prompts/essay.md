# prompts/essay.md — the full essay flow

Run when `mode=essay`. End-to-end: noticings → angle → outline → draft →
edits → title → frontmatter → MDX file.

## Step 1 · Open

Greet briefly. One line.

Before greeting, check for an inspiration catalog at
`<repo-root>/inspirations/instagram/posts/`. If it exists and contains at
least one `.mdx` with frontmatter `status: unused`, run Step 2a. Otherwise
go straight to Step 2 (the plain noticings prompt below).

## Step 2a · Catalog shortlist (only if catalog exists with unused posts)

Read every `.mdx` in `<repo-root>/inspirations/instagram/posts/`. Filter to
`status: unused`. Rank by:

1. `heat` descending (`high` → `medium` → `low`)
2. `ingested_at` descending (newest first)

Take the top **5**. Print as a shortlist:

```
> okay. an essay. couple of saved noticings from the catalog if any pull
  you, or tell me yours:
>
>   1. {Seed line, truncated to ~70 chars}      ↳ @{creator} · {heat}
>   2. ...
>   3. ...
>   4. ...
>   5. ...
>
> pick 1–5, or just tell me what you've been noticing.
```

Wait.

- If he picks a number → load that post's full body. **Immediately flip
  that catalog post's frontmatter `status` from `unused` to `drafting`**
  (so an abandoned session doesn't leave the catalog claiming it's still
  pristine). Inject its `Friction`, `Seed line`, and `Raw caption` into
  the conversation as his opening noticing, then continue with the usual
  one-at-a-time sharpening questions from Step 2. Remember the post's
  file path — you'll need it in Step 9.
- If he replies with anything else (a sentence, "none", "let me think"),
  fall through to Step 2 with whatever he said as the first noticing. Do
  not load a catalog post.

If fewer than 5 unused posts exist, show however many there are. If zero,
skip 2a entirely and go to Step 2.

## Step 2 · Noticings (5–10 min)

Capture 3–5 small frictions in Amit's own words. After each one he gives
you, ask one short follow-up that sharpens the moment. Examples of good
follow-ups:

- "What did the room sound like?"
- "Who else was there?"
- "What time was it?"
- "What did you almost say?"

When he stalls or says "that's about it", reflect back what you've heard in
your own words. He'll either confirm or correct one of them — the correction
is usually the real essay.

If a catalog post was loaded in Step 2a, the first "noticing" is already
there — keep going with the sharpening loop until you have 3–5 frictions,
then proceed.

## Step 3 · Angle (3–5 options)

Propose 3–5 possible essays from the noticings. Each is **one line**:
a working title (italicised correctly) + a one-line thesis.

Example output:

```
1. "Why I cry at ads but not at things *that matter*"
   the friend across the table asked more than the noodle dad ever did.

2. "On performing *competence* in meetings"
   the person who sits very still and uses words like "directionally."
   I don't know him.

3. "I owe a friend a haircut, and *an apology*"
   2019. The haircut wasn't bad. I was. I have not apologised.

4. "The 8:47 auto, and the philosophy of *maybe*"
   the auto didn't say no, didn't say yes, and I had to live there.

Which one pulls you? Or none, and you tell me what you actually meant.
```

Wait. If he picks one → step 4. If he says "none, here's what I actually
meant" → step 2 again with the new framing.

## Step 4 · Outline

4–6 beats. Each beat is a single sentence describing what happens in that
section. No headers, no labels. Show the outline. Ask: *"does this land?
push back."*

If he redirects, redo the outline once. Don't loop on this.

## Step 5 · Draft

Write the full essay. In voice. **Take your time.** Re-read `voice-rules.md`
sample paragraphs first if you need to.

Constraints:
- 600–1200 words.
- Sentence variety. Short ones for rhythm.
- Specific objects, specific times.
- At most one `==handwritten==` inline.
- At most one `[[aside]]` block.
- One `>>>` pullquote — the line doing the most work.
- A small uncomfortable admission, usually near the end.

When the draft is done, print it cleanly (no commentary above or below).
Then ask **one** sharpening question — the one you'd ask if you were his
editor and you only had one question left.

## Step 6 · Edit pass

Walk through the essay paragraph by paragraph. For each paragraph, do at
most one of:

- "tighten this — drop these clauses: …"
- "italicise *this* word"
- "this line wants to be the pullquote instead of the one we picked"
- "this paragraph is doing two jobs. cut one."
- "this paragraph is fine."

Show your suggested change. Wait for accept / reject / "try again". Move on.

No more than 6 edit suggestions total. If the draft is good, say so.

## Step 7 · Title

Show three title options. Each is sentence case with one italic word in the
right place. Each is a real candidate, not a sacrificial throwaway.

Wait for Amit to pick one. If he wants a tweak, do one round.

## Step 8 · Frontmatter

Compute:
- `slug` from the title (see `frontmatter-spec.md`).
- `number` = max(existing musings.number) + 1.
- `publishedAt` = today's date in `YYYY-MM-DD`.
- `tags` — ask Amit which from the vocab apply. Default to 1–2 tags.
- `heroTint` — ask which pastel the post lives in. Default `sage` for grief,
  `slate` for phones, `peach` for bangalore, `butter` for competence,
  `lavender` for general musings.
- `status: published` (he's pushing this; if he wants to think on it more,
  set `draft`).
- `featured: false` unless he says otherwise.

## Step 9 · Write the file

Write `content/musings/<slug>.mdx` with the full frontmatter + body.

**If the essay was seeded from a catalog post in Step 2a:** open that
catalog file and flip its frontmatter `status` from `drafting` (or
`unused` if it was never updated mid-flow) to `shipped:<slug>`. This
closes the loop — the catalog now remembers which IG seed became which
essay.

Then print, in a code block, the exact commands he should run:

```
git add content/musings/<slug>.mdx
git add inspirations/instagram/posts/<catalog-file>.mdx   # only if seeded
git commit -m "essay: <title with italics stripped>"
git push
```

End with one line:

> "pushed? give it two minutes. tinytrauma.in/musings/<slug>."

## Step 10 · Optional cross-post

Ask: *"want twitter/linkedin/instagram versions now, or later?"*

If now → invoke the cross-post flow on the file you just wrote.
If later → end the session.
