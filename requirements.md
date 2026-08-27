# Requirements — my-ai-portfolio-app

> Reverse-documentation. Every requirement below was verified by reading the code in this
> repository. Anything that could not be confirmed from the code is marked `[unverified]`.
> This document describes **what the system does**; see `architecture.md` for **how**.

---

## 1. Purpose & Context

This is Riad Sacroud's **AI portfolio agent** — a conversational web app that replaces the passive
experience of reading a CV with an interactive one. Its audience is recruiters, hiring managers, and
developers evaluating Riad, a junior full-stack engineer based in France and open to CDI and
freelance work.

A visitor asks natural-language questions in English or French ("What's his stack?", "Est-il
disponible ?", "Tell me about Wheels&Trade") and receives an answer that is **grounded** — retrieved
from a curated Markdown knowledge base via vector similarity search and streamed token-by-token from
Claude Haiku 4.5. The agent is explicitly instructed never to invent facts about Riad; when it lacks
context it says so and falls back to his email address.

Beyond answering, the app is built to **convert interest into contact**: it surfaces an inline
contact form and a Cal.com booking card when the conversation calls for them, links the correct
language version of the resume, and lets a recruiter export the whole exchange as a PDF to share
with their team. A private admin dashboard lets Riad review every conversation, spot knowledge-base
gaps, and track token spend.

---

## 2. Core Functional Requirements

### 2.1 Bilingual conversation and language detection

**FR-1** — The system SHALL detect the language of **every individual user message** as either French
or English, server-side, with no external API call and no user-facing language toggle.
*Rationale: a visitor may switch languages mid-conversation; per-message detection handles this with
zero UI surface.* (`lib/detectLanguage.ts`, called in `app/api/chat/route.ts`)

**FR-2** — Detection SHALL classify a message as French when it contains more than one French marker
word, **or** one accented word plus one marker word, **or** two or more accented words; otherwise it
SHALL classify the message as English. Contractions and inversions (`as-tu`, `qu'est-ce`, `peux-tu`)
SHALL be split into component words before matching.

**FR-3** — The agent SHALL respond **only** in the detected language, regardless of the language the
question was asked in, enforced by an instruction injected into the system prompt.

**FR-4** — The system SHALL communicate the detected language back to the client during the response
stream, so client-side UI (contact form labels, status text, error messages, export headings) renders
in the matching locale.

**FR-5** — The client SHALL fall back to detecting the language locally from the message the user just
sent when it must display an error before the server has reported a language.

### 2.2 Knowledge retrieval and grounded answers

**FR-6** — The system SHALL answer exclusively from a curated knowledge base of Markdown files
covering: identity/about, availability and salary, contact channels, education, professional
experience, FAQ, projects, resume-sharing instructions, skills, and the app's own interactive
features. (`knowledge-base/*.md` — 10 files)

**FR-7** — On each user message the system SHALL embed the query and retrieve the **4 most
semantically similar** knowledge-base chunks by cosine similarity, and SHALL inject them into the
system prompt as labelled context blocks showing source file and relevance percentage.

**FR-8** — Retrieval SHALL be **context-aware across turns**: the embedded query SHALL be built from
the last three user messages, with the current message repeated so it dominates the vector.
*Rationale: follow-ups like "tell me more about the first one" carry no standalone meaning.*

**FR-9** — The agent SHALL be instructed not to invent, assume, or extrapolate information about
Riad, and when the answer is absent from context SHALL say so honestly and direct the user to
`sacroudr@gmail.com`.

**FR-10** — The agent SHALL answer directly and confidently about salary, availability, and location
when a recruiter asks, since those facts are present in the knowledge base.

**FR-11** — When asked for the resume/CV the agent SHALL share `/resume-fr.pdf` for French
conversations and `/resume-en.pdf` for English ones (both when unsure), rendered by the client as a
labelled download button rather than a bare link.

**FR-12** — Editing a knowledge-base file and re-running ingestion SHALL take effect on the next
question with no redeploy and no application restart.

### 2.3 Streaming chat experience

**FR-13** — The assistant's answer SHALL stream to the browser token-by-token and render
progressively, with a blinking cursor shown while the message is still streaming.

**FR-14** — The system SHALL render the agent's Markdown — headings, horizontal rules, bullet and
numbered lists, bold, italic, inline code — plus auto-linked URLs, bare domains, email addresses,
phone numbers, and PDF download buttons.

**FR-15** — The conversation SHALL auto-scroll to follow the stream **only** when the user is already
near the bottom, so scrolling up to re-read is never yanked back down.

**FR-16** — The system SHALL accept a message via Enter, insert a newline via Shift+Enter, and
auto-grow the input up to 120px.

**FR-17** — The system SHALL offer **voice input** where the browser supports the Web Speech API,
choosing the recognition locale (`fr-FR` / `en-US`) from the last user message, falling back to the
browser locale. Where unsupported, the mic control SHALL be absent rather than broken.

**FR-18** — The system SHALL offer suggested starter questions — six mixed EN/FR chips in the desktop
sidebar, three condensed chips on mobile — that send on click.

### 2.4 Interactive recruiter features

**FR-19** — When the user asks how to contact Riad (in either language), the system SHALL render an
**inline contact form** beneath that answer, collecting name, email, and message.

**FR-20** — Submitting the contact form SHALL deliver the message to Riad's inbox with the sender's
address set as reply-to, and SHALL show a success state in the conversation's language. Failures
SHALL show a retryable error and never lose the typed content.

**FR-21** — The contact form SHALL reject submissions with an empty field or a malformed email
address before sending.

**FR-22** — When the user asks to schedule a call, book a meeting, or arrange an interview, the system
SHALL render a **calendar booking card** linking to Riad's Cal.com page for a free 30-minute Google
Meet call. Both the contact form and the booking card MAY appear on the same answer.

**FR-23** — The system SHALL let the user **export the whole conversation as a PDF** via the browser
print dialog, styled as a branded transcript with date, message count, contact email, and footer
links. Trigger tokens SHALL be stripped and empty messages omitted from the export.

**FR-24** — The export control SHALL be reachable on both desktop and mobile, and SHALL be hidden when
there is nothing to export.

### 2.5 Agent-quality features

**FR-25** — After each answer completes, the system SHALL generate **three short follow-up questions**
phrased from the user's perspective, in the conversation's language, and render them as clickable
chips that send on click.

**FR-26** — Follow-up generation SHALL be non-critical: if it fails or returns a malformed result, the
answer SHALL stand on its own with no error surfaced to the user.

**FR-27** — The system SHALL compute a **confidence level** (high / medium / low) from the top
retrieved chunk's similarity score, and SHALL adapt the agent's instructions accordingly — answer
confidently, acknowledge uncertainty, or explicitly warn against inventing.

**FR-28** — The client SHALL display a confidence badge **only** on medium ("Partial context") and low
("Limited context — answer may be incomplete") answers. High-confidence answers SHALL carry no badge.
*Rationale: a badge on every message becomes noise; the signal matters only when it's a caveat.*

**FR-29** — The system SHALL maintain **conversation memory within a session** by sending the full
message history to the model on every turn, so the agent can resolve references to earlier answers.

### 2.6 Session persistence

**FR-30** — The system SHALL assign each visitor a session identifier and SHALL restore the previous
conversation — messages and detected language — when the visitor returns, **including after closing
the tab or the browser**.

**FR-31** — Restoration SHALL apply only to conversations saved within the last **24 hours**; older
ones SHALL be ignored and the visitor SHALL start fresh.

**FR-32** — When a conversation is restored, its original session identifier SHALL be restored with
it, so continued messages append to the same server-side session rather than starting a new one.

**FR-33** — The system SHALL offer a "New chat" action that clears the stored conversation, issues a
fresh session identifier, and empties the view.

**FR-34** — If browser storage is unavailable or over quota, the system SHALL start (or continue)
without persistence rather than failing.

**FR-35** — The system SHALL remember the visitor's light/dark theme choice across visits, defaulting
to the operating-system preference when no choice has been made.

### 2.7 Conversation logging

**FR-36** — The system SHALL create a session record on a visitor's first message, storing the
detected language, and SHALL log **every** user and assistant message with its role, content,
language, and timestamp.

**FR-37** — The system SHALL record the **token count** (input + output) of every assistant message.

### 2.8 Admin dashboard

**FR-38** — The system SHALL provide a private admin area, reachable only with a password, covering
three views: Conversations, Analytics, and Token Usage.

**FR-39** — Unauthenticated access to any admin view SHALL redirect to the login page. Every admin
data endpoint SHALL independently reject unauthenticated requests with 401.

**FR-40** — A successful login SHALL persist for 7 days via an HTTP-only cookie; a logout action SHALL
clear it immediately.

**FR-41 — Conversations** — The system SHALL list all sessions newest-first with language, timestamp,
message count, and a preview of the first question; SHALL allow filtering by the text of that first
question; and SHALL show the full transcript of any selected session.

**FR-42 — Analytics** — The system SHALL report: total sessions, total messages split by role,
French/English distribution for both sessions and messages, average messages per session, the top 10
repeated questions, the top 8 **opening** questions, and a 14-day daily activity chart.
*Rationale: the opening question reveals what recruiters actually come to find out.*

**FR-43 — Unanswered detection** — The system SHALL flag user questions whose answer contains a
known "I don't know" phrase in either language, deduplicate them, and present them as detected
knowledge-base gaps.
*Rationale: this is the feedback loop for deciding what to add to the knowledge base next.*

**FR-44 — Token Usage** — The system SHALL report total tokens consumed, an estimated USD cost, the
average tokens per session, and a per-session breakdown.

**FR-45** — The Token Usage view SHALL link out to the Anthropic console for authoritative billing,
because the app has no access to live account balance. (See §5.)

### 2.9 Email notifications

**FR-46** — The system SHALL email Riad when a **new** visitor session begins, including the timestamp,
the detected language, the visitor's first question, and a truncated session identifier.
*Rationale: Riad learns a recruiter is looking at his profile while they are still on the page.*

**FR-47** — The new-session notification SHALL be fire-and-forget: it SHALL never block, delay, or fail
the visitor's answer, and SHALL be skipped silently when email credentials are absent.

**FR-48** — Contact-form submissions SHALL be emailed to Riad with the sender's address as reply-to.
Unlike FR-47, a delivery failure here SHALL surface as an error to the sender, since a silently
dropped message would be lost.

### 2.10 Rate limiting

**FR-49** — The system SHALL limit chat usage to **10 requests per hour per IP address** using a
sliding window, to bound abuse and API spend.

**FR-50** — A rate-limited visitor SHALL receive a clear message in their language stating the limit
and the minutes remaining, rendered inside the conversation rather than as a crash.

**FR-51** — Rate limiting SHALL be **bypassed in development** so the app is usable locally without a
Redis instance.

**FR-52** — The rate limiter SHALL **fail open**: if credentials are missing or the Redis backend is
unreachable, the request SHALL be allowed through.
*Rationale: a portfolio that answers nobody is worse than one that occasionally over-serves.
See §5 for the free-tier archival behaviour this defends against.*

**FR-53** — Successful chat responses SHALL carry the current limit, remaining count, and reset time
as response headers.

---

## 3. Non-Functional Requirements

### Performance
- **NFR-1** — The first token SHALL reach the browser as soon as the model emits it; no buffering of
  the complete answer before display.
- **NFR-2** — The chat endpoint SHALL complete within the 30-second serverless execution limit it
  declares; it runs on the Node.js runtime rather than Edge.
- **NFR-3** — Vector search SHALL use an approximate-nearest-neighbour index so retrieval latency does
  not grow linearly with knowledge-base size.
- **NFR-4** — Follow-up suggestions SHALL be generated **after** the main answer has finished
  streaming, so they never delay the answer itself.
- **NFR-5** — The admin session list SHALL avoid per-session queries (no N+1) when enriching sessions
  with message counts and previews.

### Resilience / graceful degradation
- **NFR-6** — Failure of a non-essential dependency SHALL degrade one feature, not the app: no Upstash
  → no rate limiting; no Resend credentials → no notification email; no Web Speech API → no mic
  button; unavailable `localStorage` → no persistence.
- **NFR-7** — Malformed or unparseable stream events SHALL be skipped silently rather than aborting
  rendering of the answer.
- **NFR-8** — A user-aborted request SHALL not produce a visible error.
- **NFR-9** — Ingestion SHALL fail fast and name the exact chunk that failed, and SHALL validate
  embedding dimensions and reject NaN values before writing.

### Security
- **NFR-10** — Admin views and admin data endpoints SHALL both enforce authentication independently,
  so neither layer is a single point of failure.
- **NFR-11** — The admin cookie SHALL be HTTP-only, `SameSite=strict`, and `Secure` in production.
- **NFR-12** — Every API route SHALL validate its request body shape before acting, and SHALL return a
  4xx with a JSON error rather than throwing.
- **NFR-13** — Vector similarity queries SHALL be parameterised; no user-supplied string SHALL be
  concatenated into SQL.
- **NFR-14** — User-supplied content SHALL be HTML-escaped before being written into the PDF export
  document.
- **NFR-15** — Credentials SHALL live only in environment variables, SHALL never be committed (`.env*`
  is gitignored), and SHALL never be logged or returned to the client.
- **NFR-16** — Internal error details SHALL not leak to the client from the contact endpoint; it
  returns a generic failure message and logs the specifics server-side.

### Accessibility
- **NFR-17** — The conversation SHALL be exposed as a polite live region so screen readers announce
  streamed answers.
- **NFR-18** — Interactive controls SHALL carry accessible labels; toggle controls SHALL expose their
  pressed state; decorative icons and the streaming cursor SHALL be hidden from assistive tech.
- **NFR-19** — Keyboard focus SHALL be visible via a focus ring shown for keyboard navigation and
  suppressed for mouse interaction.
- **NFR-20** — The system SHALL honour the OS "reduce motion" preference by collapsing animations and
  transitions to instant.
- **NFR-21** — Text colours SHALL meet AA contrast in both themes; touch targets SHALL be enlarged on
  mobile.
- **NFR-22** — Long agent prose SHALL be capped at a readable measure.

### Cost efficiency
- **NFR-23** — The system SHALL send only the top-4 retrieved chunks rather than the whole knowledge
  base, keeping per-request context bounded as the knowledge base grows.
- **NFR-24** — The system SHALL use the cheapest capable model tier for both the answer and the
  follow-up generation, with follow-ups capped at a small token budget.
- **NFR-25** — Token usage SHALL be recorded per message so spend is attributable per session.

### Privacy
- **NFR-26** — Conversations SHALL be logged in full and reviewable by Riad. Sessions are pseudonymous:
  the system stores no name, email, IP address, or account for a chat visitor.
- **NFR-27** — Deleting a session SHALL cascade to its messages (enforced at the database level).
  `[unverified]` — no delete path is exposed in the UI or API today.
- **NFR-28** — Visitor IP addresses SHALL be used transiently for rate limiting only and SHALL not be
  written to the application database.

---

## 4. External Dependencies & Integrations

| Service | Used for | Requirements that depend on it | Failure behaviour |
|---|---|---|---|
| **Anthropic** (Claude Haiku 4.5) | Streaming the grounded answer; generating follow-up questions | FR-13, FR-25, FR-29, FR-37 | Answer fails → error message in the conversation. Follow-up failure is silent (FR-26). |
| **Voyage AI** (`voyage-3`) | Embedding both knowledge-base chunks (ingestion) and user queries | FR-7, FR-8, FR-12 | Request fails → error message in the conversation. |
| **Neon** (serverless PostgreSQL + pgvector) | Vector store for the knowledge base; session and message logging | FR-6, FR-7, FR-36, FR-37, FR-41–FR-44 | Hard dependency — no answer without it. |
| **Upstash Redis** | Sliding-window rate limiting on the chat endpoint | FR-49–FR-53 | Fails open (FR-52); chat continues unlimited. |
| **Resend** | New-session notification email; contact-form delivery | FR-20, FR-46, FR-48 | Notification: silent skip. Contact form: user-visible error. |
| **Cal.com** | Externally hosted 30-minute Google Meet booking page | FR-22 | Static outbound link; no runtime coupling. |
| **Vercel** | Hosting for the Next.js app and its serverless functions | NFR-2 | Platform. |
| **Google Fonts** | The three typefaces of the design system | — | Font loading only; content still renders. |

---

## 5. Out of Scope / Known Constraints

### Deliberately not built
- **No user accounts, login, or authentication for visitors.** Sessions are pseudonymous browser-side
  identifiers. Only the admin area is protected.
- **No shareable conversation links.** A conversation can leave the app only as a PDF the user
  exports themselves (FR-23).
- **No PWA / installable offline shell.** There is no manifest and no service worker; the app requires
  a network connection. (Listed as a roadmap idea in `README.md`, not implemented.)
- **No citation UI.** The system prompt carries per-chunk source and relevance, but answers do not
  show which chunk grounded which sentence.
- **No global language switch.** Language is per-message and automatic by design (FR-1).
- **No streaming cancel button.** The client can abort a request programmatically, but no UI exposes it.
- **No conversation deletion or retention policy** in the product surface.
- **No automated test suite.** There is no test runner, test directory, or CI configuration in the
  repository.
- **No admin write actions.** The dashboard is read-only: it reviews conversations and metrics but
  cannot edit the knowledge base, reply to a visitor, or delete data.

### Known constraints
- **No live Anthropic account balance.** The Anthropic API exposes no billing-balance endpoint to the
  app, so the Token Usage view estimates cost from logged token counts at a single hardcoded blended
  rate ($0.00025 / 1k tokens) and links out to the Anthropic console for the authoritative figure.
  Input and output tokens are summed together at logging time and cannot be separated retroactively;
  the API response reports them as zero.
- **Token accounting starts at logging.** Only assistant messages carry token counts. Sessions logged
  before the field existed contribute zero.
- **Free-tier service limits shape the design.** Upstash free-tier databases are archived after a
  period of inactivity, which makes the rate limiter intermittently unreachable — the fail-open
  behaviour in FR-52 exists specifically so an archived Redis instance cannot take the chat down.
- **Rate limiting covers the chat endpoint only.** The contact endpoint is not rate-limited.
- **Rate limiting is per-IP, not per-visitor.** Visitors sharing an egress IP share the hourly budget.
- **Knowledge-base changes require an explicit ingestion run.** Editing Markdown alone changes
  nothing; the chunks must be re-embedded and re-inserted.
- **The knowledge base is the ceiling on what the agent can say.** Any factual error in the Markdown
  propagates directly into answers, and any topic absent from it is answered with the fallback.
- **Language detection is heuristic**, not model-based: a very short or code-heavy French message with
  no markers and no accents is classified as English.
- **Voice input availability is browser-dependent** (Web Speech API) and is absent rather than
  degraded where unsupported.
- **PDF export depends on the browser print dialog** and on the pop-up being allowed; there is no
  server-side PDF rendering.
- **Admin authentication is a single shared password** compared directly against an environment
  variable — no user accounts, no rotation, no rate limiting on login attempts.
