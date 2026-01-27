# Enhanced Trip Paths: Specific Recommendations + Destination Suggestions

The current trip paths are too generic ("Best for groups prioritizing relaxation"). This update makes them specific, actionable, AND adds destination suggestions when the destination isn't fixed.

---

## What's New

When **destination_mode = "specific"** (e.g., "Napa weekend"):
- No destination suggestions
- All recommendations are specific to that destination

When **destination_mode = "theme" or "hybrid"** (e.g., "beach trip with nightlife"):
- Each path includes 1-2 destination suggestions
- Different paths suggest different destinations matching that path's vibe

---

## Step 1: Update the Edge Function

**Copy this entire prompt into Lovable:**

```
Update the "generate-trip-paths" Edge Function to produce more specific, actionable trip path recommendations with destination suggestions when appropriate.

Keep the FIRST Claude call (normalization) exactly the same.

Replace the SECOND Claude call's system prompt with this enhanced version:

"""
You are a decision-synthesis engine for a group trip planning product.

You will receive normalized JSON with organizer context, participant preferences, and constraints.

## Your Job

Generate SPECIFIC, ACTIONABLE trip path recommendations. NOT generic descriptions.

BAD (too vague):
- "A relaxed trip focused on food experiences"
- "Best for groups who want to unwind"

GOOD (specific & useful):
- "Long breakfasts at the rental, one winery visit per day max, dinners at 7pm to catch sunset"
- "Best for the 3 of you who rated energy as 'chill' — you'll have porch time built in every afternoon"

## Core Rules

- Generate 2–3 trip paths that resolve group tensions in different ways
- Never reveal individual identities (use "some participants" or counts like "3 of 5")
- All paths must respect hard constraints
- Be opinionated — make real recommendations, not wishy-washy suggestions

## CRITICAL: Destination Mode Logic

Check the `destination_mode` field in organizer context:

### When destination_mode = "specific"
The destination is FIXED. DO NOT include `destination_suggestions`.
Make all recommendations specific to THAT destination:
- If "Napa": recommend actual areas (Yountville vs St. Helena), specific wineries, local restaurants
- If "Miami": recommend neighborhoods (South Beach vs Wynwood), specific venues, beaches
- Lodging, experiences, and sample day should all be tailored to the specific destination

### When destination_mode = "theme" or "hybrid"
The destination is FLEXIBLE. INCLUDE `destination_suggestions` for each path.
Each path should suggest 1-2 destinations that match the path's vibe:
- A "chill beach retreat" path might suggest: Tulum, Mexico OR Algarve, Portugal
- An "adventure + nightlife" path might suggest: Miami OR Cabo San Lucas
- Different paths should suggest DIFFERENT destinations (don't repeat)
- Lodging guidance and experiences should be more general when destinations are flexible

## Each Trip Path Must Include

1. **name**: Short catchy name (e.g., "Slow-Paced Wine & Dine")

2. **vibe_summary**: Specific description of what days actually look like
   - NOT: "A relaxed food-focused trip"
   - YES: "Long mornings at the rental, one winery per day max, group dinners by 7pm"

3. **who_it_fits**: Reference actual group data
   - NOT: "Best for groups who want to unwind"
   - YES: "Best for the 3 of you who rated energy as 'chill' — built-in porch time every afternoon"

4. **destination_suggestions** (ONLY when destination_mode is "theme" or "hybrid"):
   Array of 1-2 destinations, each with:
   - name: "Tulum, Mexico"
   - why_it_fits: "Laid-back beach vibe, great food scene, no need for packed itinerary"
   - vibe_match: "Chill energy, wellness-friendly, Instagram-worthy without trying"
   - considerations: "July can be hot; some places cash-only"
   - flight_info: "Fly into Cancun (CUN), 2hr drive south"

5. **lodging_guidance**: Object with:
   - recommendation: Specific advice ("Look for a 3-bedroom rental in Yountville or St. Helena")
   - why_this_works: Why this fits the group
   - what_to_look_for: Array of specific features to find
   - avoid: Array of things to avoid (optional)
   - price_range: Realistic estimate ("$400-600/night total, ~$80-120/person")

6. **suggested_experiences**: Array of 2-5 activities, each with:
   - name: Specific activity ("Sunset tasting at a boutique vineyard like Tres Sabores")
   - why: Why it fits this group
   - timing: When to do it ("Day 2, late afternoon")
   - budget_note: Cost estimate ("$50-75 per person")

7. **sample_day**: Object showing what a typical day looks like:
   - label: "What Day 2 Actually Looks Like"
   - morning: What happens in the morning
   - midday: What happens midday
   - afternoon: What happens in the afternoon
   - evening: What happens in the evening

8. **booking_priorities**: Array of 1-3 items to book first:
   - item: What to book
   - why_book_early: Why it needs advance booking
   - when_to_book: When to do it

9. **budget_estimate**: Array of cost categories:
   - category: "Lodging (3 nights)"
   - per_person_range: "$240-360"
   - notes: "5-way split on rental"

10. **tradeoffs**: Array of honest tradeoffs for this path

11. **who_might_feel_meh**: Who this path doesn't serve well
    - "The one person who wanted structure might feel antsy by Day 2"

12. **watchouts**: Array of things to watch out for

13. **confidence_level**: "high", "medium", or "low"

Also include:
- **organizer_next_steps**: Array of 2-4 specific actions for the organizer
- **recommended_path_id**: Which path is recommended (or null if tensions are high)

## Tone

- Practical, like a knowledgeable friend who's been there
- Opinionated but not pushy
- Use "you" and "your group"

Output STRICT JSON only. No markdown.
"""

The response JSON should now include these fields in each trip_path:
- destination_suggestions (ONLY when destination_mode is "theme" or "hybrid") - array with name, why_it_fits, vibe_match, considerations, flight_info
- lodging_guidance (object with recommendation, why_this_works, what_to_look_for, avoid, price_range)
- suggested_experiences (array of activities with name, why, timing, budget_note)
- sample_day (object with label, morning, midday, afternoon, evening)
- booking_priorities (array with item, why_book_early, when_to_book)
- budget_estimate (array with category, per_person_range, notes)
- who_might_feel_meh (string)
- organizer_next_steps (array at the top level)
```

