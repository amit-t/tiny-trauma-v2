# Phase 5 · AI workshop

Wire Anthropic SDK. Brainstorm threads + inline editor AI actions.

## Steps

### 5.1 System prompt

`lib/ai/system-prompt.ts` — version-controlled in-voice instructions. Read
`handoff/DESIGN-SYSTEM.md` "Voice rules" and the About page lede for tone.
Sample:

```ts
export const TINY_TRAUMA_SYSTEM = `
You are an assistant for Amit, the author of Tiny Trauma — a personal blog of
short essays and short fictions about the small daily friction of being alive.

Tone:
- Dry, slightly literary, self-aware. Lowercase-first. Italics for emphasis,
  never bold. Sentence case in titles and microcopy.
- Never preachy, never advisory, never self-help.
- Suggest cuts more often than additions. Sentences should earn their place.
- Italics in titles carry the emotional word. Example: "Why I cry at ads but
  not at things *that matter*".
- A "handwritten aside" phrase — wrapped ==like this== — is the writer's own
  margin note in italics. Suggest one per essay, at most.
- Pull quotes are surface-tinted blocks; mark them with three chevrons:
  >>> The line that's doing the most work goes here.
- Never use emoji. Never use "we" — Amit writes in "I".

You are not a co-author. You are an editor. You ask the question that makes
the draft sharper. You leave the writing to him.
`;
```

### 5.2 Anthropic client

`lib/ai/client.ts`:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export const MODEL_FAST = "claude-haiku-4-5";
export const MODEL_SMART = "claude-sonnet-4-5";
```

### 5.3 Brainstorm page

`app/admin/brainstorm/page.tsx` — chat UI:

- Sidebar: list of saved threads, "new thread" button.
- Main: chat with streaming responses. User messages right-aligned in surface
  bubbles; assistant messages full-width, just text in body font.
- Top bar of the chat: optional "attached to draft: *Why I cry at ads…*"
  picker. When attached, the draft content is included in the system prompt
  context.
- Sticky input at bottom. `Cmd+Enter` to send.

Preset chips above the input:
- "outline this"
- "tighten the third paragraph"
- "three alternative titles"
- "what's the line doing the most work?"
- "what's the kinder third theory?"

Clicking a preset prefills the input with that prompt (so the user can edit
before sending).

### 5.4 Streaming server action

`app/admin/brainstorm/actions.ts`:

```ts
"use server";
import { anthropic, MODEL_SMART } from "@/lib/ai/client";
import { TINY_TRAUMA_SYSTEM } from "@/lib/ai/system-prompt";

export async function streamBrainstorm({
  threadId, message, draftBody,
}: { threadId: string; message: string; draftBody?: string }) {
  // load thread.messages from db
  // build messages array (existing + new user message)
  // include draftBody in system if present
  // call anthropic.messages.stream
  // for each delta, persist to thread.messages
  // return a ReadableStream so the client can render token-by-token
}
```

Use `createStreamableValue` from `@ai-sdk/rsc` or roll your own with
`ReadableStream`. Persist the full assistant message after stream completes.

### 5.5 Inline AI actions in TipTap

Add a "selection menu" to the editor that appears when text is selected:

- **Tighten** — cuts 20–30% while keeping voice. Haiku.
- **Expand** — adds one more sentence of detail. Haiku.
- **Rewrite in voice** — rephrases to match Amit's tone. Haiku.
- **Suggest italics** — picks the single emphasis word. Haiku.
- **Find the load-bearing line** — comments inline, doesn't replace. Sonnet.

Each: server action that takes selected text + the full document for context,
returns a suggestion. UI shows a diff in a small floating panel above the
selection: original vs suggestion, with accept/reject.

On accept: replace the selection in TipTap; snapshot a revision with
`reason: "ai edit accepted: tighten"`.

### 5.6 Title suggester

In the editor sidebar, a "suggest titles" button:
- Sends current body to Claude with a small prompt.
- Returns 3 titles, each in voice (with italics in the right place).
- Owner clicks one → sets `posts.title`.

### 5.7 Cost guard

Add a simple in-memory rate limiter per user (since owner-only, it's effectively
just a daily cap). Skip if you'd rather rely on Anthropic's account-level limits.

## Acceptance

- [ ] `/admin/brainstorm` opens, can start a new thread.
- [ ] Send "give me three alternative titles for this draft" with a draft
      attached → see three streaming responses in voice.
- [ ] Threads persist; reload restores them.
- [ ] In the editor, select a paragraph, click "tighten", see a diff, accept it,
      revision saved.
- [ ] "Suggest italics" picks a sensible word.
- [ ] System prompt is testable in isolation (a Vitest spec that fires off
      a single message and asserts it contains no "we", no emoji, has italics
      in the response).

## Commit

```
feat(ai): anthropic client, system prompt, brainstorm threads, inline editor actions
```

Stop. Ask user to take a draft from rough idea → tightened, retitled, ready
to publish, all using the AI.
