# Architecture — my-ai-portfolio-app

> Reverse-documentation. Everything below was verified by reading the code in this repository, and
> file paths are cited so any claim can be traced. Anything not confirmable from the code is marked
> `[unverified]`. This document describes **how the system is built**; see `requirements.md` for
> **what it does**.

---

## 1. Tech Stack

Versions are exactly as declared in `package.json`.

| Technology | Version | Role |
|---|---|---|
| **Next.js** | `16.2.4` | Full-stack framework — App Router, React Server/Client Components, API route handlers, middleware |
| **React** / **React DOM** | `19.2.4` | UI runtime |
| **TypeScript** | `^5` | Language across app, lib, and scripts (`strict: true`) |
| **@anthropic-ai/sdk** | `^0.95.0` | Claude client — streaming answers and follow-up generation |
| **Claude Haiku 4.5** | model id `claude-haiku-4-5` | The LLM, for both the answer stream and follow-up questions |
| **Voyage AI** | model `voyage-3`, 1024 dims | Embeddings — called over raw REST, **not** via the installed SDK |
| **drizzle-orm** | `^0.45.2` | Schema definition and typed queries |
| **drizzle-kit** | `^0.31.10` | Migration generation (`drizzle.config.ts`) |
| **@neondatabase/serverless** | `^1.1.0` | HTTP driver for Neon PostgreSQL |
| **pgvector** | PostgreSQL extension | `vector(1024)` column + HNSW cosine index |
| **@upstash/ratelimit** | `^2.0.8` | Sliding-window limiter in `middleware.ts` |
| **@upstash/redis** | `^1.38.0` | Redis backend for the limiter |
| **dotenv** | `^17.4.2` | Loads `.env.local` in the standalone scripts and in `drizzle.config.ts` |
| **tsx** | `^4.21.0` (dev) | Runs the TypeScript CLI scripts |
| **tailwindcss** + **@tailwindcss/postcss** | `^4` (dev) | Present in the PostCSS pipeline **but inert** — see §10 |
| **eslint** + **eslint-config-next** | `^9` / `16.2.4` (dev) | Linting |

### Important framing

- **This is Next.js 16 App Router — not Next.js 15.** `package.json:26` pins `next: 16.2.4` and
  `AGENTS.md` warns explicitly that this version's APIs and conventions differ from older Next.js;
  consult `node_modules/next/dist/docs/` before writing framework-level code.
- **There is no `src/` folder.** `app/`, `lib/`, `scripts/`, and `knowledge-base/` all sit at the
  repository root, and `tsconfig.json` maps `@/*` to `./*` accordingly.
- **All UI is client-side.** Every component and every page under `app/` (except `app/layout.tsx` and
  `app/admin/layout.tsx`) carries `"use client"`. There are no Server Components doing data fetching
  and no Server Actions; pages fetch from API routes with `fetch` inside `useEffect`.

### Installed but unused

`@ai-sdk/google`, `@google/generative-ai`, `@xenova/transformers`, `framer-motion`, `ai` (Vercel AI
SDK), and `voyageai` do not appear in any import in `app/`, `lib/`, or `scripts/`. The AI SDK's data
stream format is hand-rolled in `app/api/chat/route.ts`; Voyage is called with `fetch`.

---

## 2. Folder Structure

```
my-ai-portfolio-app/
│
├── app/                                  # App Router root — pages, components, API routes
│   ├── layout.tsx                        # Root layout: <html lang="en">, metadata/OpenGraph, imports globals.css
│   ├── page.tsx                          # "/" — holds showChat state; WelcomePage over a pre-mounted ChatInterface
│   ├── globals.css                       # THE design system: CSS custom properties, keyframes, reset, a11y rules
│   ├── favicon.ico
│   │
│   ├── admin/
│   │   ├── layout.tsx                    # Pass-through wrapper; auth is per-page/middleware, not here
│   │   ├── page.tsx                      # "/admin" — password login form (public entry point)
│   │   ├── conversations/page.tsx        # Session list + transcript viewer, with search
│   │   ├── analytics/page.tsx            # Stat cards, 14-day bar chart, top/first/unanswered questions
│   │   └── usage/page.tsx                # Token totals, cost estimate, per-session breakdown
│   │
│   ├── api/
│   │   ├── chat/route.ts                 # POST — the whole RAG + streaming pipeline (the core of the app)
│   │   ├── contact/route.ts              # POST — validates and emails a contact-form submission via Resend
│   │   └── admin/
│   │       ├── login/route.ts            # POST — sets the admin_token cookie
│   │       ├── logout/route.tsx          # POST — clears it (note: .tsx extension, see §10)
│   │       ├── sessions/route.ts         # GET — all sessions enriched with count + first message
│   │       ├── sessions/[sessionId]/messages/route.ts  # GET — full transcript for one session
│   │       ├── analytics/route.ts        # GET — aggregate metrics + unanswered-question detection
│   │       └── usage/route.ts            # GET — token totals and cost estimate
│   │
│   └── components/                       # All components live here (no top-level components/ dir)
│       ├── WelcomePage.tsx               # Animated quote splash with "Ask me anything →" CTA
│       ├── ChatInterface.tsx             # Root chat client: state, streaming reader, persistence, theme, voice
│       ├── LeftPanel.tsx                 # Desktop sidebar: avatar+lightbox, suggestions, socials, settings popover
│       ├── MessageBubble.tsx             # One message + the hand-written Markdown renderer + trigger-token handling
│       ├── ContactForm.tsx               # Inline bilingual contact form (rendered by MessageBubble)
│       ├── CalendarButton.tsx            # Inline Cal.com booking card (rendered by MessageBubble)
│       ├── ExportButton.tsx              # Builds a print-ready HTML transcript and opens the print dialog
│       └── AdminShell.tsx                # Admin chrome: collapsible sidebar nav + logout
│
├── lib/
│   ├── detectLanguage.ts                 # Heuristic FR/EN detector — used on BOTH server and client
│   ├── db/
│   │   ├── schema.ts                     # Drizzle table definitions + inferred types (source of truth)
│   │   ├── index.ts                      # Exports a `db` instance — currently imported by nothing (see §10)
│   │   └── helpers.ts                    # Exports its OWN `db` + session/message logging + Resend notification
│   └── rag/
│       ├── embed.ts                      # embedQuery() — Voyage AI, input_type "query"
│       ├── retrieve.ts                   # retrieveRelevantChunks() — pgvector cosine search, TOP_K = 4
│       └── systemPrompt.ts               # buildSystemPrompt() + getConfidenceLevel()
│
├── knowledge-base/                       # Source of truth for everything the agent says (10 .md files)
│   ├── about.md  availability.md  contact.md  education.md  experience.md
│   └── faq.md  features.md  projects.md  resume.md  skills.md
│
├── scripts/
│   ├── ingest.ts                         # CLI: read → chunk → embed → clear+insert (npm run ingest)
│   └── test-db.ts                        # CLI: DB connectivity/insert diagnostic (npm run test-db)
│
├── drizzle/
│   ├── 0000_fine_nightmare.sql           # The only migration: 3 tables + HNSW index
│   └── meta/ (0000_snapshot.json, _journal.json)
│
├── public/
│   ├── riad-photo.png                    # Avatar (sidebar + mobile header + lightbox)
│   ├── resume-en.pdf / resume-fr.pdf     # Linked by the agent per detected language
│   ├── riad.vcf                          # Contact card — not referenced by any code or KB file
│   └── file.svg globe.svg next.svg vercel.svg window.svg   # Next.js defaults, unused
│
├── middleware.ts                         # Admin route guard + chat rate limiting (fail-open)
├── next.config.ts                        # Empty config object
├── drizzle.config.ts                     # schema → ./lib/db/schema.ts, out → ./drizzle, postgresql
├── postcss.config.mjs                    # @tailwindcss/postcss only
├── eslint.config.mjs                     # next/core-web-vitals + next/typescript
├── tsconfig.json                         # strict; "@/*" → "./*"
├── AGENTS.md                             # "This is NOT the Next.js you know" version warning
├── CLAUDE.md                             # Project notes — predates the admin/contact/calendar work (see §10)
└── README.md                             # Public-facing project README
```

