<div align="center">

# Riad Sacroud — AI Portfolio Agent

**A conversational portfolio. Instead of scanning a PDF, recruiters _talk_ to an AI that answers questions about me — grounded, streamed in real time, in English or French.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Claude](https://img.shields.io/badge/Claude-Haiku%204.5-d97757)](https://www.anthropic.com)
[![pgvector](https://img.shields.io/badge/pgvector-Neon-336791?logo=postgresql&logoColor=white)](https://neon.tech)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-deployed-black?logo=vercel)](https://vercel.com)

[**Live demo**](#) · [How it works](#-how-it-works) · [Run it locally](#-getting-started)

</div>

> _Replace the `#` in **Live demo** with your deployed URL, and drop a screenshot/GIF into `/public` and link it below._

<!-- ![Screenshot](public/screenshot.png) -->

---

## ✦ What is this?

A static portfolio is passive — a recruiter scans it and leaves. This project turns my background into a **conversation**.

Visitors ask natural-language questions — _"What's his main stack?"_, _"Is he available?"_, _"Tell me about his projects"_ — and an AI agent answers in real time. Every answer is **grounded in a curated knowledge base** via Retrieval-Augmented Generation (RAG), so the agent stays accurate and doesn't hallucinate. It detects the visitor's language automatically and replies in English or French.

It's also a working demonstration of the kind of full-stack + AI engineering I do: a streaming LLM pipeline, vector search, a relational data layer, rate limiting, an admin analytics dashboard, and a hand-built design system — all deployed serverless.

---

## ✦ Features

**For visitors**
- 💬 **Real-time streaming chat** — answers appear token-by-token
- 🌍 **Bilingual (FR / EN)** — language detected per message, no toggle needed
- 🧠 **RAG-grounded answers** — responses come from a curated knowledge base, not the model's imagination
- 🎙️ **Voice input** — ask out loud via the Web Speech API
- 💡 **Follow-up suggestions** — the agent proposes relevant next questions
- 📅 **Book a call** — drops a Cal.com scheduling card into the chat when relevant
- 📨 **Contact form** — sends me an email directly from the conversation (via Resend)
- 📄 **Export to PDF** — download the conversation as a clean printable transcript
- 🌗 **Dark / light themes** — with system-preference detection and persistence
- ♻️ **Conversation persistence** — your chat survives a refresh (24h)

**Under the hood**
- 🔒 **Rate limiting** — 10 requests/hour per IP (Upstash Redis, sliding window)
- 📊 **Admin dashboard** — protected analytics: conversations, usage, common questions, retrieval quality
- 🎨 **Token-based design system** — type, spacing, color, motion, and shadow scales; WCAG-AA contrast; full dark/light parity

---

## ✦ How it works

The heart of the project is a **RAG pipeline**: rather than stuffing everything I've ever done into one giant prompt (expensive, hits token limits, and dilutes accuracy), the server retrieves only the few most relevant pieces of knowledge for each question and hands those to the model.

### Ingestion (run once, or after editing the knowledge base)

```
knowledge-base/*.md
      │
      ▼  scripts/ingest.ts
  1. read        → load all Markdown files
  2. chunk       → split into 400-word chunks (50-word overlap)
  3. embed       → Voyage AI (voyage-3, input_type="document") → 1024-dim vectors
  4. store       → insert into Neon Postgres + pgvector (HNSW index)
```

### Query (every message a visitor sends)

```
User question
      │
      ▼  POST /api/chat
  1. detect language     → "fr" | "en" (heuristic, no API call)
  2. embed the query     → Voyage AI (voyage-3, input_type="query")
  3. vector search       → top-4 chunks by cosine similarity (pgvector  <=>)
  4. build system prompt → inject chunks + behavior rules + language
  5. stream from Claude  → claude-haiku-4-5, token-by-token
      │
      ▼
Streamed response → rendered live in the chat UI
```

> **Why asymmetric embeddings?** Voyage AI is optimized for asymmetric search: documents are embedded with `input_type="document"` at ingestion and queries with `input_type="query"`. Keeping these distinct meaningfully improves retrieval quality.

The streaming uses a lightweight, hand-rolled wire protocol over a `ReadableStream` — text deltas (`0:`), plus side-channels for follow-up suggestions (`f:`), confidence (`c:`), and detected language (`l:`) — which the client parses line-by-line.

---

## ✦ Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 | One codebase for UI + serverless API routes |
| **Language** | TypeScript | End-to-end type safety |
| **LLM** | Claude Haiku 4.5 (`@anthropic-ai/sdk`) | Fast, cheap, ideal for grounded Q&A — context is retrieved, so the model synthesizes rather than reasons heavily |
| **Embeddings** | Voyage AI `voyage-3` (1024-dim) | High-quality asymmetric retrieval for a small KB |
| **Vector DB** | Neon Postgres + `pgvector` (HNSW) | One database for vectors *and* relational data — no second service |
| **ORM** | Drizzle ORM + Drizzle Kit | Typed schema, migrations, queries |
| **Rate limiting** | Upstash Redis + `@upstash/ratelimit` | Serverless-friendly sliding-window limiter |
| **Email** | Resend | Contact-form delivery |
| **Styling** | CSS custom properties + inline styles | A centralized token system; no utility-class churn |
| **Hosting** | Vercel | Matches the serverless model end-to-end |

---

## ✦ Project structure

```
my-ai-portfolio-app/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # The RAG + streaming pipeline
│   │   ├── contact/route.ts       # Contact form → Resend email
│   │   └── admin/                 # Protected analytics endpoints
│   ├── components/                # ChatInterface, MessageBubble, LeftPanel,
│   │                              # WelcomePage, ContactForm, CalendarButton, ExportButton
│   ├── admin/                     # Admin dashboard pages
│   ├── globals.css                # 🎨 Design tokens (type/space/color/motion/shadow)
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db/                        # Drizzle schema + singleton client
│   ├── rag/                       # embed · retrieve · systemPrompt
│   └── detectLanguage.ts          # Heuristic FR/EN detector
├── knowledge-base/                # 📚 Source of truth — Markdown the agent reads
├── scripts/
│   ├── ingest.ts                  # KB → chunks → embeddings → DB
│   └── test-db.ts                 # DB connectivity diagnostics
├── drizzle/                       # Generated migrations
└── middleware.ts                  # IP rate limiting on /api/chat
```

---

## ✦ Design system

The frontend is built on a documented token layer in [`app/globals.css`](app/globals.css), so every value traces back to a single source instead of being hand-tuned per element.

- **Type scale** — `--text-2xs … --text-2xl` (11px floor for legibility)
- **Spacing** — `--space-1 … --space-8` on a 4px grid
- **Color** — semantic text tokens (all **≥ 4.5:1 WCAG AA**), `--accent` cyan identity driven by RGB channels, status colors (green/amber/red), with full **dark + light parity**
- **Motion** — `--dur-fast/base/slow` + shared easings
- **Elevation** — theme-aware `--shadow-sm/md/lg`

Accessibility is built in: keyboard `:focus-visible` rings, `prefers-reduced-motion` support, `aria-live` on the streaming message log, labelled controls, and ≥44px touch targets on mobile.

---

## ✦ Getting started

### Prerequisites
- **Node.js 20+** (developed on 22)
- A **[Neon](https://neon.tech)** Postgres database (with the `pgvector` extension)
- API keys: **[Anthropic](https://console.anthropic.com)**, **[Voyage AI](https://www.voyageai.com)**
- _(Optional, for full features)_ **[Upstash Redis](https://upstash.com)**, **[Resend](https://resend.com)**

### 1. Clone & install

```bash
git clone https://github.com/sacroudr/my-ai-portfolio-app.git
cd my-ai-portfolio-app
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```bash
# ── Core (required) ──────────────────────────────
DATABASE_URL=postgresql://...          # Neon pooled connection string (sslmode=require)
ANTHROPIC_API_KEY=sk-ant-...           # Claude streaming
VOYAGE_API_KEY=pa-...                  # Embeddings

# ── Rate limiting (required in production) ───────
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ── Contact form (optional) ──────────────────────
RESEND_API_KEY=re_...
CONTACT_EMAIL=you@example.com          # where contact messages are delivered

# ── Admin dashboard (optional) ───────────────────
ADMIN_PASSWORD=choose-a-strong-password
```

> `.env.local` is gitignored and must stay that way — it holds live credentials.

### 3. Set up the database

```bash
npx drizzle-kit push    # create tables + the pgvector HNSW index
npm run test-db         # verify connectivity (leaves a dummy row — re-ingest to clear)
```

### 4. Ingest the knowledge base

```bash
npm run ingest          # read /knowledge-base → chunk → embed → store
```

### 5. Run

```bash
npm run dev             # http://localhost:3000
```

> Rate limiting is automatically bypassed in development, so you don't need Upstash to develop locally.

---

## ✦ Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (hot reload) |
| `npm run build` | Production build (also catches type/lint errors) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run ingest` | Rebuild the vector index from `/knowledge-base` |
| `npm run test-db` | Diagnose the database connection |

---

## ✦ Updating the knowledge base

The agent only knows what's in `/knowledge-base/`. To change what it can say:

1. Edit (or add) a Markdown file in `knowledge-base/` — e.g. `skills.md`, `projects.md`, `availability.md`.
2. Run `npm run ingest`.
3. Changes take effect on the next question — no redeploy needed.

---

## ✦ Deployment (Vercel)

1. Push to GitHub and import the repo in [Vercel](https://vercel.com/new).
2. Add every variable from `.env.local` in **Project → Settings → Environment Variables**.
3. Deploy. Then run `npm run ingest` once (locally, pointed at the production `DATABASE_URL`) to populate the vector store.

The chat API route runs on the Node.js runtime with a 30s max duration to accommodate streaming.

---

## ✦ Roadmap

- [ ] Richer admin analytics (retrieval-quality scoring, failed-question review)
- [ ] PWA / installable offline shell
- [ ] Streaming-aware citations (show which KB chunk grounded each answer)
- [ ] Dependency cleanup (prune unused experimentation packages)

---

## ✦ Contact

**Riad Sacroud** — Full-Stack Engineer
[GitHub](https://github.com/sacroudr) · [LinkedIn](https://www.linkedin.com/in/riad-sacroud-7a5b73166/) · sacroudr@gmail.com

> Or just [open the app](#) and ask the agent yourself. 🙂

---

<div align="center">
<sub>Built with Next.js, Claude, and pgvector.</sub>
</div>