---

## Step 2: Update the UI to Display New Fields

**Copy this entire prompt into Lovable:**

```
Update the TripPathsDisplay component to show the new detailed trip path information, including destination suggestions when they exist.

Each trip path card should now be EXPANDABLE and show these sections:

CARD HEADER (always visible):
- Path name as title
- Vibe summary as subtitle (the new specific one)
- Confidence badge
- Recommended badge (if applicable)
- "View Details" expand button

**IF destination_suggestions exists (when destination is flexible):**
Show destination suggestions PROMINENTLY at the top of the expanded card, BEFORE other sections:

DESTINATION OPTIONS section:
- Display as 1-2 attractive destination cards side by side
- Each destination card shows:
  - Destination name as card title (e.g., "Tulum, Mexico")
  - "Why it fits" as the main description
  - "Vibe match" in italics or as a tagline
  - "Considerations" in a subtle warning/note style
  - "Flight info" with a plane icon
- Style these cards to stand out — they're the key decision point
- Use destination imagery placeholder or gradient backgrounds

WHEN EXPANDED, show these sections in order:

1. DESTINATION OPTIONS (only if destination_suggestions exists)
   - As described above
   - This should be the FIRST and most prominent section

2. WHO IT'S FOR
   - Display who_it_fits text
   - Display who_might_feel_meh in a subtle warning style

3. LODGING GUIDANCE (card with home icon)
   - Recommendation text as the main content
   - "Why this works" as supporting text
   - "What to look for" as a checklist
   - "Avoid" as a warning list (if present)
   - Price range prominently displayed

4. SUGGESTED EXPERIENCES (collapsible list)
   - Each experience shows: name, timing badge, budget note
   - Expandable to show "why" text

5. SAMPLE DAY (timeline style)
   - Show morning, midday, afternoon, evening in a visual timeline
   - Use subtle icons for each time of day

6. BUDGET BREAKDOWN (table or grid)
   - Show each category with per-person range
   - Add up total at bottom
   - Highlight any notes

7. BOOKING PRIORITIES (numbered list with urgency)
   - Show item, why to book early, when to book
   - Use visual urgency indicators

8. TRADEOFFS (bullet list in amber/warning style)
   - Show each tradeoff clearly

9. WATCHOUTS (bullet list)
   - Show each watchout

After all trip path cards, show:

ORGANIZER NEXT STEPS section:
- Display as a checklist the organizer can mentally check off
- Style as an action-oriented section

Keep the existing Group Snapshot and Hard Constraints sections at the top.

Style the expanded cards to be scannable:
- Use clear section headers with icons
- Alternate background colors for sections
- Make price/budget info stand out
- Keep the feminine, modern aesthetic
- Cards should feel comprehensive but not overwhelming

IMPORTANT: When destination_suggestions exists, the destination cards should be the visual focal point — this is what the organizer needs to decide on first!
```

---

## Step 3: Test Both Scenarios

### Test A: Specific Destination (e.g., "Napa weekend")
1. Create or select a trip with destination_mode = "specific"
2. Click "Generate Trip Options"
3. Verify:
   - NO destination suggestions appear
   - Lodging guidance mentions specific Napa areas (Yountville, St. Helena)
   - Experiences are specific to Napa (winery names, local restaurants)
   - Sample day is tailored to wine country

### Test B: Flexible Destination (e.g., "beach trip with nightlife")
1. Create or select a trip with destination_mode = "theme" or "hybrid"
2. Click "Generate Trip Options"
3. Verify:
   - Each path has 1-2 destination suggestions
   - Different paths suggest different destinations
   - Destination suggestions match the path's vibe:
     - "Chill beach retreat" path → suggests Tulum, Algarve, etc.
     - "Party + adventure" path → suggests Miami, Cabo, etc.
   - Destination cards are prominently displayed
   - Flight info is included for each suggestion

---

## What Changed

| Before | After |
|--------|-------|
| "Relaxed trip focused on food" | "Long breakfasts at the rental, one winery per day max, dinners by 7pm" |
| "Best for groups who want to unwind" | "Best for the 3 of you who rated energy as 'chill'" |
| Generic tradeoffs | Specific: "The person who wanted structure might feel antsy by Day 2" |
| No lodging guidance | "Look for a 3-bedroom rental in Yountville — walkable to restaurants" |
| No budget info | Per-person breakdown by category |
| No booking advice | "Book the rental this week — good places go fast" |
| No destination suggestions | When destination is flexible: "Consider Tulum for chill vibes, or Miami for nightlife" |
| All paths same destination | Each path suggests destinations matching its vibe |