---

## 3. Request Lifecycle

A full trace of one chat message, naming real files and functions.

### 3.1 Client → server

1. **`app/components/ChatInterface.tsx` → `sendMessage(content)`** (line ~267). Optimistically appends
   the user message *and* an empty assistant placeholder (`isStreaming: true`) to `messages`, clears
   the input, sets `isLoading`.
2. Builds `history` from `[...messages, userMessage]` mapped down to `{ role, content }` — the full
   conversation, which is what gives the agent memory.
3. `POST /api/chat` with `{ messages: history, sessionId: sessionIdRef.current }`, under an
   `AbortController` held in `abortRef`.

### 3.2 Middleware

4. **`middleware.ts`** matches `/api/chat` (matcher: `["/admin/:path*", "/api/chat"]`).
   - In development → `NextResponse.next()` immediately.
   - If the limiter is null (missing Upstash credentials, or construction threw) → allow.
   - Otherwise resolves the IP from `x-forwarded-for` (first entry) or `x-real-ip`, falling back to
     `127.0.0.1`, and calls `ratelimit.limit(ip)` — sliding window, **10 per 1 h**, key prefix
     `portfolio:ratelimit`.
   - Over limit → `429` JSON carrying both `message` (EN) and `message_fr` (FR), plus
     `X-RateLimit-*` and `Retry-After` headers.
   - Any thrown error → logged and **allowed through** (fail-open).
   - Under limit → `NextResponse.next()` with `X-RateLimit-Limit / -Remaining / -Reset`.

### 3.3 Route handler — `app/api/chat/route.ts`

5. **Validation.** Rejects a missing/empty `messages` array (400), a missing or non-string `sessionId`
   (400), and a final message whose role is not `user` (400).
6. **Language.** `detectLanguage(userQuery)` → `"fr" | "en"` (`lib/detectLanguage.ts`).
7. **Session + logging.** `getOrCreateSession(sessionId, language)` returns `true` on first sight;
   `logMessage({ sessionId, role: "user", ... })` persists the question. Both in `lib/db/helpers.ts`.
8. **Notification.** If the session is new, `sendNewSessionNotification(...)` is invoked **without
   `await`**, with a `.catch()` attached, so the email never blocks or breaks the answer.
9. **Contextual query.** The last three user messages are collected; if there is more than one, the
   embedded string becomes `"<older user msgs> <current> <current>"` — repeating the current query so
   it dominates the vector.
10. **Embed → retrieve → score → prompt.**
    `embedQuery(contextualQuery)` → `retrieveRelevantChunks(embedding)` → `getConfidenceLevel(chunks)`
    → `buildSystemPrompt(chunks, language)`.
11. **Stream.** A `ReadableStream` is constructed; inside `start(controller)` the handler calls
    `anthropic.messages.stream({ model: "claude-haiku-4-5", max_tokens: 2048, system, messages })`
    and iterates the events.

### 3.4 The wire protocol (as actually implemented)

Newline-delimited, prefix-tagged frames written as `text/plain; charset=utf-8`. The response also
carries `X-Vercel-AI-Data-Stream: v1` and `X-Language: <fr|en>`, but the body is a **hand-rolled
superset** of the AI SDK format — `c:`, `l:`, and `f:` are this project's own extensions.

| Frame | Emitted when | Payload | Client handling |
|---|---|---|---|
| `0:<json string>\n` | On every `content_block_delta` of type `text_delta` | The text delta, JSON-encoded | Appended to `accumulated`; message re-rendered each chunk |
| `d:{"finishReason":"stop"}\n` | Immediately after the model stream ends | Literal string | **Ignored** — the reader's `done` flag ends the loop |
| `c:<json>\n` | After `d:` | `"high" \| "medium" \| "low"` | Sets `message.confidence` |
| `l:<json>\n` | After `c:` | `"fr" \| "en"` | Sets `message.language` and `conversationLanguage` |
| `f:<json>\n` | Last, only if generation succeeded and returned 3 items | `string[]` | Sets `message.followUps` |

