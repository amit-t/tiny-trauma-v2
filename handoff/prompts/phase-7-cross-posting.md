# Phase 7 · Cross-posting + polish

The last phase. Generate platform variants from a published essay. Polish empty
and error states across admin. Optional: analytics.

## Steps

### 7.1 Cross-post generator

`app/admin/cross-post/page.tsx`:

- List of published posts on the left. Click one to load.
- Right side: tabs for Twitter, LinkedIn, Instagram caption, Bluesky.
- Each tab has a "generate" button. On click: server action calls Claude Sonnet
  with the platform-specific prompt + the post body. Returns 1–3 variants.
- Variants render as editable cards with character counts.
- "Copy to clipboard" button per variant.
- Save to `cross_posts` table on edit (autosave).

### 7.2 Platform prompts

`lib/ai/cross-post-prompts.ts`:

```ts
export const TWITTER_PROMPT = `
Generate a Twitter thread of 4–6 tweets from the essay below.

Constraints:
- First tweet is the hook — a question or italic line that stops the scroll.
- Each tweet ≤ 280 chars including spaces.
- No emoji. No hashtags. No "🧵".
- Last tweet ends with the line "↳ the full essay: tinytrauma.in/musings/{slug}"
  (we'll substitute the slug).
- Lowercase except proper nouns.
- Match the dry, slightly literary voice.

Output as JSON: { "tweets": ["...", "...", ...] }
`;

export const LINKEDIN_PROMPT = `
Generate a LinkedIn post from the essay below.

Constraints:
- 600–800 characters.
- Three short paragraphs.
- No "happy to share", no "thrilled to announce", no "lessons learned".
- No emoji. No hashtags.
- Last line is the link: "the full essay → tinytrauma.in/musings/{slug}"
- Same voice: dry, literary, lowercase-first, no self-promotion.

Output as JSON: { "post": "..." }
`;

export const INSTAGRAM_CAPTION_PROMPT = `
Generate an Instagram caption from the essay below.

Constraints:
- Max 1500 chars.
- Opens with the dek (italic in our brand — but plain text on IG).
- Three short paragraphs.
- Last block: 3–5 lowercase hashtags relevant to the theme (e.g.
  "#small writing", "#daily friction", "#essay").
- No emoji. No "link in bio" plea — we know.
- Match the voice.

Output as JSON: { "caption": "..." }
`;
```

### 7.3 Polish — empty, error, loading states across admin

Open every admin route. Make sure:

- **Empty state**: in voice, one-line, often italic, sometimes handwritten.
- **Loading**: italic "*thinking…*" or "*loading the small things…*" — never
  spinners alone.
- **Error**: "*something broke. it's me, not you.*" with a small "report this"
  link mailto link.
- **Success toasts**: short, in voice — "*saved.*", "*scheduled. see you sunday.*",
  "*sent. now go for a walk.*"

### 7.4 Microcopy review

Pass through every form, every button, every confirmation modal. Anything that
sounds AI-generated, rewrite it in voice. Examples to fix:
- "Are you sure you want to delete this post?" → *"delete this draft? it's
  not coming back."*
- "Post created successfully" → *"created. go write it."*
- "Sign out" button label → just "sign out", lowercase, no icon.

### 7.5 Optional — Plausible analytics

If `PLAUSIBLE_DOMAIN` env is set:
- Add the Plausible script in `app/layout.tsx`.
- Build `/admin/page.tsx` "last 7 days" widget that hits the Plausible API
  for visits, top posts, top sources.

### 7.6 Production checklist

Create `handoff/DEPLOY.md` with:

- Vercel project setup
- Custom domain (tinytrauma.in) + DNS
- Resend domain verification (DKIM, SPF, DMARC)
- Vercel cron secrets
- Neon production branch + connection pooler
- Backup strategy (Neon point-in-time recovery is enough for v1)

### 7.7 README pass

Update the top-level `README.md` (the one outside `handoff/`):

- One-line description
- Screenshot of `/` (from `/design` or production)
- Stack list
- "Run locally" steps
- "Deploy" pointer to `handoff/DEPLOY.md`
- Acknowledgments: "designed by hand. typeset in fraunces + ibm plex mono.
  built by Claude Code over a weekend."

## Acceptance

- [ ] From a published essay, generate Twitter / LinkedIn / Instagram variants.
- [ ] Each variant matches the voice (sample with the owner: copy a variant,
      read it aloud — does it sound like Amit?).
- [ ] Every admin page has considered empty/error/loading states.
- [ ] No "loading…" spinners; everything in voice.
- [ ] Production deploy documented and tested.

## Commit

```
feat(cross-post): generate twitter/linkedin/instagram variants from a post
chore(polish): empty/error/loading states across admin
docs(deploy): production deployment guide
docs(readme): top-level project readme
```

Done. Tell the user the app is ready to go live. First sunday letter is on them.
