# ARCHITECTURE.md — Girls Trip Decision Engine

## Purpose

This document explains the technical architecture for the Girls Trip Decision Engine:
- how data flows from organizer + participants → AI synthesis
- how prompts are treated as deterministic “functions”
- how the Next.js app integrates the AI layer safely and predictably

This system is designed for a solo builder:
- minimal moving parts
- strict schemas
- debuggable outputs
- clear boundaries (AI logic vs UI vs payments)

---

## High-level system diagram

```
Organizer creates trip (web UI)
  └─ Trip record created (DB)
  └─ Share link generated

Participants submit private preferences (web UI)
  └─ Responses stored (DB)

Organizer requests "Synthesize"
  └─ Server gathers organizer context + responses
  └─ Prompt #1 (Normalization & Extraction) → normalized JSON (validated)
  └─ Prompt #2 (Synthesis & Trip Paths) → organizer-facing JSON (validated)
  └─ Results stored + rendered
```

---

## Components

### 1) Next.js App (App Router)
Responsibilities:
- Landing + marketing pages (SEO)
- Organizer setup flow
- Participant survey flow
- Organizer results page (renders synthesis JSON)
- API routes / server actions (secure AI calls)

Non-responsibilities:
- No business logic in the frontend
- No “interpretation” of AI outputs beyond rendering

### 2) Database (recommended: Supabase)
Tables (MVP):
- `trips`
- `participants` (optional; may store invite tokens)
- `responses`
- `ai_runs` (stores prompt inputs/outputs for debugging)

### 3) AI Engine (Claude Code prompts)
Two deterministic prompts:
- Prompt #1: `normalize_extract` (data normalization + constraint extraction)
- Prompt #2: `synthesize_paths` (organizer-facing synthesis + trip paths)

Key design choice:
- Prompts are treated as **versioned functions** with strict input/output contracts.

### 4) Schema Validation (Zod)
Every AI output is validated:
- if invalid JSON or schema mismatch → retry once with “fix JSON” instruction
- if still invalid → fail safely with a user-friendly error

### 5) Payments (Stripe; outside decision engine)
Recommended approach:
- paywall on “Generate results”
- pricing per trip (one-time purchase)
- store `stripe_checkout_session_id` and `paid_at` on `trips`

### 6) Affiliate Links (outside decision engine)
The AI output in MVP should produce:
- “recommended areas” and “example stays/experiences”
Your app can later:
- attach affiliate links post-synthesis
- or run a separate recommendation pipeline

---

## Data flow & request boundaries

### Organizer setup
- Create trip record
- Generate `trip_id` + `organizer_token` (private)
- Generate `participant_link_token` (shareable)

### Participant submissions
- Participants submit to `responses` keyed by `trip_id`
- Store only anonymous response rows (no names required)

### AI synthesis
Triggered by organizer only.

Steps:
1. Server fetches organizer context + responses
2. Build `Prompt #1 INPUT JSON` (enum-based)
3. Call Prompt #1 and validate output
4. Call Prompt #2 with Prompt #1 output and validate
5. Store results (and raw prompt inputs/outputs) in `ai_runs`
6. Render on organizer results page

---

## Prompt management

Recommended repository layout:

```
/prompts
  normalize_extract.prompt.txt
  synthesize_paths.prompt.txt

/schemas
  normalizeExtract.schema.ts
  synthesis.schema.ts
```

Prompts are loaded at runtime (server side only).
Never ship prompt text to the client.

Prompt versioning:
- Add a header comment in your prompt files like: `VERSION: v1.0.0`
- Store prompt version in `ai_runs` rows

---

## Security & privacy

- AI calls occur only server-side.
- Participant responses remain private; output contains only aggregated counts.
- Never include participant names in the prompt inputs.
- Keep tokens unguessable (UUIDv4 or similar).
- Rate limit synthesis endpoint to prevent abuse.

---

## Observability (MVP)

Log/store:
- prompt inputs (sanitized)
- prompt outputs
- validation errors
- retry attempts

This is essential for improving prompts later.

---

## Deployment (recommended)

- Next.js hosted on Vercel
- Supabase hosted managed
- Secrets stored in Vercel env vars:
  - `ANTHROPIC_API_KEY` (or Claude provider key)
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## Future extensions (intentionally separate)

- Re-polling flow for high-tension groups
- Individualized packing/outfit capsules
- Affiliate link enrichment pipeline
- Destination recommendation mode (when destination not fixed)
- Team/event “planner dashboard”
