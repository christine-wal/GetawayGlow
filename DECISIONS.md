# DECISIONS.md — Girls Trip Decision Engine

## Why this document exists

This file captures key product + engineering decisions so the system stays coherent as it evolves.
It’s also useful when you revisit the project after time away.

---

## Decision: Two-prompt architecture (Prompt #1 + Prompt #2)

**Chosen:** Two calls  
**Rejected:** One “do everything” call

**Why:**
- Prompt #1 produces structured, validated data (normalization + constraints) that is debuggable.
- Prompt #2 focuses on synthesis and communication.
- Separating these reduces hallucination risk and makes failures easier to diagnose.

---

## Decision: Canonical enums everywhere

**Chosen:** Stable enums for all categorical fields  
**Rejected:** Storing user-facing strings directly

**Why:**
- Prevents prompt drift and reduces UI rendering bugs.
- Enables analytics, A/B testing, and future personalization.
- Makes schemas strict and reliable.

---

## Decision: Counts (X of N) over percentages and “bands”

**Chosen:** Present results as counts  
**Rejected:** “Strong alignment” labels or percent thresholds

**Why:**
- Counts scale cleanly for small groups.
- Increases trust and transparency.
- Still preserves anonymity.

---

## Decision: Privacy-first preference collection

**Chosen:** Private individual submissions + aggregate synthesis  
**Rejected:** Public group voting, shared spreadsheets, or consensus chat

**Why:**
- Increases honesty.
- Reduces social pressure and negotiation.
- Aligns with product promise: reduce group chaos.

---

## Decision: “Trip paths” are experience bundles, not necessarily destinations

**Chosen:** Trip paths describe coherent ways to experience the trip  
**Rejected:** Treating each path as a destination suggestion by default

**Why:**
- Works for both fixed-destination and flexible-destination planning.
- Keeps synthesis focused on tradeoffs (budget/energy/planning/safety).
- Makes the system reusable across many trip types.

---

## Decision: No re-polling in MVP

**Chosen:** No second survey flow in MVP  
**Rejected:** “Discuss then re-poll” workflow

**Why:**
- Adds friction and reduces completion rate.
- MVP value comes from clarity and options, not negotiation tooling.
- Can be added later as a premium feature if needed.

---

## Decision: “Planning density” replaces “stress tolerance”

**Chosen:** Ask how planned vs flexible the trip should be  
**Rejected:** Asking about “stress tolerance”

**Why:**
- Users interpret “stress” differently.
- Planning density maps directly to product output (structured vs loose vs minimal).
- More actionable and less emotionally loaded.

---

## Decision: Safety separated from planning / stress

**Chosen:** Dedicated “safety sensitivity” dimension  
**Rejected:** Combining with stress or itinerary structure

**Why:**
- Safety preferences affect neighborhoods, mobility, and activity choices.
- Separating prevents ambiguous interpretations.
- Allows neutral framing without implying fearfulness.

---

## Decision: Claude Code for decision engine, vibe-coding for UI

**Chosen:** Hybrid approach  
**Rejected:** Vibe-code everything or hand-code everything

**Why:**
- UI benefits from rapid iteration (Lovable/Bolt).
- Decision logic requires determinism, schemas, and versioning.
- Treating AI as infrastructure is essential for trust.

---

## Decision: Low temperature, schema validation, single retry

**Chosen:** temp 0–0.3 + Zod validation + one corrective retry  
**Rejected:** Creative settings or unvalidated freeform outputs

**Why:**
- Consistency matters more than novelty.
- Schema validation prevents silent failures.
- A single retry handles formatting errors without infinite loops.

---

## Decision: Store AI runs for debugging

**Chosen:** Store prompt inputs/outputs for synthesis runs  
**Rejected:** Not storing (or only logging)

**Why:**
- Enables rapid iteration on prompts based on real failures.
- Critical for explaining unexpected outputs.
- Supports QA and future model/provider swaps.

---

## Decision: MVP does not act as a travel agent

**Chosen:** Guidance + options, no booking  
**Rejected:** Booking workflows / agent positioning

**Why:**
- Reduces compliance complexity.
- Keeps product scope tight.
- Still allows affiliate monetization through examples and guidance.

---

## Open questions (future)

- Should organizer be able to share a read-only results page to participants?
- Should “budget fairness” (split vs pay-your-way) become a structured question?
- Should we add a lightweight “confirm constraints” step before synthesis?
- Where should affiliate link enrichment happen (AI vs post-processing)?
