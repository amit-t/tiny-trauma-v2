# Default analysis template

This is the bundled default. It produces a generic per-post card suitable for
a knowledge / clippings catalog. Copy and modify for your own downstream
project.

The skill substitutes the captured `{{caption}}`, `{{creator}}`, `{{url}}`,
`{{collection}}`, `{{collection_meta}}` (full JSON of the collection entry),
`{{title}}` (inferred from the first 60 chars of the caption or post header),
and `{{post_number}}` into the template, then asks the model to produce the
body — using the field headings below as a strict contract.

## Field headings the template must emit (default version)

```markdown
## Summary

{2–3 sentence digest of what the post is about}

## Key points

- {point 1}
- {point 2}
- {point 3}

## Notable quote

> {single best line from the caption verbatim, or "—" if none stands out}

## Raw caption

{full caption text, untouched — verbatim copy of the captured text}
```

## Frontmatter the skill always writes (you don't control these)

```yaml
---
post_number: {N}
url: "{url}"
creator: "@{handle}"
collection: "{collection_name}"
collection_meta:
  {entire collection object from collections.json, verbatim}
ingested_at: "{YYYY-MM-DD}"
title: "{inferred title}"
---
```

## Extra frontmatter the template MAY add

A template can ask the model to compute additional frontmatter keys and
emit them between the `---` markers. For example a writing-seeds template
might add:

```yaml
tone_tags: [grief, phones]
heat: high
status: unused
seed_type: musing
```

The skill merges template-emitted frontmatter on top of the always-written
keys above (template wins on conflict, except for `post_number` and `url`
which are immutable).

## Writing your own template

1. Copy this file.
2. Replace the field headings under "Field headings the template must emit"
   with whatever your project consumes.
3. Optionally add extra frontmatter keys under "Extra frontmatter".
4. Pass the new file's absolute path to the skill via `--analysis-template`.

The skill does not interpret the headings — it just passes the template to
the model with instructions to produce a body matching exactly those
sections in exactly that order.
