# DESIGN-SYSTEM.md — Tiny Trauma v2

Final reference. The visual ground truth is in `design/*.html`. This file
spells out the rules so the agent doesn't have to re-derive them.

## Wordmark

**Lowercase bold Fraunces, italic coral "trauma":**

```html
<span class="brand">tiny <i>trauma</i></span>
```

Set at 26px in nav, 84px in hero, 22px on social/icon contexts. The italic on
"trauma" is `font-style: italic; color: var(--accent); font-weight: 700;`.

**No full stop after "trauma".** It was tried, removed, decision is final.

## Color tokens

Dark is canonical. Light is opt-in.

```css
:root {
  --bg:        #14110C;
  --surface:   #1D1812;
  --raised:    #251F17;
  --art:       #2A231A;
  --art-l:     #2D2538;   /* lavender */
  --art-s:     #1F2B22;   /* sage */
  --art-b:     #31281A;   /* butter */
  --art-p:     #38241F;   /* peach */
  --art-sl:    #1E2A35;   /* slate */

  --ink:       #ECE4D0;
  --ink-2:     #B5AB93;
  --ink-3:     #847B6A;
  --ink-4:     #5A5246;

  --border:    #2A2520;
  --rule:      #34302A;

  --accent:    #F08652;   /* coral-orange */
  --accent-h:  #FF9D6E;
  --hi:        #FFE680;   /* acid yellow for selection */
  --on-accent: #14110C;
  --stripe:    rgba(255,255,255,0.025);

  --chip-l-bg:#2F2840; --chip-l-fg:#CABEEB;
  --chip-s-bg:#28332A; --chip-s-fg:#BFD3BC;
  --chip-b-bg:#34301F; --chip-b-fg:#DDD09B;
  --chip-p-bg:#3A2722; --chip-p-fg:#F2B6A0;
  --chip-sl-bg:#1E2A35; --chip-sl-fg:#A8C3DC;
}

[data-theme="light"] {
  --bg:        #F4EFE3;
  --surface:   #EBE4D2;
  --raised:    #FFFFFF;
  --art:       #E3DAC4;
  --art-l:     #DCD4E9;
  --art-s:     #D6E1CC;
  --art-b:     #ECE0B6;
  --art-p:     #ECCBBC;
  --art-sl:    #C9D6E3;

  --ink:       #1A1613;
  --ink-2:     #52483D;
  --ink-3:     #8A7F6E;
  --ink-4:     #B3A893;

  --border:    #D9CFB8;
  --rule:      #BFB59C;

  --accent:    #B4471F;
  --accent-h:  #913719;
  --hi:        #F5D33A;
  --on-accent: #FFFFFF;
  --stripe:    rgba(20,17,12,0.045);

  --chip-l-bg:#E5DAFB; --chip-l-fg:#3D2E6B;
  --chip-s-bg:#D5E8D2; --chip-s-fg:#2F4F35;
  --chip-b-bg:#F1E6A8; --chip-b-fg:#5E4A12;
  --chip-p-bg:#F8D7C7; --chip-p-fg:#6B2E1A;
  --chip-sl-bg:#D2E1F0; --chip-sl-fg:#1F3A55;
}
```

Token mapping for Tailwind v4 (in `@theme`):

| CSS var       | Tailwind class                        |
|---------------|---------------------------------------|
| `--bg`        | `bg-page`                             |
| `--surface`   | `bg-surface`                          |
| `--raised`    | `bg-raised`                           |
| `--ink`       | `text-ink`                            |
| `--ink-2`     | `text-ink-2`                          |
| `--ink-3`     | `text-ink-3`                          |
| `--ink-4`     | `text-ink-4`                          |
| `--border`    | `border-rule-soft`                    |
| `--rule`      | `border-rule`                         |
| `--accent`    | `text-accent` / `bg-accent`           |
| `--hi`        | `bg-hi` (used on selection + featured-mark) |

## Type

Three families. Load via `next/font` in `lib/fonts.ts`.

```ts
import { Fraunces, IBM_Plex_Mono, Caveat } from "next/font/google";

export const display = Fraunces({
  subsets: ["latin"], variable: "--font-display",
  axes: ["opsz", "SOFT"],
  weight: ["300","400","500","600","700","800"],
  style: ["normal","italic"],
  display: "swap",
});

export const body = IBM_Plex_Mono({
  subsets: ["latin"], variable: "--font-body",
  weight: ["300","400","500"],
  style: ["normal","italic"],
  display: "swap",
});

export const hand = Caveat({
  subsets: ["latin"], variable: "--font-hand",
  weight: ["400","500"],
  display: "swap",
});
```

Apply on `<html>`:

```tsx
<html className={`${display.variable} ${body.variable} ${hand.variable}`}>
```

