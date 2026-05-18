# prompts/analyze-post.md — internal wrapper

This is the wrapper prompt the skill assembles around the user's chosen
analysis template (default or `--analysis-template`). It is not a template
itself; it tells the model how to use one.

## Inputs the skill substitutes

- `{{template_body}}` — full contents of the chosen analysis-template file.
- `{{caption}}` — captured post caption (may be empty for some visual posts).
- `{{creator}}` — handle without `@`.
- `{{url}}` — canonical post URL.
- `{{collection}}` — name of the source collection.
- `{{collection_meta}}` — JSON-encoded full collection object.
- `{{title}}` — first 60 chars of caption (or "Visual / video — no caption").
- `{{post_number}}` — zero-padded number assigned by the skill.

## The prompt

```
You are producing one entry in a local Markdown catalog of Instagram posts.

The user's analysis template defines the exact body fields and any extra
frontmatter keys you may add. Follow it strictly — same headings, same
order, no extras, no commentary outside the fields.

CAPTURED POST
=============
URL: {{url}}
Creator: @{{creator}}
Collection: {{collection}}
Collection meta (JSON): {{collection_meta}}
Inferred title: {{title}}
Post number: {{post_number}}

Caption (verbatim):
"""
{{caption}}
"""

ANALYSIS TEMPLATE
=================
{{template_body}}

OUTPUT
======
Produce ONLY the body of the post file — the section between the closing
frontmatter `---` and end-of-file. Do not emit the frontmatter; the skill
writes it. If the template specifies "Extra frontmatter the template MAY
add", emit those keys at the very top of your output prefixed with the
marker `+++ frontmatter:` on one line, followed by valid YAML, followed
by another `+++` line on its own; the skill will lift those keys into the
file frontmatter and strip the markers.

Use the inferred title as-is for the body H1 heading.
```

## Output parsing the skill does

After the model returns, the skill:

1. Looks for a leading block:
   ```
   +++ frontmatter:
   <yaml>
   +++
   ```
   If present, parses the YAML and merges its keys into the file
   frontmatter (template wins on conflict, except `post_number` and `url`).

2. Writes the rest as the body of the `.md` file.

3. Validates that every heading listed in the template's "Field headings
   the template must emit" block appears in the body, in order. If any are
   missing, retries the prompt once with an explicit reminder; on second
   failure, writes the file with a `validation_error: true` frontmatter
   flag so the user can repair manually.