**Ordering note:** `d:` is *not* the terminal frame — `c:`, `l:`, and `f:` follow it. Any future
client must not treat `d:` as end-of-stream.

Between `d:` and `f:` the handler also awaits `claudeStream.finalMessage()`, sums
`usage.input_tokens + usage.output_tokens`, and calls `logMessage({ role: "assistant", ...,
tokensUsed })` — so token accounting happens inside the stream, before the connection closes.

### 3.5 Follow-up generation

`generateFollowUps(userQuery, agentResponse, language)` (same file, line ~19) makes a **second,
non-streaming** Claude call (`max_tokens: 150`) with a language-specific prompt asking for a JSON
array of exactly three short questions. It strips ```` ```json ```` fences, `JSON.parse`s, and
requires `Array.isArray(parsed) && parsed.length === 3`. Any throw returns `[]` and nothing is sent.

### 3.6 Server → client rendering

12. **`ChatInterface.tsx`** reads `response.body.getReader()`, decodes with
    `TextDecoder({ stream: true })`, splits on `\n`, and dispatches on the prefix. Each `0:` frame
    triggers a `setMessages` update, producing token-by-token rendering. Every branch's `JSON.parse`
    is wrapped in `try {} catch {}` so a malformed frame is skipped, not fatal.
13. A `429` is intercepted **before** stream reading and rendered as the assistant message text,
    choosing `message_fr` or `message` by `conversationLanguage`.
14. On any other failure, the placeholder is replaced with a localized error string, using
    `conversationLanguage` or, on a first message, `detectLanguage(content)` client-side.
15. When the reader reports `done`, `isStreaming` is cleared on the assistant message.
16. **`MessageBubble.tsx`** renders it: detects and strips `[SHOW_CONTACT_FORM]` / `[SHOW_CALENDAR]`,
    passes the cleaned text to the internal `MarkdownRenderer`, shows the blinking `▊` while
    streaming, then — once streaming ends — the confidence badge (medium/low only), the follow-up
    chips, `<ContactForm>`, and `<CalendarButton>` as applicable.
17. A `useEffect` on `messages` writes `{ messages, savedAt, sessionId }` to `localStorage` under
    `portfolio_last_messages`, with `isStreaming` forced false on every entry.

---

## 4. RAG Pipeline

### 4.1 Ingestion — `scripts/ingest.ts` (offline, `npm run ingest`)

Loads `.env.local` via `dotenv` and hard-fails if `DATABASE_URL` or `VOYAGE_API_KEY` is missing.

1. **`readKbFiles()`** — reads every `.md` in `knowledge-base/`; `sourceFile` is the filename minus
   `.md` (e.g. `"skills"`).
2. **`chunkText(text, sourceFile)`** — splits on whitespace; `CHUNK_SIZE = 400` words per chunk with
   `CHUNK_OVERLAP = 50` (stride = 350). Chunks are indexed from 0 per file.
3. **`embedChunks(texts)`** — POSTs to `https://api.voyageai.com/v1/embeddings` with
   `model: "voyage-3"`, **`input_type: "document"`**, in batches of 64 with a 200 ms pause between
   batches. Validates the response shape and coerces every value with `Number()`.
4. **`clearAndInsert(chunks)`** — deletes existing rows per distinct `sourceFile`, then inserts
   **one row at a time**. Before each insert it asserts `embedding.length === 1024` and rejects NaN.
   The first failure throws, naming the exact `sourceFile[chunkIndex]`.

The per-row insert is deliberate: it trades speed for exact failure attribution. Do not replace it
with a bulk insert without preserving equivalent error isolation.

### 4.2 Query embedding — `lib/rag/embed.ts`

`embedQuery(query)` POSTs the same endpoint with **`input_type: "query"`** and validates that the
returned array is exactly 1024 long. The document/query asymmetry is intentional — Voyage is trained
for asymmetric search, and mixing the two degrades retrieval. **Any change to model, dimensions, or
`input_type` here must be mirrored in `scripts/ingest.ts` and in the `vector(1024)` column**, followed
by a full re-ingestion; otherwise queries and documents silently occupy different vector spaces.

### 4.3 Similarity search — `lib/rag/retrieve.ts`

```sql
SELECT content, source_file, chunk_index,
       1 - (embedding <=> $vector::vector) AS similarity
FROM kb_chunks
ORDER BY embedding <=> $vector::vector
LIMIT 4
```

- `TOP_K = 4`, module-level constant.
- The embedding is serialised to a pgvector literal, `[0.1,0.2,...]`, and passed as a parameter —
  pgvector will not accept a JS array.
- `<=>` is cosine distance; `similarity = 1 - distance`, so 1.0 is a perfect match.
- Returns typed `RetrievedChunk[]` (`{ content, sourceFile, chunkIndex, similarity }`), ordered most
  similar first.
- **There is no similarity threshold and no filtering.** All four chunks are always returned and
  always injected; a weak match is handled by lowering *confidence*, not by dropping the chunk.
- This module opens its **own** Neon connection per call rather than importing a shared `db`.

### 4.4 Confidence scoring — `lib/rag/systemPrompt.ts`

```ts
const HIGH_CONFIDENCE = 0.78;
const LOW_CONFIDENCE  = 0.65;
```

`getConfidenceLevel(chunks)` reads **only `chunks[0].similarity`** (the top chunk): `>= 0.78` →
`"high"`, `>= 0.65` → `"medium"`, otherwise `"low"`; an empty result is `"low"`. The same value is
both injected into the prompt and streamed to the client as the `c:` frame.

### 4.5 System prompt assembly — `lib/rag/systemPrompt.ts`

`buildSystemPrompt(chunks, language)` composes, in order:

1. **Role** — "You are an AI assistant representing Riad Sacroud, a junior full-stack software
   engineer based in France."
