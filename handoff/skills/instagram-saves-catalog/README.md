# instagram-saves-catalog

A Claude Code skill that turns your Instagram saved collections into a
local, searchable catalog of Markdown files. Pluggable per-post analysis
template — the same skill can produce writing seeds, research notes,
marketing breakdowns, etc.

Runs in **your own logged-in browser** via the
[Claude in Chrome](https://claude.ai/chrome) extension. No third-party
API, no headless scraping, no ToS-violating bot detection risk.

---

## What it does

1. Reads a `collections.json` listing one or more Instagram saved-collection
   URLs.
2. For each collection, navigates your Chrome tab there, scrolls to load
   every post, and extracts URLs.
3. Diffs against a persistent URL registry — only new posts are fetched.
4. For each new post, runs your chosen analysis template against the
   caption and metadata, then writes one Markdown file per post.
5. Updates the registry immediately after each write so partial runs are
   safe.

---

## Install

**Repo-local:**

```bash
mkdir -p .claude/skills
cp -R instagram-saves-catalog .claude/skills/
```

**Global (available across all projects):**

```bash
cp -R instagram-saves-catalog ~/.claude/skills/
```

---

## Use

From inside any project, open Claude Code:

```
claude
```

Then:

```
> /skill instagram-saves-catalog \
    --workspace /abs/path/to/output/dir \
    --collections /abs/path/to/collections.json
```

Or with a custom analysis template:

```
> /skill instagram-saves-catalog \
    --workspace /abs/path/to/output/dir \
    --collections /abs/path/to/collections.json \
    --analysis-template /abs/path/to/my-template.md
```

To rebuild a lost registry from existing post files:

```
> /skill instagram-saves-catalog \
    --workspace /abs/path/to/output/dir \
    --collections /abs/path/to/collections.json \
    --mode rebuild-registry
```

---

## `collections.json` example

See `examples/collections.json`. Minimum shape:

```json
{
  "collections": [
    {
      "name": "ideas-bucket",
      "url": "https://www.instagram.com/<you>/saved/ideas-bucket/<id>/"
    }
  ]
}
```

You may add extra keys per collection (e.g. `default_seed_type`, `tag`,
`priority`) — the skill forwards them all into each post's frontmatter
under `collection_meta`, so your analysis template can read them.

---

## Custom analysis template

A template is a Markdown file describing the post body to produce. The
skill substitutes captured caption + metadata into a prompt around your
template and emits the result as the body of each `.md`.

See `examples/analysis-template.md` for the bundled default. To write your
own, copy it, change the field headings to whatever your downstream tool
expects, and pass the path with `--analysis-template`.

---

## Files

```
instagram-saves-catalog/
├── SKILL.md                       — entry-point prompt Claude Code reads
├── README.md                      — this file
├── examples/
│   ├── collections.json           — sample input config
│   └── analysis-template.md       — bundled default per-post template
└── prompts/
    └── analyze-post.md            — internal prompt wrapper around the template
```

---

## What this skill does NOT do

- No Word doc, no aggregate HTML report — per-post `.md` only.
- No cross-post / repurposing — pair with another skill for that.
- No scheduling — manual trigger from Claude Code.
- No auto-translation — bake that into your template if you need it.
