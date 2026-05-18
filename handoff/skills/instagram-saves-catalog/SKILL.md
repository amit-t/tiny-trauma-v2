---
name: instagram-saves-catalog
description: >
  Ingests posts from one or more Instagram saved-collection URLs into a local,
  searchable catalog of Markdown files. Uses your logged-in browser (via the
  Claude-in-Chrome extension) so it sees the same posts you see and does not
  trip Instagram's bot detection. Incremental — a URL registry tracks every
  post already ingested so re-runs only fetch new ones. The per-post analysis
  is pluggable via a template file, so the same skill can produce a marketing
  intelligence card, a writing-seed card, a research notes card, etc.

  Trigger when the user wants to "ingest my Instagram saves", "pull from my
  saved collection(s)", "refresh the Instagram catalog", or any phrasing about
  building or updating a local catalog of their own saved Instagram posts.
  Do NOT trigger for general Instagram tasks (posting, scheduling, audience
  analysis) — only for ingesting the user's OWN saved posts into a local
  searchable catalog.
arguments:
  - name: workspace
    description: |
      Absolute path to the workspace directory where outputs live.
      The skill will create (or update) `{workspace}/posts/` and
      `{workspace}/_url_registry.json` inside it.
    required: true
  - name: collections
    description: |
      Absolute path to a JSON file listing the saved-collection URLs to
      ingest. See `examples/collections.json` for the schema. Minimum:
      `{ "collections": [{ "name": "...", "url": "..." }] }`.
    required: true
  - name: analysis-template
    description: |
      Optional path to a Markdown file containing the per-post analysis
      prompt. If absent, the bundled default at `prompts/analyze-post.md`
      is used. Custom templates let downstream projects shape the output
      (writing seeds, research notes, marketing breakdowns, etc.) without
      forking the skill.
    required: false
  - name: mode
    description: |
      `ingest` (default) — fetch new posts and append.
      `rebuild-registry` — scan existing posts/ files and rebuild the
      registry from their frontmatter (recovery path if the registry is
      lost or corrupted).
    required: false
---

# instagram-saves-catalog

A generic, shareable Claude Code skill for turning your Instagram saved
collections into a local, searchable catalog of Markdown files.