2. **LANGUAGE RULE** — the FR or EN "respond ONLY in …" instruction.
3. **CONTACT FORM** — instructs the model to emit `[SHOW_CONTACT_FORM]` on its own line at the end of
   contact-related answers, with example triggers in both languages.
4. **CALENDAR BOOKING** — same for `[SHOW_CALENDAR]`; both tokens may appear together.
5. **RESUME / CV** — `/resume-fr.pdf` for French, `/resume-en.pdf` for English, both if unsure. These
   paths must stay in sync with the files in `public/`.
6. **CONFIDENCE LEVEL** — the level, the top score as a percentage, and a level-specific instruction
   (answer confidently / acknowledge uncertainty / explicit anti-invention warning quoting the score).
7. **BEHAVIOR RULES** — context-only answering, the `sacroudr@gmail.com` fallback sentence, tone,
   fluid prose (with an explicit note against stiff literal-translation French), third person,
   concision, direct answers on salary/availability/location, never invent.
8. **CONTEXT ABOUT RIAD** — each chunk as
   `--- Source: <sourceFile> (relevance: NN%) ---\n<content>`, blank-line separated.

Editing this file changes the agent's persona and its guardrails — treat it as product surface, not
plumbing.

---

## 5. Data Model

Defined in `lib/db/schema.ts`; created by `drizzle/0000_fine_nightmare.sql`.

### `kb_chunks` — the vector store (written only by `scripts/ingest.ts`)

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | Row id |
| `content` | `text` | NOT NULL | The chunk text the LLM reads |
| `source_file` | `text` | NOT NULL | Source `.md` filename without extension |
| `chunk_index` | `integer` | NOT NULL | 0-indexed position within that file |
| `embedding` | `vector(1024)` | NOT NULL | Voyage `voyage-3` embedding |
| `created_at` | `timestamp` | NOT NULL, `now()` | Ingestion time |

**Index** — `kb_chunks_embedding_idx`, `USING hnsw ("embedding" vector_cosine_ops)`. Declared in
Drizzle as `index(...).using("hnsw", table.embedding.op("vector_cosine_ops"))` and used implicitly by
the `<=>` operator.

The 1024 dimension is a hard contract with `voyage-3`. `voyage-3-lite` emits 512 and is incompatible.
(The inline comment on the column mistakenly says "voyage-3-lite"; the actual model everywhere in the
code is `voyage-3`.)

### `chat_sessions` — one row per visitor conversation

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | Row id |
| `session_id` | `text` | NOT NULL, **UNIQUE** | Browser-generated identifier (no auth) |
| `language` | `text` enum `"fr" \| "en"` | NOT NULL, default `"en"` | Language detected on the first message |
| `created_at` | `timestamp` | NOT NULL, `now()` | Session start |
| `updated_at` | `timestamp` | NOT NULL, `now()` | Present in schema; **never written after insert** |

### `chat_messages` — every turn, both roles

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | Row id |
| `session_id` | `text` | NOT NULL, FK → `chat_sessions.session_id`, `ON DELETE CASCADE` | Owning session |
| `role` | `text` enum `"user" \| "assistant"` | NOT NULL | Author |
| `content` | `text` | NOT NULL | Raw message text (trigger tokens included, as generated) |
| `language` | `text` enum `"fr" \| "en"` | NOT NULL, default `"en"` | Language of this turn |
| `tokens_used` | `integer` | default `0` | Input+output tokens; set on assistant rows only |
| `created_at` | `timestamp` | NOT NULL, `now()` | Insert time |

### Relationships

`chat_sessions 1 ─── N chat_messages`, joined on the **text `session_id`**, not the uuid PK — the FK
targets the unique `session_id` column so the browser-issued string is the join key end to end.
`kb_chunks` is standalone with no relations.

**Migration drift:** `tokens_used` exists in `schema.ts` but **not** in
`drizzle/0000_fine_nightmare.sql`, and `_journal.json` lists only that one migration — so the column
reached the live database by some out-of-band path (`drizzle-kit push` or manual DDL). A fresh
`drizzle-kit migrate` against an empty database would produce a schema without it.

---

## 6. Key Modules & Their Responsibilities

### `lib/`

| Module | Owns |
|---|---|
| `lib/db/schema.ts` | The single source of truth for tables, columns, the HNSW index, and the inferred types (`KbChunk`, `NewChatMessage`, …). Import types from here rather than redeclaring them. |
| `lib/db/helpers.ts` | Its own Neon-backed `db` **plus** `getOrCreateSession()` (returns `true` when newly created), `logMessage()`, and `sendNewSessionNotification()`. In practice this is the `db` the app imports. |
| `lib/db/index.ts` | Exports a schema-aware `db` and throws at import time if `DATABASE_URL` is unset. **Currently imported by nothing** — the intended canonical client that lost the race to `helpers.ts`. |
| `lib/rag/embed.ts` | Query-side embedding only. Owns the Voyage endpoint, model name, `input_type: "query"`, and the 1024-dim assertion. |
| `lib/rag/retrieve.ts` | The pgvector search: `TOP_K`, the `<=>` SQL, the vector-literal format, the distance→similarity conversion, and the `RetrievedChunk` interface. |
| `lib/rag/systemPrompt.ts` | The agent's persona, guardrails, trigger-token instructions, resume paths, confidence thresholds, and context-block formatting. |
| `lib/detectLanguage.ts` | The FR/EN heuristic — marker list, accent counting, tokenisation on whitespace/hyphen/apostrophe. Isomorphic: imported by both the route handler and `ChatInterface.tsx`. |

### `app/api/`

