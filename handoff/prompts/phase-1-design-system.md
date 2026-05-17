# Phase 1 · Design system

Port the design tokens from `handoff/design/styles-v3.css` into the app and
build the primitive components. Verify by rendering a `/design` route that
shows every primitive in dark and light.

## Steps

1. **Tokens** — open `handoff/design/styles-v3.css` and `handoff/DESIGN-SYSTEM.md`.
   Move the `:root` and `[data-theme="light"]` token blocks into `app/globals.css`.
   Then add a Tailwind v4 `@theme` block that maps each CSS var to a utility:
   ```css
   @theme {
     --color-page:        var(--bg);
     --color-surface:     var(--surface);
     --color-raised:      var(--raised);
     --color-ink:         var(--ink);
     --color-ink-2:       var(--ink-2);
     --color-ink-3:       var(--ink-3);
     --color-ink-4:       var(--ink-4);
     --color-accent:      var(--accent);
     --color-accent-h:    var(--accent-h);
     --color-hi:          var(--hi);
     --color-rule:        var(--rule);
     --color-rule-soft:   var(--border);

     --font-display:      var(--font-display);
     --font-body:         var(--font-body);
     --font-hand:         var(--font-hand);

     --radius-sm:         2px;
     --radius-md:         4px;
     --radius-lg:         14px;
     --radius-xl:         18px;
   }
   ```
   Result: `bg-page`, `text-ink`, `font-display` etc. become valid Tailwind utilities.

2. **Theme toggle** — `components/theme-toggle.tsx` (client component):
   - Reads `localStorage["tt-theme-v3"]` on mount (avoid hydration mismatch:
     use a `useEffect` to set state, render neutral until ready).
   - Sets `document.documentElement.dataset.theme = "dark" | "light"`.
   - Renders the labeled pill ("light" / "dark") matching `design/index.html`.

3. **Primitive components** — build these in `components/ui/`. Match the HTML
   files exactly. Use cva for variants where appropriate.

   - `button.tsx` — variants: primary (accent fill, on-accent text), secondary
     (border, ink), ghost (transparent, accent on hover). Sizes: default, sm.
     Min height 44px (a11y).
   - `input.tsx` — text/email input with accent focus ring and italic placeholder.
   - `chip.tsx` — colored tag pill. Colors: `lavender|sage|butter|peach|slate`,
     mapped to `--chip-*` token pairs. Subtitle "musing" / "short" etc. derives
     from this.
   - `filter-pill.tsx` — toggleable filter button (active + count).
   - `hand-inline.tsx` — inline Caveat coral phrase. Children only.
   - `hand-aside.tsx` — block-level Caveat aside, rotated.
   - `art-slot.tsx` — placeholder striped panel with optional `tint` prop
     (lavender/sage/butter/peach/slate). `aspectRatio` prop. Children render
     inside (for hero captions etc.).
   - `pull-quote.tsx` — surface-tinted block with coral `"` corner mark and
     optional source attribution.
   - `marginalia.tsx` — left-margin metadata column for essay reading view.
     Sticky on desktop, flex-wrap row on mobile.
   - `cover-card.tsx` — book-cover-style card for shorts list (issue number,
     tilted handwritten corner mark, large title).
   - `colophon-footer.tsx` — the universal footer used on every page.
   - `elsewhere-strip.tsx` — the horizontal social/email strip below the colophon.
   - `nav.tsx` — top nav with brand mark, links, theme toggle.
   - `wordmark.tsx` — `<a href="/"><span class="brand">tiny <i>trauma</i></span></a>`
     with `size` prop (default 26px nav, 84px hero).

4. **`/design` showcase route** — `app/design/page.tsx`:
   - Renders every primitive in dark and light side-by-side or with a toggle.
   - Sections: Colors, Type scale, Buttons, Inputs, Chips, Cards, Pull quote,
     Marginalia, Cover card, Hand-inline + Hand-aside, Art slot tints, Footer.
   - Add it to nav only when `NODE_ENV !== "production"`.

5. **Type specimen** in `/design` — render each type-scale row (display, h1, h2,
   h3, body, lede, small, caption) with real sample text. Use the same examples
   as `design/index.html` section components.

6. **Run** — `pnpm dev`, open `http://localhost:3000/design`. Click the theme
   toggle. Verify nothing breaks across themes. Verify pixel match against the
   matching sections in `design/*.html`.

## Acceptance

- [ ] `/design` renders without errors.
- [ ] Theme toggle persists across reload.
- [ ] Every chip color renders correctly in both themes.
- [ ] Wordmark uses Fraunces 800, italic coral "trauma", no full stop.
- [ ] Button text is white/dark depending on theme (via `--on-accent`).
- [ ] No hardcoded hex anywhere in component files; always token-based.
- [ ] `pnpm typecheck` and `pnpm lint` pass.

## Commit

```
feat(design): port v3 tokens to tailwind v4, build primitive components
```

Stop. Tell the user phase 1 is done and ready for verification.
