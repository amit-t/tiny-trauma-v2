# prompts/cross-post.md — generate platform variants

Run when `mode=cross-post target=<path>`. Reads a published MDX file,
generates Twitter / LinkedIn / Instagram variants, prints them. Does not
post anywhere. Does not write any files. Amit pastes manually.

## Step 1 · Load the file

`target` is the path under `content/` without `.mdx`, e.g.
`musings/why-i-cry-at-ads`. Read:

```
content/<target>.mdx
```

Parse the frontmatter. Note the `title`, `dek`, body. Pull a couple of
load-bearing lines from the body (anything in `>>>` pullquote blocks is a
strong candidate).

If `status !== "published"`, refuse: _"this one's a draft. publish first."_

## Step 2 · Twitter thread

Generate a 4–6 tweet thread.

Constraints:

- Each tweet ≤ 280 characters.
- First tweet is the hook — a question or italic line that stops the scroll.
  Often a line from the essay.
- No emoji. No hashtags. No `🧵` indicator.
- Tweets in the middle move the thought one step each, no recap.
- Last tweet ends with: `↳ the full essay: tinytrauma.in/<target>`
- Lowercase except proper nouns. Match the voice.

Print as:

```
TWITTER (thread, 4–6 tweets)
─────────────────────────────
1/ ...

2/ ...

3/ ...
```

## Step 3 · LinkedIn post

600–800 characters total.

Constraints:

- Three short paragraphs.
- No "happy to share", no "thrilled to announce", no "lessons learned".
- No emoji. No hashtags.
- Last line: `the full essay → tinytrauma.in/<target>`
- Same voice. Dry, literary, lowercase-first, no self-promo posture.

Print as:

```
LINKEDIN (one post, 600–800 chars)
─────────────────────────────
...
```

## Step 4 · Instagram caption

≤ 1500 characters.

Constraints:

- Opens with the `dek` (no italics — IG doesn't render them).
- Three short paragraphs.
- Last block: 3–5 lowercase hashtags. Use real words, multi-word ok with
  spaces: `#small writing` `#daily friction` etc.
- No "link in bio" plea. He'll add it himself.
- Same voice.

Print as:

```
INSTAGRAM (caption, ≤1500 chars)
─────────────────────────────
...
```

## Step 5 · End

Print one line:

> "pick the ones you like. tweak if you need. these don't get saved anywhere
> — you're free to ignore."

No file output.