| Route | Owns |
|---|---|
| `chat/route.ts` | Request validation, session/message logging, contextual-query construction, RAG orchestration, the `ReadableStream` and its five frame types, token accounting, and `generateFollowUps()`. Declares `runtime = "nodejs"` and `maxDuration = 30`. |
| `contact/route.ts` | Contact-form validation (non-empty fields, email regex), the Resend call with `reply_to`, and the dark-themed HTML email template. |
| `admin/login/route.ts` | Password comparison and setting the `admin_token` cookie (httpOnly, `sameSite: "strict"`, `secure` in production, 7-day `maxAge`). |
| `admin/logout/route.tsx` | Deletes the cookie. |
| `admin/sessions/route.ts` | Sessions + all messages fetched in parallel, then grouped in memory into `{ messageCount, firstMessage }` — the explicit N+1 avoidance. |
| `admin/sessions/[sessionId]/messages/route.ts` | One session's messages, ordered by `createdAt`. Uses the Next.js 16 **async `params`** signature. |
| `admin/analytics/route.ts` | All aggregation in application code: totals, language splits, top questions, top *first* questions, 14-day activity buckets, and the `UNANSWERED_SIGNALS` phrase matcher with dedup. |
| `admin/usage/route.ts` | Token totals, `COST_PER_1K_TOKENS = 0.00025` cost estimate, average per session, per-session breakdown. Returns `totalInputTokens`/`totalOutputTokens` as literal `0`. |

### `app/components/`

| Component | Owns |
|---|---|
| `ChatInterface.tsx` | The application's state hub: `messages`, `input`, `isLoading`, `isMobile`, `isListening`, `speechSupported`, `conversationLanguage`, `theme`; the session id and abort refs; the stream reader and frame dispatch; localStorage persistence and 24-hour restore; theme toggle; Web Speech setup; near-bottom-only autoscroll; textarea autogrow; desktop/mobile headers; the input dock and status line. |
| `MessageBubble.tsx` | Rendering one message, **and** the exported `Message` interface used across the app. Owns trigger-token detection/stripping, the confidence badge, follow-up chips, and mounting `ContactForm`/`CalendarButton`. Contains `MarkdownRenderer` (block-level state machine) and `renderInline` (one big alternation regex for bold/italic/code/markdown-links/URLs/emails/bare domains/PDF paths/phone numbers). |
| `LeftPanel.tsx` | Desktop-only sidebar: avatar with a `createPortal` lightbox (Escape to close, `mounted` guard for SSR), "Open to work" badge, the six `SUGGESTED_QUESTIONS`, social links, and the settings popover holding the theme toggle with click-outside dismissal. |
| `ContactForm.tsx` | Its own field state and `idle → sending → success/error` machine, the bilingual `LABELS` map, and the `POST /api/contact` call. Renders a success panel in place of the form. |
| `CalendarButton.tsx` | The Cal.com URL constant and the bilingual booking card. Purely presentational. |
| `ExportButton.tsx` | Builds the standalone print document (its own inline CSS and Google Fonts import), strips trigger tokens, drops empty messages, `escapeHtml()`s all content, then `window.open` → `document.write` → `print()` → `close()`. |
| `AdminShell.tsx` | Admin chrome: `NAV_ITEMS` with inline SVG icons, active-route highlighting via `usePathname()`, collapse toggle (220px ↔ 52px), and logout (`POST /api/admin/logout` then hard navigation to `/admin`). |
| `WelcomePage.tsx` | The splash: word-by-word quote reveal, staggered meta/CTA, ambient drifting blobs, and a 600 ms exit fade before calling `onEnter`. Lines 1–236 are a **commented-out earlier version**; the live component starts at line 238. |

### `scripts/`

| Script | Owns |
|---|---|
| `ingest.ts` | Chunking constants, the document-side Voyage call, and the clear+insert strategy. The only writer to `kb_chunks`. |
| `test-db.ts` | Connectivity diagnostic: env check → `SELECT 1` → row count → dummy insert → verify. **Leaves a `"TEST CHUNK — delete me"` row behind**; re-run `npm run ingest` afterwards. |

---

## 7. Conventions & Patterns

New code must match these. They are inferred from what the codebase actually does, not aspiration.

### 7.1 Styling: inline styles + CSS custom properties, never utility classes

There are **no Tailwind utility classes in any component**. Every visual value is an inline `style`
object referencing a token from `app/globals.css`:

```tsx
<div style={{
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-strong)",
  borderRadius: "var(--radius)",
  padding: "var(--space-4)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
}} />
```

The token families in `globals.css`:

- **Surfaces** — `--bg-base`, `--bg-elevated`, `--bg-subtle`, `--border`, `--border-strong`
- **Accent** — `--accent-rgb` (the single source), then `--accent`, `--accent-dim`, `--accent-glow`,
  `--accent-border` derived from it
- **Text** — `--text-primary`, `--text-secondary`, `--text-muted` (documented as AA-verified)
- **Status** — `--green*`, `--amber*`, `--red*`, each following the same `-rgb / base / -dim /
  -border` pattern
- **Elevation / overlay** — `--shadow-sm|md|lg`, `--scrim`, `--on-scrim`
- **Type scale** — `--text-2xs` (11px) → `--text-2xl` (24px)
- **Spacing** — `--space-1` (4px) → `--space-8` (64px), on a 4px grid
- **Radius** — `--radius`, `--radius-sm`, `--radius-pill`
- **Motion** — `--dur-fast|base|slow`, `--ease`, `--ease-inout`
- **Layout** — `--panel-width`, `--reading-max` (68ch)
- **Fonts** — `--font-display` (DM Serif Display), `--font-mono` (JetBrains Mono), `--font-body` (Outfit)

**Theming** is a `.light` class on `:root`, toggled by `document.documentElement.classList` in
`ChatInterface.tsx`. Light mode redefines only the theme-dependent tokens — never add a hard-coded
colour that cannot follow the theme. A global `*` transition on background/color/border-color makes
the swap smooth.

**Interaction states** are JS event handlers mutating `e.currentTarget.style` (`onMouseEnter` /
`onMouseLeave` / `onMouseDown` / `onMouseUp`), since there are no `:hover` rules for components.
Hover state that must drive a *sibling* uses local `useState` (`hoveredChip`, `hoveredRow`,
`hoveredMsg`).

**Animations** live in `globals.css` as keyframes (`fadeUp`, `fadeIn`, `slideInLeft`, `pulse-glow`,
`blink`, `typing-dot`, `pulse-record`, `blob-drift-1|2|3`, `skeleton-pulse`, `bar-grow`) and are
applied either via the `animate-fade-up` / `animate-slide-left` + `delay-N` utility classes or via an
inline `animation:` string.

