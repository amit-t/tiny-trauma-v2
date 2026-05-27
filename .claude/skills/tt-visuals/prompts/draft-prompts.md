# Draft visual prompts for a Tiny Trauma post

You are drafting image-generation prompts for one mdx post on Tiny Trauma.
Read every input in full before writing.

## Inputs (you will be given, in this order)

1. `voice-rules.md` from the `tiny-trauma-content` skill — the literary
   voice of the blog. Your prompts must match this tone.
2. `visual-style.md` — three hard rules: hand-drawn editorial, muted
   palette from `heroTint`, no faces.
3. The full mdx of the post (frontmatter + body).
4. A JSON list of slots that need prompts, e.g.
   `["hero", "inline-1", "inline-2"]`.

## Output (strict JSON, nothing else — no prose, no markdown fences)

```json
{
  "hero": {
    "prompt": "<one English sentence, 12–35 words>",
    "negative": "no faces, no people centered, no text, no logos, no watermark, no photoreal, no 3D render, no anime, no glossy",
    "aspect": "16:9",
    "tint": "<copy of frontmatter heroTint, or 'none'>"
  },
  "inline": [
    {
      "slot": "inline-1",
      "prompt": "<one English sentence>",
      "negative": "<as above>",
      "aspect": "4:3",
      "tint": "<as above>"
    }
  ]
}
```

If a slot is not in the input list, omit it. If the input list is empty,
return `{"hero": null, "inline": []}`.

## Rules

- One sentence per prompt. No multi-paragraph stage directions.
- Reference the post's specific image, not its theme. "A copper kettle on
  a kitchen sill at first light" is good; "domestic familiarity" is not.
- Inline prompts must be informed by the paragraph the marker sits inside.
  Caption-context is in the body around each `[[visual:]]` marker.
- Hero `aspect` is always `16:9`. Inline default is `4:3` unless the
  paragraph clearly wants tall (`4:5`) or wide (`16:9`).
- Tint = frontmatter `heroTint` verbatim. If `heroTint` is `none`, write
  `"tint": "none"`.
- Append `visual-style.md` negative defaults to every `negative` field
  exactly as written above.
- If `[[visual: <text>]]` already contains override text, **do not** draft
  for that slot — the caller will substitute. You will not see overridden
  slots in your input list.

## Failure modes you must avoid

- Do not invent slots not in the input list.
- Do not produce prose around the JSON.
- Do not change the schema. The caller parses strictly.