Lives entirely on your machine. No third-party APIs, no scrapers, no
ToS-violating headless browsers. Uses the
[Claude-in-Chrome](https://claude.ai/chrome) extension to drive *your own*
logged-in browser the same way you would manually.

---

## Prerequisites

- **Claude in Chrome** extension installed and connected (the skill needs
  it to read `instagram.com` while you're logged in).
- **You are logged into Instagram** in that Chrome profile.
- A workspace directory exists (the skill will populate it).
- A `collections.json` file exists (see schema below).

---

## How to install (repo-local example)

```bash
mkdir -p .claude/skills
cp -R path/to/instagram-saves-catalog .claude/skills/
```

Or globally:

```bash
cp -R path/to/instagram-saves-catalog ~/.claude/skills/
```

---

## `collections.json` schema

```json
{
  "collections": [
    {
      "name": "ideas-bucket",
      "url": "https://www.instagram.com/<your-handle>/saved/ideas-bucket/<collection-id>/"
    },
    {
      "name": "recipes",
      "url": "https://www.instagram.com/<your-handle>/saved/recipes/<collection-id>/"
    }
  ]
}
```

To find a collection URL: open Instagram in your browser → Saved → click into
a named collection → copy the address bar. The numeric segment at the end is
the collection ID and is required.

Downstream projects may add **extra fields** per collection (e.g.
`default_seed_type`, `tag`, `priority`) — the skill forwards every field on
each collection object into the per-post frontmatter under the key
`collection_meta`, so analysis templates can read them.

---

## Flow

### Phase 0 — Load state

```python
import json, os

registry_path = f"{workspace}/_url_registry.json"
if os.path.exists(registry_path):
    with open(registry_path) as f:
        registry = json.load(f)
    already_done = set(registry.keys())
    next_post_number = max((v["post_number"] for v in registry.values()), default=0) + 1
else:
    registry = {}
    already_done = set()
    next_post_number = 1

print(f"Already ingested: {len(already_done)} posts. Next post number: {next_post_number}")
```

If `mode == "rebuild-registry"`, scan `{workspace}/posts/*.md` frontmatter
instead and reconstruct the registry from there. Then exit.

### Phase 1 — For each collection: navigate, scroll, extract URLs

For each entry in `collections.json` → `collections`:

1. **Navigate** the Chrome tab to the collection URL.
2. **Scroll** until `document.body.scrollHeight` stabilizes (Instagram
   lazy-loads ~3–4 passes):
   ```javascript
   const before = document.body.scrollHeight;
   window.scrollTo(0, document.body.scrollHeight);
   // wait 2s, then re-check; done when before === after
   ```
3. **Extract** all post URLs:
   ```javascript
   const links = [...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')]
     .map(a => a.href.split('?')[0].replace(/\/$/, '') + '/')
     .filter((v, i, arr) => arr.indexOf(v) === i);
   JSON.stringify(links);
   ```
4. **Tag** each URL with its source collection name (in memory).

### Phase 2 — Diff against registry

```python
new_items = [(url, collection) for (url, collection) in collected
             if url not in already_done]
print(f"Total seen: {len(collected)} | Already done: {len(already_done)} | New: {len(new_items)}")
```

If `new_items` is empty → report "No new posts" and exit cleanly.

### Phase 3 — For each new post: fetch, analyze, write

For each new `(url, collection)`:

1. **Navigate** the Chrome tab to the post URL.
2. **`get_page_text`** to capture caption and visible metadata. Do not use
   screenshots — text extraction is faster and cleaner.
3. **Identify** creator handle (from the post header) and post format
   (reel / carousel / image — inferable from the URL path and DOM).
4. **Run the analysis template** (`prompts/analyze-post.md` or the user's
   custom path) against the captured caption + metadata. The template
   defines the output fields.
5. **Compute** filename:
   `{NNN}_{creator_handle_no_at}_{slug}.md` where slug is the first 40
   chars of title, lowercased, non-alphanum → hyphens.
6. **Write** the MD file with frontmatter + the analysis output.
7. **Append** to the registry **immediately** (don't batch — a mid-run
   crash should leave state consistent):
   ```python
   from datetime import datetime
   registry[url] = {
       "post_number": post_number,
       "title": title,
       "creator": f"@{handle}",
       "collection": collection_name,
       "ingested_at": datetime.now().strftime("%Y-%m-%d"),
   }
   with open(registry_path, "w") as f:
       json.dump(registry, f, indent=2, ensure_ascii=False)
   ```

### Phase 4 — Summary

Print:

```
Ingested X new posts across Y collections.
  - <collection-1>: N new
  - <collection-2>: M new
Catalog now contains Z total posts at {workspace}/posts/.
```

---

## Output file schema

Every post file is a `.md` (or `.mdx` if the template names that
extension) with YAML frontmatter. The bundled default template produces:

```markdown
---
post_number: 7
url: "https://www.instagram.com/p/XXXX/"
creator: "@handle"
collection: "ideas-bucket"
collection_meta:
  name: "ideas-bucket"
  url: "https://www.instagram.com/.../saved/ideas-bucket/.../"
ingested_at: "2026-05-18"
title: "first 60 chars of caption / inferred title"
---

# {title}

**Creator:** @{handle}
**Collection:** {collection_name}
**Instagram:** [{url}]({url})

---

## Summary

{2-3 sentence digest of the post}

## Key points

- {point 1}
- {point 2}
- {point 3}

## Notable quote

> {best line from caption, or "—"}

## Raw caption

{full caption text, verbatim}
```

A downstream project (e.g. a writing blog) can pass its own
`--analysis-template` whose body has different field names — say `Friction`,
`Seed line`, `Heat` — and the skill will emit those instead. The frontmatter
fields above (`post_number`, `url`, `creator`, `collection`, `ingested_at`)
are always written; the template is responsible for the body and may add
extra frontmatter keys.

---

## Re-runs

Re-running is the default mode. Phase 0 loads the registry, Phase 2 diffs,
Phase 3 only touches new URLs. The skill is idempotent — running it three
times in a row with no new saves produces no new files.

If you delete a post file by hand and want it re-ingested, also remove its
URL from `_url_registry.json` (or run `mode=rebuild-registry` and the skill
will reconstruct the registry from whatever post files remain — the URL of
the deleted post will be missing, and the next ingest will fetch it again).

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Chrome extension not connected" | Open the Claude-in-Chrome popup and click Connect. |
| Instagram shows login page | Sign in to the Chrome profile and retry. |
| Lazy-loaded posts missing | Scroll more passes. Check `scrollHeight` actually stabilises. |
| Some captions empty | Reels and visual posts often have empty captions. Mark with "—" in the Notable quote field; the template should handle it gracefully. |
| Registry lost / corrupted | Run `mode=rebuild-registry`. The skill scans existing post files' frontmatter and rebuilds. Posts deleted off disk will be re-fetched on the next ingest run. |
| Wrong handle / wrong account | Confirm the Chrome profile is logged into the right Instagram account before running. |

---

## What this skill does NOT do

- Does not produce Word docs, HTML reports, or any aggregate output.
  This is an ingestion + per-post analysis tool only. Downstream tooling
  consumes the catalog.
- Does not generate cross-posts, captions, or commentary on its own.
  Use a separate skill for that and point it at the catalog.
- Does not auto-translate captions. If you want translation, write it into
  your `--analysis-template`.
- Does not run on a schedule. Trigger it manually from Claude Code when you
  want a refresh.