**Bilingual copy** lives in a component-local `LABELS = { en: {...}, fr: {...} }` object indexed by a
`language` prop (`ContactForm.tsx`, `CalendarButton.tsx`, `ExportButton.tsx`). Short strings use an
inline ternary on `conversationLanguage`.

### 7.2 Naming and file placement

- Components: `PascalCase.tsx`, default export, always in `app/components/` — there is no top-level
  `components/` directory.
- Route handlers: `app/api/<segment>/route.ts`, exporting `GET` / `POST`.
- Pages: `app/<segment>/page.tsx`.
- lib modules: `camelCase.ts`, named exports (`embedQuery`, `retrieveRelevantChunks`,
  `buildSystemPrompt`, `detectLanguage`).
- Module-level tuning constants are `SCREAMING_SNAKE_CASE` at the top of the file (`TOP_K`,
  `CHUNK_SIZE`, `HIGH_CONFIDENCE`, `COST_PER_1K_TOKENS`, `CAL_URL`, `SUGGESTED_QUESTIONS`).
- Imports use the `@/` alias for cross-directory paths (`@/lib/rag/embed`), relative paths within a
  directory (`./MessageBubble`).
- Section banners are a repeated house style:
  `// ---------------------------------------------------` with a heading, and `{/* ── Label ── */}`
  in JSX.

### 7.3 API response shapes and error handling

- **Success:** the payload as bare JSON (an object or an array) with `Content-Type: application/json`.
  Simple acks are `{ ok: true }`.
- **Error:** `{ error: string }` with the status code. Rate limiting additionally carries
  `{ error: "rate_limit_exceeded", message, message_fr, reset, remaining }`.
- Handlers wrap their body in `try/catch`, log with a bracketed tag (`console.error("[/api/chat]
  Error:", err)`), and return a JSON 500 — never an unhandled throw.
- Unknown errors are narrowed with `err instanceof Error ? err.message : String(err)`.
- `/api/contact` deliberately returns a **generic** message to the client while logging the real cause.
- Admin endpoints each open with `if (!await isAuthenticated()) return 401`. `isAuthenticated()` is
  currently duplicated verbatim in all four admin data routes.
- Non-critical side effects are fire-and-forget with an attached `.catch()` — never awaited.
- Responses are constructed with the Web `Response` / `new Response(...)`, not `NextResponse.json()`
  (except inside `middleware.ts`, which uses `NextResponse.next()` / `.redirect()`).

### 7.4 The trigger-token system

The agent embeds bare tokens in its answer; the client turns them into UI. This is the established
way to attach an interactive component to an answer.

1. `lib/rag/systemPrompt.ts` instructs the model to emit `[SHOW_CONTACT_FORM]` and/or
   `[SHOW_CALENDAR]` on their own line at the **end** of a qualifying answer, listing example triggers
   in both languages.
2. `MessageBubble.tsx` tests `message.content.includes("[SHOW_CONTACT_FORM]")` /
   `("[SHOW_CALENDAR]")`, then strips **both** tokens with a global regex and `.trim()`s before
   rendering.
3. The component mounts only once `!message.isStreaming`, so a half-written token never flashes.
4. The language passed down is `message.language || "en"` — the value delivered by the `l:` frame.
5. `ExportButton.tsx` strips the same two tokens independently before building the PDF.

**To add a third interactive component:** add the instruction to the system prompt, add the
`includes` check and the strip in `MessageBubble.tsx`, **and** add the strip to `ExportButton.tsx`.
Note that the raw token is stored in `chat_messages.content` as generated — stripping is a render-time
concern only.

### 7.5 Browser storage keys

| Key | Store | Shape | Purpose |
|---|---|---|---|
| `portfolio_session_id` | `sessionStorage` | `session_<timestamp>_<random7>` | The active session id, per tab |
| `portfolio_last_messages` | `localStorage` | `{ messages: Message[], savedAt: number, sessionId: string }` | 24-hour conversation restore that survives tab/browser close |
| `ai-portfolio-theme` | `localStorage` | `"light" \| "dark"` | Theme preference; absent → follow `prefers-color-scheme` |
| `admin_token` | cookie (httpOnly) | the admin password value | Admin session, 7 days |

Conventions: prefix app keys with `portfolio_`; wrap **every** storage access in `try/catch` and
degrade silently; on restore, force `isStreaming: false` on every message and adopt the stored
`sessionId` so the server-side session continues. "New chat" writes a fresh `portfolio_session_id`,
removes `portfolio_last_messages`, and clears `messages`.

### 7.6 TypeScript conventions

- `strict: true`. No `any` in application code; unknowns are typed `unknown` and narrowed.
- **Shared UI types live next to their primary consumer and are exported from it** — `Message` is
  exported from `app/components/MessageBubble.tsx` and imported by `ChatInterface.tsx` and
  `ExportButton.tsx`. There is no `types/` directory.
- Server-side domain types are exported from the module that produces them (`RetrievedChunk` from
  `lib/rag/retrieve.ts`, `ConfidenceLevel` from `lib/rag/systemPrompt.ts`).
- Database types come from Drizzle inference (`typeof table.$inferSelect` / `$inferInsert`) — never
  hand-written.
- Admin pages declare a **local `interface`** for the API payload they consume (`Session`, `Message`,
  `UsageData`, `AnalyticsData`); these are intentionally page-local response contracts.
- Props interfaces are named `<Component>Props` and declared directly above the component.
- The union `"fr" | "en"` is written inline everywhere rather than aliased.
- Environment variables are asserted non-null at the point of use (`process.env.X!`) where the module
  cannot function without them.
- Browser APIs missing from `lib.dom` are typed locally rather than pulled in as a dependency — see
  the `SpeechRecognition*Like` interfaces at the top of `ChatInterface.tsx`.
- Inline `eslint-disable-next-line` is used narrowly and with a reason (`react-hooks/set-state-in-effect`,
  `@next/next/no-img-element`).