### Type scale (rem, 16px base)

| Token            | Size            | Line | Tracking | Weight | Used for                |
|------------------|-----------------|------|----------|--------|-------------------------|
| `text-display`   | clamp(56–144px) | 0.92 | -0.045em | 800    | Hero on home/shorts     |
| `text-h1`        | clamp(40–72px)  | 0.95 | -0.035em | 700    | Page intros             |
| `text-h2`        | clamp(40–56px)  | 1.0  | -0.035em | 700    | Section heads           |
| `text-h3`        | 26px            | 1.15 | -0.015em | 500    | Card titles             |
| `text-h4`        | 20px            | 1.2  | -0.01em  | 600    | Footer headings         |
| `text-lede`      | 22px            | 1.5  | 0        | 400 italic | Standfirst          |
| `text-body`      | 15.5px          | 1.78 | 0        | 400    | Long-form              |
| `text-small`     | 13.5px          | 1.6  | 0        | 400    | Metadata, byline       |
| `text-caption`   | 12.5px          | 1.5  | 0.04em   | 400    | Captions, footnotes    |

All display sizes use Fraunces with `font-variation-settings: "opsz" 144, "SOFT" 30`
at large sizes, lower opsz at smaller. Body uses Plex Mono. Italics in `<em>` get
the accent color when used for emphasis (titles, dek). Body italics stay ink.

### Casing rules

- Sentence case everywhere. Headings, buttons, nav.
- No uppercase fixtures. (Mono-uppercase was rejected.)
- Lowercase wordmark, lowercase nav links.

## Components

The HTML files are the source. Each section below names where to look.

| Component         | Where (in `design/*.html`) |
|-------------------|----------------------------|
| Navbar            | every file, `.nav` class |
| Brand mark        | `.brand` in every file |
| ThemeToggle       | `#theme-toggle` button + script tail |
| Hero (home)       | `index.html` `.hero` |
| Page intro        | `musings.html` `.page-intro` |
| Card (with chips) | `index.html` `.card.t-grief` etc. |
| List river item   | `musings.html` `.river-item` |
| Chip              | `.chip.l`, `.chip.s`, `.chip.b`, `.chip.p`, `.chip.sl` |
| Filter pill       | `.filter` in `musings.html` |
| Cover card        | `shorts.html` `.cover-card` |
| Pullquote         | `musing.html` `.pullquote` |
| Marginalia        | `musing.html` `.margin` |
| Drop cap          | `short.html` `.short-body p:first-of-type::first-letter` |
| Handwritten aside | `.hand`, `.hand-inline`, `.aside-line` |
| Art slot          | `.art-slot` (placeholder striped panel) |
| Pulse dot         | `index.html` `.hero .kicker .pulse` |
| Featured short    | `index.html` `.featured` |
| Newsletter band   | `index.html` `.newsletter` |
| Colophon          | every file `.colophon` |
| Elsewhere strip   | every file `.elsewhere-strip` |
| Subscribe card    | `newsletter.html` `.subscribe-card` |

## Voice rules — the four sacred ones

1. **Italics for emphasis.** Never bold inside prose. Coral for emotional weight.
2. **Lowercase brand and nav.** Sentence-case headings. No SHOUTING.
3. **Handwritten font is rare.** Two instances per page maximum, and they are
   asides from the writer, not UI labels.
4. **Sentence-length microcopy.** Form errors, empty states, button text — they
   should sound like the writer wrote them. Examples in `design/*.html`.

## Specific copy examples to preserve verbatim

These appear across pages and should remain identical:

- Hero lede: *"A personal blog about [the small daily friction] between who you
  are and everything around you. Honest, slightly literary, sometimes funny,
  occasionally devastating, never a wellness tip."* — the bracketed phrase is
  the handwritten inline.
- Newsletter footer: *"if you found something here, tell someone."* (handwritten)
- About page lede: *"I'm Amit. [this is where I keep things.]"* — handwritten inline.
- Newsletter button: *"subscribe →"* (lowercase, en-arrow)
- Email small print: *"no spam. unsubscribe in one click. I read every reply,
  even the angry ones."*
- Currently block heading: *"currently"* (lowercase)
- Colophon: *"set in fraunces & ibm plex mono · made in bangalore"*

## What NOT to do (carried from design review)

- No drop shadows except modal.
- No emoji in product UI.
- No third typeface.
- No icon library for nav.
- No social icons in footer (text links only — twitter, instagram, rss, email).
- No uppercase mono fixtures.
- No "Read more →" chevrons on every card (title underline is the affordance).
- No "We respect your privacy" — write something honest.
- No drop caps on essays (only on short fiction — already in `short.html`).
- No marginalia on shorts (only on essays — already in `musing.html`).
