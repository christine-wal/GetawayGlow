# Girls Trip Decision Engine  
**AI-powered group decision synthesis for trip planning**

## Overview

The Girls Trip Decision Engine is an AI-assisted system designed to help one organizer confidently plan a group trip **without group chaos**.

Instead of forcing consensus, voting, or public negotiation, the system:
- collects **private individual preferences**
- synthesizes alignment and tension
- produces **2–3 coherent trip options (“trip paths”)**
- explains tradeoffs neutrally and clearly

This repository contains the **AI decision logic only**.  
UI, booking, payments, and styling are handled elsewhere.

---

## Core Philosophy

This system is built around a few key principles:

- **Private honesty > public agreement**  
  People answer more honestly when they aren’t negotiating in real time.

- **Decisions, not suggestions**  
  The output is designed to reduce ambiguity and move the group forward.

- **Tradeoffs are normal**  
  The engine surfaces tradeoffs without blame or judgment.

- **One organizer, many voices**  
  The organizer is empowered to decide with clarity, not manage debate.

- **AI as infrastructure, not a chatbot**  
  The AI returns structured data, not conversational fluff.

---

## What This System Does (and Does Not Do)

### ✅ Does
- Normalize qualitative preferences into comparable signals
- Detect alignment and tension across a group
- Extract hard constraints and sensitive considerations from free text
- Generate 2–3 viable trip paths with explicit tradeoffs
- Return deterministic, render-ready JSON

### ❌ Does Not
- Book travel or accommodations
- Act as a travel agent
- Optimize for consensus or voting
- Expose individual responses
- Provide real-time group collaboration
- Replace human judgment

---

## Architecture Overview

This decision engine is composed of **two Claude Code prompts**, treated as deterministic functions.

```
User Input
  └─ Prompt #1: Normalization & Extraction
        └─ Structured, validated JSON
              └─ Prompt #2: Synthesis & Trip Paths
                    └─ Organizer-facing decision output
```

Each prompt has:
- a fixed system prompt
- a strict input/output schema
- deterministic behavior (low temperature)
- Zod validation on output

---

## Prompt 1: Normalization & Extraction

**File:** `prompts/normalize_extract.prompt.txt`

### Purpose
Convert raw organizer context and individual participant responses into structured, anonymized signals.

### Responsibilities
- Assign participant IDs (`p1`, `p2`, …)
- Normalize enum-based inputs into ordinal signals (internal use)
- Aggregate counts per dimension (X of N)
- Convert ranked activities into point totals
- Extract and classify constraints from free text:
  - `hard_constraints`
  - `soft_preferences`
  - `sensitive_items`
- Flag missing or ambiguous inputs for downstream handling

### Output
A strict JSON object containing:
- participant-level normalized data
- aggregate counts
- activity point totals
- extracted constraints
- notes for synthesis

This output is **never shown directly to users**.

---

## Prompt 2: Synthesis & Trip Paths

**File:** `prompts/synthesize_paths.prompt.txt`

### Purpose
Transform structured signals into **decision-ready guidance** for the organizer.

### Responsibilities
- Summarize group alignment
- Surface meaningful tensions
- Acknowledge constraints and sensitivities
- Generate 2–3 coherent trip options (“trip paths”)
- Explain tradeoffs neutrally
- Optionally recommend a default path

### Definition: Trip Path
A *trip path* is a coherent way the trip could be experienced.

It is:
- not necessarily a specific location
- a bundle of decisions across:
  - budget posture
  - energy level
  - planning density
  - safety posture
  - lodging approach
  - transportation assumptions
  - activity focus

Trip paths exist to resolve tradeoffs, not eliminate them.

### Output
A strict JSON object designed to be rendered directly in the UI for the organizer.

---

## Canonical Enums

All inputs and outputs rely on stable enums (not free text) for:
- spend attitude
- energy level
- planning density
- safety sensitivity
- language comfort
- accommodation preference
- activity categories
- dietary flags
- style vibe

Enums ensure:
- consistent AI behavior
- predictable UI rendering
- simpler analytics
- easier iteration

See schema files for the authoritative list.

---

## Determinism & Reliability

This system is intentionally conservative:

- Claude temperature is kept low (0–0.3)
- Outputs must be valid JSON
- Outputs are validated with Zod
- If validation fails, the prompt is retried with a correction instruction

The goal is **trustworthy consistency**, not creativity.

---

## Privacy Model

- No participant names or identifiers are stored
- Individual responses are never surfaced
- All synthesis is anonymous and aggregate-based
- Sensitive items affect tone and framing only

---

## What Comes Next (Outside This Repo)

This repository is meant to be consumed by:
- a Next.js frontend (vibe-coded)
- a Stripe paywall (per-trip pricing)
- affiliate-driven recommendations (lodging, experiences, packing)

Those layers intentionally live elsewhere.

---

## Guiding Question

When in doubt, ask:

> “Does this reduce decision fatigue for the organizer — or add to it?”

If it adds complexity, it does not belong here.

---

## Status

- Prompt #1: **Locked (v1)**
- Prompt #2: **Locked (v1)**
- Ready for frontend integration and user testing