### 7.7 Next.js 16 specifics already established

- **Dynamic route `params` are a Promise** and must be awaited:
  `{ params }: { params: Promise<{ sessionId: string }> }` then `const { sessionId } = await params;`
  (`app/api/admin/sessions/[sessionId]/messages/route.ts:13-21`).
- **`cookies()` is async** — `const cookieStore = await cookies();` before `.get()` / `.set()` /
  `.delete()`.
- **Middleware is a single root `middleware.ts`** exporting `middleware()` and a `config.matcher`
  array. It runs on the Edge runtime, which is why the limiter is constructed lazily inside a
  `try/catch` at module scope.
- **The chat route opts out of Edge**: `export const runtime = "nodejs"` with
  `export const maxDuration = 30`.
- **Fonts are loaded via CSS `@import` in `globals.css`**, not `next/font`. `app/layout.tsx` sets
  metadata and OpenGraph only.
- **Images use plain `<img>`** with an inline eslint disable rather than `next/image`.
- **Client components everywhere**: any component using state, effects, or browser APIs starts with
  `"use client"` — which in this codebase is all of them.

---

## 8. Environment Variables

All are read from `.env.local` locally (gitignored via `.env*`) and from Vercel project settings in
production. Never log or echo their values.

| Variable | Purpose | Read by |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled, `sslmode=require`) | `lib/db/helpers.ts:6`, `lib/db/index.ts:7,11`, `lib/rag/retrieve.ts:21`, `scripts/ingest.ts:23,26`, `scripts/test-db.ts:15,21,23`, `drizzle.config.ts:13` |
| `VOYAGE_API_KEY` | Authenticates embedding requests to `api.voyageai.com` | `lib/rag/embed.ts:14`, `scripts/ingest.ts:24,84` |
| `ANTHROPIC_API_KEY` | Authenticates Claude streaming and follow-up generation | `app/api/chat/route.ts:13` |
| `ADMIN_PASSWORD` | The admin password **and** the literal value stored in the `admin_token` cookie | `middleware.ts:41`, `app/api/admin/login/route.ts:7,15`, `app/api/admin/sessions/route.ts:9`, `app/api/admin/sessions/[sessionId]/messages/route.ts:10`, `app/api/admin/analytics/route.ts:8`, `app/api/admin/usage/route.ts:9` |
| `RESEND_API_KEY` | Authenticates email delivery via `api.resend.com` | `app/api/contact/route.ts:22,35`, `lib/db/helpers.ts:77,91` |
| `CONTACT_EMAIL` | Destination inbox for contact-form messages and new-session alerts | `app/api/contact/route.ts:26,39`, `lib/db/helpers.ts:77,95` |
| `UPSTASH_REDIS_REST_URL` | Upstash endpoint; presence gates limiter construction | `middleware.ts:13` (and `Redis.fromEnv()`) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash auth token; presence gates limiter construction | `middleware.ts:14` (and `Redis.fromEnv()`) |
| `NODE_ENV` | Dev bypass for rate limiting; `secure` flag on the admin cookie | `middleware.ts:53`, `app/api/admin/login/route.ts:17` |

**Required for the app to answer at all:** `DATABASE_URL`, `VOYAGE_API_KEY`, `ANTHROPIC_API_KEY`.
**Optional, feature-gated:** Resend pair (email), Upstash pair (rate limiting), `ADMIN_PASSWORD`
(admin area). Missing optional values disable their feature without breaking the chat — except
`ADMIN_PASSWORD`, whose absence makes `token?.value === undefined` comparisons behave unpredictably;
set it in every environment where `/admin` is reachable.

There is **no `.env.example`** in the repository; `README.md` §"Environment variables" carries the
template.

---

## 9. Deployment

**Target:** Vercel (Next.js app + serverless functions + Edge middleware). Per `README.md`:

1. Push to GitHub, import the repo in Vercel.
2. Add every variable from `.env.local` under Project → Settings → Environment Variables.
3. Deploy, then run `npm run ingest` **once from a local machine pointed at the production
   `DATABASE_URL`** to populate the vector store. Ingestion is never triggered by the deployed app.

**Build:** `npm run build` (`next build`). `npm run dev` runs with
`NODE_OPTIONS='--max-old-space-size=4096'`; `npm run start` serves a production build locally.

**Vercel-specific configuration:** there is **no `vercel.json`**, and `next.config.ts` is an empty
config object. The only platform-facing declarations are in the chat route itself:
`export const runtime = "nodejs"` and `export const maxDuration = 30`, which keep the streaming
handler off the Edge runtime and inside the 30-second execution budget.

**Cron jobs:** none. No `vercel.json` crons, no scheduled route, no background job.

### Operational gotchas

- **Upstash free-tier archival.** Free Upstash databases are archived after prolonged inactivity, so
  `ratelimit.limit()` starts throwing on a portfolio that goes quiet. `middleware.ts` handles this in
  two places: limiter construction is wrapped in `try/catch` (leaving `ratelimit = null`), and the
  limit check itself catches, logs `"[middleware] Rate limit check failed, allowing request"`, and
  returns `NextResponse.next()`. **Fail-open is deliberate** — the chat must keep working when the
  limiter is down. The trade-off is that an archived Redis means effectively unlimited chat.
- **Rate limiting is bypassed entirely when `NODE_ENV === "development"`**, so local testing never
  exercises this path. Verify limiter changes against a production-like build.
- **`/api/contact` is outside the middleware matcher** (`["/admin/:path*", "/api/chat"]`) and is
  therefore unlimited and unauthenticated.
- **Cold starts** affect the first request after idle: Neon HTTP connection, Voyage call, and Anthropic
  stream setup all happen serially before the first token.
- **Emails send from `onboarding@resend.dev`**, Resend's shared sandbox sender, in both
  `app/api/contact/route.ts:38` and `lib/db/helpers.ts:95` — no verified custom domain is configured.
- **Editing the knowledge base requires a re-ingest**, not a redeploy; conversely a redeploy does not
  refresh the knowledge base.
