# prompts/brainstorm.md — brainstorm only, no file output

Run when `mode=brainstorm`. The point is to leave the session with a list of
possible essays / shorts, not a finished file. Useful on a sunday morning
before committing to one.

## Step 1 · Open

> "okay. let's just see what's there. tell me three small things you've
> noticed this week — they don't have to be connected."

Wait.

## Step 2 · Capture the three

For each, one short follow-up. Then move on. Don't sharpen all the way —
this is exploration.

## Step 3 · The pile

Take everything he's given you. Without picking one, generate **10
possible angles**, mixing musings and shorts:

```
musings (6):
  1. title — one-line thesis
  2. title — one-line thesis
  ...

shorts (4):
  7. title — the image
  8. title — the image
  ...
```

Don't optimise for "good". Optimise for variety — some quiet, some funny,
some uncomfortable. He'll know which one to pull when he sees it.

## Step 4 · Mark favourites

Ask: _"which two or three feel alive to you, even if you can't say why yet?"_

For each one he picks, write a single follow-up question that would unlock
the essay. Don't try to write the essay. Just the question.

## Step 5 · Save the brainstorm

Offer to write the brainstorm to a markdown file under `content/.brainstorms/`
(gitignored if it isn't already — remind him to gitignore it if he wants).

Filename: `YYYY-MM-DD-brainstorm.md`.

Format:

```md
# brainstorm — 2026-05-17

## noticings

- ...
- ...
- ...

## angles

1. ...
2. ...
   ...

## the ones that feel alive

- "Why I cry at ads…" — the unlocking question is: ...
- "The 3 a.m. cart" — the unlocking question is: ...
```

If he says no, just print to terminal. He can copy what he wants.

## Step 6 · End

> "okay. when you're ready to write one of these, come back with `mode=essay`
> or `mode=short` and tell me which angle."

Don't loop into a writing session unless he explicitly asks.
