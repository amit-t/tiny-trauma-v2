---
name: tt-currently
description: >
  Updates the "currently" footer block on tinytrauma.in — the three lines
  under the colophon (reading / writing / noticing). Writes
  data/currently.json, commits, and pushes so DigitalOcean rebuilds the
  site with the new lines. The colophon hides any row whose value is
  empty.

  Trigger when the user says "update currently", "change what I'm
  reading / writing / noticing on the site", "/tt-currently", "set my
  currently block", or anything similar. Do NOT trigger for changes to
  the rest of the site copy — only the three currently lines.
arguments:
  - name: reading
    description: |
      Optional. What you're reading right now. One line. Italics with
      `*asterisks*` allowed (renderInline handles them). Pass an empty
      string to clear the row (hides it on the site).
    required: false
  - name: writing
    description: |
      Optional. What you're working on. One line. Italics allowed. Empty
      to hide.
    required: false
  - name: noticing
    description: |
      Optional. What you've been noticing. One line. Italics allowed.
      Empty to hide.
    required: false
---

# tt-currently · update the footer block

The "currently" block sits in the colophon footer of every public page.
Three rows: **reading**, **writing**, **noticing**. Source of truth is
`data/currently.json`. Any row with an empty string is hidden by the
shell (`components/layout/site-shell.tsx`).

---

## Voice

Match `.claude/skills/tiny-trauma-content/voice-rules.md`:

- lowercase intentional. no sentence-initial capital unless it's a proper
  noun or a book title.
- italics for emphasis or titles via `*asterisks*` — they render Caveat
  coral on the site.
- one short line per row. Not a sentence with a period unless the period
  is doing work.
- no emoji. no "we". no marketing-speak.
- specific over abstract. *"the dog at the corner has started recognising
  the auto, not me."* beats *"observing urban wildlife behaviour."*

Good shapes:

- reading — `*book title*, author — small qualifier (slowly / out loud / on the metro / again)`.
- writing — `something about <specific thing>` or `the <thing> essay, in revision`.
- noticing — one image, in present tense. A line you'd want to put in an essay.

---

## Flow

### Step 1 — Read current state

```python
import json
path = "<repo-root>/data/currently.json"
with open(path) as f:
    cur = json.load(f)
print(f"now reading: {cur['reading'] or '—'}")
print(f"now writing: {cur['writing'] or '—'}")
print(f"now noticing: {cur['noticing'] or '—'}")
print(f"last updated: {cur.get('updatedAt') or 'never'}")
```

### Step 2 — Collect changes

**If any of `reading`, `writing`, `noticing` were passed as arguments,**
use those values directly (empty string = clear that row). Skip Step 2a.

**Otherwise** run Step 2a — grill mode.

#### Step 2a — Grill mode (no args)

Ask in this order, one at a time. Echo the current value first so Amit
can see what he's replacing. After each answer, accept it as the new
value (or `keep` to leave unchanged, or `clear` to empty it).

```
> reading — current: {cur.reading or '—'}
>   new (or `keep` / `clear`):
```

Wait. Then `writing`, then `noticing`.

### Step 3 — Write the file

```python
from datetime import date

next_data = {
    "reading":  new_reading,   # string, possibly empty
    "writing":  new_writing,
    "noticing": new_noticing,
    "updatedAt": date.today().isoformat(),
}
with open(path, "w") as f:
    json.dump(next_data, f, indent=2, ensure_ascii=False)
    f.write("\n")  # trailing newline, prettier prefers it
```

### Step 4 — Show the diff

```bash
git diff -- data/currently.json
```

Print the diff back to Amit. Confirm: *"push this? (y/n)"* — wait.

### Step 5 — Commit and push

Only if confirmed:

```bash
git add data/currently.json
git commit -m "chore(currently): update reading/writing/noticing"
git push
```

Then print:

> "pushed. DO will rebuild in ~2 minutes. refresh tinytrauma.in to see it."

If `git push` fails (auth, no remote, dirty working tree), print the
error and stop — do **not** retry destructively.

### Step 6 — Cleanup

Nothing to clean. The skill is single-purpose and one-shot.

---

## Notes

- **No staging anything else.** This skill must `git add` only
  `data/currently.json`. If the working tree has unrelated changes, the
  commit should still contain only this one file.
- **The site uses italics from `*asterisks*`.** Don't strip them. They
  render via `renderInline` into Caveat coral spans.
- **Empty string ≠ deleted key.** The JSON must keep all three keys
  (`reading`, `writing`, `noticing`) at all times. An empty string hides
  the row but preserves the schema.
- **No git hooks bypass.** Never `--no-verify`. If a pre-commit hook
  fails, fix the issue and create a new commit.
- **`updatedAt` is informational.** Nothing on the site reads it — it's a
  marker for future tooling and for Amit's own glance.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "git push" fails with auth error | Amit needs to refresh his GH credentials. Stop and report. |
| `data/currently.json` doesn't exist | Create it with empty strings + `updatedAt: null`, then continue. |
| Italics not rendering | Use `*single asterisks*`, not `_underscores_` or `**bold**`. The `renderInline` helper only handles `*…*`. |
| Pre-commit hook fails | Fix the underlying issue; never `--no-verify`. |
