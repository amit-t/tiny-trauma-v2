---
name: tt-instagram-ingest
description: >
  Pulls posts from Amit's Instagram saved collections (listed in
  inspirations/instagram/collections.json) into a local catalog at
  inspirations/instagram/posts/, with Tiny-Trauma-flavored analysis (Friction,
  Seed line, Voice, Essay angle, Short angle, Notable quote, Raw caption).
  Auto-translates Hindi / Hinglish captions to English. Incremental — re-runs
  only fetch new posts. The catalog is git-tracked but excluded from the
  deployed app build, and feeds Step 2 of the tiny-trauma-content essay/short
  flows as a seed shortlist.

  Trigger when the user says "ingest my Instagram saves", "pull new tiny
  trauma inspirations", "refresh the catalog", "run tt-instagram-ingest",
  or anything close. Do NOT trigger for general Instagram tasks — only for
  refreshing this specific Tiny Trauma catalog.
arguments:
  - name: mode
    description: |
      `ingest` (default) — fetch new posts and append.
      `rebuild-registry` — scan inspirations/instagram/posts/*.mdx and
      rebuild `_url_registry.json` from their frontmatter.
      `dry-run` — list which URLs WOULD be fetched without fetching them.
    required: false
---

# tt-instagram-ingest

The Tiny-Trauma-private wrapper around the generic
`instagram-saves-catalog` flow, with:

- Hardcoded paths inside this repo (no args needed for normal use).
- A Tiny-Trauma-flavored analysis card (Friction / Seed line / Voice /
  Essay angle / Short angle / Notable quote / Raw caption).
- Auto-translation of Hindi / Hinglish captions to English.
- Frontmatter fields (`seed_type`, `tone_tags`, `heat`, `status`) that the
  `tiny-trauma-content essay` Step 2 shortlist relies on.

---

## Prerequisites

- Playwright MCP auto-loaded from this repo's `.mcp.json` (after
  `pnpm install` + `pnpm mcp:install-browsers` on a fresh checkout).
- The persistent Chromium profile at `./.playwright-profile/` is **logged
  into the Instagram account that owns the saved collections listed in
  `collections.json`**. First run opens a headed window so you can sign in
  once; cookies persist there for future runs.
- Run from the `tiny-trauma-v2` repo root.

---

## Read this before doing anything

1. `inspirations/README.md` — what the catalog dir is, why it's git-tracked
   but undeployed.
2. `.claude/skills/tiny-trauma-content/voice-rules.md` — voice the analysis
   output should respect (English, lowercase, no emoji, sentence case in
   titles, no "we").
3. `inspirations/instagram/collections.json` — the live list of collection
   URLs to walk this run.

---

## Paths (hardcoded)

```
WORKSPACE         = <repo-root>/inspirations/instagram
COLLECTIONS_JSON  = <repo-root>/inspirations/instagram/collections.json
POSTS_DIR         = <repo-root>/inspirations/instagram/posts
REGISTRY_PATH     = <repo-root>/inspirations/instagram/_url_registry.json
```

Resolve `<repo-root>` by walking up from `cwd` to the first directory
containing both `package.json` AND a `.claude/skills/tt-instagram-ingest/`
subtree. Refuse to run outside the repo.

---

## Modes

### `ingest` (default)

Phase 0 → Phase 4 below.

### `rebuild-registry`

Scan `POSTS_DIR/*.mdx`, parse frontmatter, rebuild `REGISTRY_PATH` from
the union of `(url, post_number, title, creator, collection, ingested_at)`
seen in those files. Print a summary and exit.

### `dry-run`

Phase 0 + Phase 1 + Phase 2 only. Print which URLs WOULD be fetched per
collection. Do not fetch, do not write, do not touch the registry.

---

## Phase 0 — Load state

```python
import json, os

registry = {}
already_done = set()
next_post_number = 1
if os.path.exists(REGISTRY_PATH):
    with open(REGISTRY_PATH) as f:
        registry = json.load(f)
    already_done = set(registry.keys())
    next_post_number = max(
        (v["post_number"] for v in registry.values()), default=0
    ) + 1

with open(COLLECTIONS_JSON) as f:
    cfg = json.load(f)
collections = cfg["collections"]
if not collections:
    raise SystemExit("collections.json is empty. Add at least one entry.")
```

Print a one-liner: `Loaded N collections. Registry has M posts. Next post number = K.`

## Phase 1 — Walk each collection in the user's logged-in browser

For each `c` in `collections`:

1. **Skip placeholders.** If `c["url"]` contains `<your-handle>` or
   `<collection-id>` literal text, warn and skip — this is a template
   entry that hasn't been filled in.
2. **Navigate** the Chrome tab to `c["url"]`.
3. **Scroll** until `document.body.scrollHeight` stabilizes (usually 3–4
   passes, 2s between passes).
4. **Extract** post URLs:
   ```javascript
   const links = [...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')]
     .map(a => a.href.split('?')[0].replace(/\/$/, '') + '/')
     .filter((v, i, arr) => arr.indexOf(v) === i);
   JSON.stringify(links);
   ```
5. Tag each URL with its source `c` (collection name + full object for
   `collection_meta`).

If Instagram serves the login page, abort with a clear message — the user
needs to sign in to the Chrome profile and re-run.

## Phase 2 — Diff against registry

```python
new_items = [
    (url, c) for (url, c) in collected
    if url not in already_done
]
print(
    f"Total seen: {len(collected)} | already done: {len(already_done)} | "
    f"new to ingest: {len(new_items)}"
)
```

If `new_items` is empty → print "No new posts since last run." and exit
cleanly.

If `mode == "dry-run"` → print the new URLs per collection and exit.

## Phase 3 — For each new post: fetch, analyze (TT-flavored), write

For each `(url, c)` in `new_items`, in the order collected:

1. **Navigate** the Chrome tab to `url`.
2. **`get_page_text`** — capture caption text and surrounding header (for
   creator handle).
3. **Identify** creator handle, post format (reel / carousel / image), and
   if the caption is empty → mark caption as `—` and note "Visual / video
   — no caption."
4. **Translate if needed.** If caption contains Devanagari script OR is
   detectably Hinglish / Hindi-Romanized, translate to English first. Keep
   the original in `Raw caption`; produce all other analysis fields in
   English.
5. **Run the TT analysis template** (see "Analysis output" below).
6. **Compute frontmatter fields:**
   - `post_number` = `next_post_number`; increment after.
   - `seed_type` = `c["default_seed_type"]` if set, else infer from
     caption tone (musing if reflective, short if narrative/scene-based,
     null if neither fits).
   - `tone_tags` — pick 0–3 from TT vocab: `grief`, `phones`, `bangalore`,
     `small humiliations`, `love`, `family`, `competence`. Empty list if
     none fit (better empty than forced).
   - `heat` — `high | medium | low`. Use the rubric below.
   - `status: unused` always (lifecycle is updated by other tools later).
   - `ingested_at` = today, YYYY-MM-DD.
   - `language_source` — `english | hindi | hinglish | mixed`.
7. **Compute filename:** `{NNN}_{handle_no_at}_{slug}.mdx` where slug is
   the first 40 chars of the title (lowercased, non-alphanum → hyphens).
   If the slug collides with an existing file, append `-2`, `-3`, etc.
8. **Write** the `.mdx` to `POSTS_DIR/`.
9. **Append** to the registry immediately and write it out — never batch
   the registry write. If a run crashes mid-way, the registry must reflect
   exactly the files on disk.
   ```python
   registry[url] = {
       "post_number": post_number,
       "title": title,
       "creator": f"@{handle}",
       "collection": c["name"],
       "ingested_at": today_iso,
   }
   with open(REGISTRY_PATH, "w") as f:
       json.dump(registry, f, indent=2, ensure_ascii=False)
   ```

### Heat rubric

- **high** — there's a clearly load-bearing image, line, or moment that
  could anchor a 600-word musing or a 200-word short. The Seed line writes
  itself.
- **medium** — there's something there, but you'd have to do work to find
  the spine. Worth keeping, not urgent.
- **low** — recipe, news clip, joke, listicle, ad. Catalog it for
  completeness but don't expect to write from it.

Be honest with `low`. The catalog is more useful when it isn't padded.

## Phase 4 — Summary

Print:

```
Ingested X new posts across Y collections.
  - tiny-trauma-musings: A new (B high, C medium, D low)
  - tiny-trauma-shorts:  E new (F high, G medium, H low)
  - <each collection>:   ...

Catalog now contains Z total posts.
Try: rg 'heat: high' inspirations/instagram/posts | rg 'status: unused'
Or:  /skill tiny-trauma-content essay   (Step 2 will surface the top 5)
```

---

## Analysis output (per post)

Frontmatter the skill writes for every post:

```yaml
---
post_number: 7
url: "https://www.instagram.com/p/XXXX/"
creator: "@handle"
collection: "tiny-trauma-musings"
collection_meta:
  name: "tiny-trauma-musings"
  url: "https://www.instagram.com/.../saved/tiny-trauma-musings/.../"
  default_seed_type: "musing"
ingested_at: "2026-05-18"
title: "what the line above the bus stop said"
seed_type: "musing"
tone_tags: [bangalore, small humiliations]
heat: high
status: unused
language_source: english
---
```

Body the model generates:

```markdown
# {title}

## Friction
One sentence. The small daily friction this evokes. If nothing — write "—"
and downgrade heat accordingly.

## Seed line
The single image or phrase to remember. The line that catches in the throat.
English. 1–2 sentences max.

## Voice
mine | observed | overheard | text-on-screen

## Essay angle
One-line thesis if it could become a musing. Else: —

## Short angle
One-line premise if it could become a short fiction. Else: —

## Notable quote
> Best line from the caption verbatim (English — translated if source was
> Hindi/Hinglish). Or "—" if nothing stands out.

## Raw caption
{full caption text, exactly as captured, in the ORIGINAL language —
preserves nuance even when the analysis fields are translated}
```

### Voice constraints on the analysis fields

These outputs are read by the writing skill later, but they're also notes
to a future Amit. Match the Tiny Trauma voice:

- Lowercase intentional. Capitalize the first letter of each field's
  content; otherwise sentence case.
- No emoji. No "we". No marketing-speak ("Hook", "CTA", "engagement").
- Specific over abstract. "a friend who answered too fast" beats "issues
  with communication."
- Better to write "—" than to invent a Friction that isn't there. Empty
  is data; padding is noise.

---

## Idempotence + safety

- Registry is the single source of truth for "ingested". A URL appears
  once, ever.
- Registry writes happen after **each** successful file write — never
  batched.
- File names include `post_number` to guarantee uniqueness even on slug
  collision.
- `rebuild-registry` mode is the recovery path if the registry is lost or
  diverges from disk.
- The skill never modifies an existing post file. Re-ingesting an updated
  IG caption requires manually deleting both the file and its registry
  entry.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "collections.json is empty" | Edit `inspirations/instagram/collections.json` and add at least one real collection. |
| Placeholder URL warning | Replace `<your-handle>` and `<collection-id>` with real values. |
| Instagram login page | Sign in to the Chrome profile that owns these saves; re-run. |
| "No new posts since last run" | Expected on re-runs with nothing new. Add posts in IG, save them to the collection, re-run. |
| Wrong handle in extracted posts | The Chrome profile is logged into the wrong account. Switch profiles. |
| Registry / disk mismatch | Run `mode=rebuild-registry`. |
| Caption was Hindi but output isn't English | Re-run that single post by deleting its file + registry entry and re-ingesting. File a fix note in this SKILL.md. |