- **`npm run test-db` writes a dummy row** into the production table if pointed at production.

---

## 10. Known Technical Debt

Documented factually, from what the code shows.

1. **Three separate database connections.** `lib/db/index.ts` exports a schema-aware `db` that
   **nothing imports**; `lib/db/helpers.ts` creates its own and is what the app actually uses;
   `lib/rag/retrieve.ts` opens a fresh Neon connection **on every call** inside
   `retrieveRelevantChunks()`. The intended single client lost out to the one that shipped.

2. **Migration drift on `tokens_used`.** The column is in `lib/db/schema.ts` but absent from
   `drizzle/0000_fine_nightmare.sql`, and `_journal.json` has only that one entry. Provisioning a new
   environment from the migrations alone yields a schema the token-logging code expects but does not
   find.

3. **Tailwind is wired up but produces nothing.** `postcss.config.mjs` loads `@tailwindcss/postcss`
   and `tailwindcss` is a dependency, but `app/globals.css` never imports `tailwindcss` — so no
   utilities are generated, and the `h-full antialiased` / `min-h-full flex flex-col` classes in
   `app/layout.tsx:31-32` are inert. The layout's sizing works because `globals.css` sets
   `html, body { height: 100%; overflow: hidden; }` directly.

4. **`isAuthenticated()` is duplicated four times**, verbatim, across
   `app/api/admin/{sessions,sessions/[sessionId]/messages,analytics,usage}/route.ts`. A fifth admin
   route would copy it again.

5. **The admin cookie's value is the password itself.** `login/route.ts:15` stores
   `process.env.ADMIN_PASSWORD` as the cookie value and every guard compares
   `token?.value === process.env.ADMIN_PASSWORD` — no signing, no session token, no expiry beyond the
   cookie's own `maxAge`, and no rate limiting on login attempts. It is httpOnly and `sameSite:
   strict`, so it is not readable from JS, but the secret is transported verbatim on every request.

6. **`app/api/admin/logout/route.tsx` uses a `.tsx` extension** for a route handler containing no JSX
   — inconsistent with every other route file.

7. **236 lines of commented-out code at the top of `app/components/WelcomePage.tsx`** — a previous
   version of the component, retained above the live implementation that starts at line 238.

8. **Analytics aggregate entirely in application memory.** `admin/analytics/route.ts` and
   `admin/usage/route.ts` `SELECT` **all** sessions and **all** messages, then compute totals, group,
   and sort in JS. `usage/route.ts` additionally does a `.filter()` over all messages inside a `.map()`
   over all sessions — O(sessions × messages). Fine at portfolio scale, linear-to-quadratic beyond it.

9. **Unanswered-question detection is phrase matching.** `UNANSWERED_SIGNALS` is a hand-maintained
   list of ~19 substrings; a reworded fallback in `systemPrompt.ts` silently stops being detected, and
   an answer legitimately containing "contact riad directly" is a false positive.

10. **Token accounting is coarse.** Input and output tokens are summed before storage, so
    `admin/usage/route.ts` returns `totalInputTokens: 0` and `totalOutputTokens: 0` with a
    `// tracked together for now` comment, and cost uses one blended rate (`COST_PER_1K_TOKENS =
    0.00025`) for both directions. Follow-up-generation tokens are not counted at all — that second
    Claude call's usage is never read.

11. **`chat_sessions.updated_at` is dead.** It is declared and defaulted but never written after
    insert, so it always equals `created_at`.

12. **The follow-up call doubles Anthropic round-trips per message** and holds the response stream
    open while it runs — the connection cannot close until follow-ups resolve or fail.

13. **Language detection logic is duplicated and divergent.** `ChatInterface.tsx:210-216` has its own
    inline French word list for choosing the speech-recognition locale, separate from (and shorter
    than) the list in `lib/detectLanguage.ts`, which the same file already imports.

14. **`renderInline()` in `MessageBubble.tsx` is one ~200-character alternation regex** covering
    markdown links, bold, italic, code, URLs, emails, bare domains, PDF paths, and phone numbers, with
    ordering-sensitive `if` branches following it. Any new inline token means editing both the regex
    and the branch chain.

15. **`ExportButton.tsx` uses `document.write` into a popup** and prints after a fixed 500 ms font
    wait. It silently no-ops when the popup is blocked, and the fixed delay is a race on slow font
    loads.

16. **`ChatInterface.tsx` is ~806 lines** holding state management, streaming, persistence, theming,
    speech recognition, and the full desktop/mobile layout in one component.

17. **The `sendMessage` callback depends on `messages`**, so it is re-created on every token during
    streaming, along with the inline handlers that close over it.

18. **`AbortController` is wired but unreachable.** `abortRef` is created per request and the abort
    path is handled, but no UI ever calls `.abort()`.

19. **Unused dependencies ship in `package.json`:** `@ai-sdk/google`, `@google/generative-ai`,
    `@xenova/transformers`, `framer-motion`, `ai`, and `voyageai` — none imported anywhere.
    `public/riad.vcf` and the default Next.js SVGs are likewise unreferenced.

20. **`CLAUDE.md` predates roughly half the codebase.** It describes `chat_sessions`/`chat_messages`
    as "scaffolded, not yet used", reports a mobile-avatar bug that no longer exists
    (`ChatInterface.tsx:497` correctly uses `/riad-photo.png`), states the client sends no `language`
    field (the field was replaced by a required `sessionId`), lists rate limiting and the admin page
    as future work, and documents neither the contact form, the calendar card, PDF export, follow-ups,
    confidence scoring, the welcome page, voice input, nor light/dark theming. Treat `architecture.md`
    and `requirements.md` as current and `CLAUDE.md` as historical.

21. **A stale comment in `lib/db/schema.ts:22`** describes the 1024-dim embedding as "Voyage AI
    voyage-3-lite output size"; the model used throughout is `voyage-3`, and `voyage-3-lite` produces
    512 dimensions.

22. **No tests and no CI.** There is no test framework, no test files, and no workflow configuration
    in the repository.
