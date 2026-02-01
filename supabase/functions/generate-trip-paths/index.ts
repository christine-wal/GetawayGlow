// supabase/functions/generate-trip-paths/index.ts
// Edge Function for generating trip paths using Claude AI

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// System prompt for Prompt #1: Normalization & Extraction
const NORMALIZE_SYSTEM_PROMPT = `You are a data normalization and constraint-extraction engine for a group trip decision tool.

You will receive:
1) Organizer context (trip framing, transportation assumptions, organizer notes)
2) An array of private participant responses (enum choices + free text)

Your tasks:
- Validate and normalize participant enum inputs into ordinal signals for synthesis (internal use only).
- Aggregate anonymized counts per dimension as counts by enum option (X of N).
- Convert ranked activity priorities into point totals using: rank1=3, rank2=2, rank3=1.
- Extract constraints from free text (dealbreakers + catch_all + organizer_notes) and classify into:
  - hard_constraints: absolute must-haves / cannot / no / medical/allergy/accessibility / immovable logistics
  - soft_preferences: nice-to-haves, prefer/ideally/would love
  - sensitive_items: emotionally sensitive or socially delicate items requiring careful phrasing
- Return STRICT JSON only that matches the required schema.

Privacy rules:
- Do not include names or identifying details. Refer to participants only by index: p1, p2, ...
- Do not attribute any statement to a person in a way that could identify them.

Output rules:
- Output must be valid JSON only (no markdown, no commentary).
- Do not include any keys not present in the schema.
- If data is missing or ambiguous, do not guess; record it under notes_for_next_step.

Counting rules:
- participant_count_total = total invited if provided; otherwise equal to participant_count_responded.
- participant_count_responded = number of responses in the input array.

Ordinal mapping rules:
- spend_attitude: keep_costs_low=1, spend_if_value_clear=2, comfort_vibe_over_cost=3
- lodging_price_bucket: lt_150=1, 150_300=2, 300_600=3, 600_plus=4, prefer_not_say=null
- energy_level: chill=1, mixed=2, packed=3
- planning_density: minimal=1, loose=2, structured=3
- safety_sensitivity: adventurous=1, balanced=2, central_familiar=3
- language_comfort: comfortable=1, some_barriers_ok=2, prefer_english=3, null=null
- food_importance: low=1, medium=2, high=3
- style_vibe: casual=1, elevated=2, mix=2, glam=3, other=2

Classification rules for extracted text:
- hard_constraints if language implies non-negotiable (must, cannot, no, need), medical/allergy/accessibility, or logistics constraints.
- soft_preferences if language implies preference (prefer, ideally, would love).
- sensitive_items if it involves anxiety, pressure, alcohol/drinking, body image, safety fears, interpersonal dynamics, or money dynamics.

Unavailable dates handling:
- If any participant specifies unavailable_dates, include these as hard_constraints with category "scheduling".
- Summarize as "Some participants are unavailable on [dates]" without identifying who.
- If multiple participants have date conflicts, aggregate them.

International Signal Detection:
Set has_international_signal to true if:
- The destination explicitly mentions a country other than the US
- The theme suggests international travel
- Transportation assumptions include international flights
Otherwise, set to false.`;

// System prompt for Prompt #2: Synthesis & Trip Paths (V2 - Enhanced)
const SYNTHESIZE_SYSTEM_PROMPT = `You are a decision-synthesis engine for a group trip planning product.

You will receive a fully normalized JSON object containing:
- Organizer context
- Anonymized participant preference aggregates
- Extracted constraints (hard, soft, sensitive)
- Activity point totals
- Notes for synthesis

Your job:
- Synthesize this data into clear, neutral, organizer-facing guidance.
- Surface where the group aligns and where tradeoffs exist.
- Generate 2–3 coherent trip options ("trip paths") that resolve tensions in different ways.
- IMPORTANT: Provide ACTIONABLE, SPECIFIC recommendations - not generic descriptions.
- Never reveal or imply individual identities.
- Never judge preferences or frame them as problems.
- Use counts (X of N) rather than percentages.

CRITICAL RULE - Destination Suggestions:
- Check the input data for meta.destination_mode
- IF destination_mode is "theme" or "hybrid": You MUST include destination_suggestions (1-2 options) in EVERY trip path
- IF destination_mode is "specific": Do NOT include destination_suggestions (destination already chosen)
- destination_suggestions must include: name, why_it_fits, vibe_match, considerations, and optionally flight_info

Definitions:
- A "trip path" is a coherent way the trip could be experienced.
- A trip path is NOT necessarily a specific location.
- If the destination is fixed, paths describe different ways to experience that destination.
- If the destination is flexible (theme or hybrid mode), include destination_suggestions.

Hard constraints must not be violated by any path.

Tone rules:
- Neutral, practical, supportive.
- Use collective language ("the group," "some participants").
- Frame tradeoffs as design choices, not conflicts.

Output rules:
- Output STRICT JSON only.
- Do not include markdown, commentary, or extra keys.
- Follow the output schema exactly.

=== OUTPUT SCHEMA ===

{
  "group_snapshot": {
    "alignment": [{ "text": "string" }],
    "tensions": [{ "text": "string" }],
    "counts_summary": [{ "dimension": "string", "summary": "string" }]
  },
  "constraints_acknowledged": {
    "hard_constraints": [{ "text": "string", "category": "string" }],
    "sensitive_items": [{ "text": "string", "category": "string" }]
  },
  "trip_paths": [
    {
      "path_id": "path_a" | "path_b" | "path_c",
      "name": "string (e.g., 'Relaxed Wine Weekend')",
      "vibe_summary": "string (specific, e.g., 'Long breakfasts, 1 winery per day max, early dinners, lots of porch time')",
      "who_it_fits": "string (specific, e.g., 'The 3 of you who rated energy as chill and want to talk more than tour')",
      "profile": {
        "budget_posture": "budget_conscious" | "balanced" | "comfort_forward",
        "energy_level": "chill" | "mixed" | "packed",
        "planning_density": "minimal" | "loose" | "structured",
        "safety_posture": "adventurous" | "balanced" | "familiar",
        "language_posture": "comfortable" | "some_barriers_ok" | "prefer_english",
        "lodging_approach": "hotel" | "rental" | "boutique" | "luxury" | "mixed",
        "mobility_assumption": ["string"]
      },
      "activity_focus": ["string"],
      "lodging_guidance": {
        "recommendation": "string (e.g., 'Look for a 3-bedroom rental in Yountville or St. Helena')",
        "why_this_works": "string (e.g., 'Central to wineries, walkable to restaurants')",
        "what_to_look_for": ["string (e.g., 'Outdoor space for morning coffee')"],
        "avoid": ["string (e.g., 'Properties requiring car for everything')"],
        "price_range": "string (e.g., '$300-450/night total (~$75-115/person)')"
      },
      "suggested_experiences": [
        {
          "name": "string (e.g., 'Sunset wine tasting at a boutique vineyard')",
          "why": "string (e.g., 'Fits the group's food focus without requiring a full day')",
          "timing": "string (e.g., 'Late afternoon, Day 2')",
          "budget_note": "string (e.g., '$40-60 per person')"
        }
      ],
      "sample_day": {
        "label": "string (e.g., 'A Typical Day on This Path')",
        "morning": "string (e.g., 'Sleep in, slow breakfast at the rental')",
        "midday": "string (e.g., 'One scheduled activity: winery tour or spa')",
        "afternoon": "string (e.g., 'Free time - pool, reading, exploring town')",
        "evening": "string (e.g., 'Group dinner reservation at a farm-to-table spot')"
      },
      "booking_priorities": [
        {
          "item": "string (e.g., 'Dinner at The French Laundry')",
          "why_book_early": "string (e.g., 'Books up 2+ months in advance')",
          "when_to_book": "string (e.g., 'As soon as trip dates are confirmed')"
        }
      ],
      "budget_estimate": [
        {
          "category": "string (e.g., 'Lodging (3 nights)')",
          "per_person_range": "string (e.g., '$225-340')",
          "notes": "string (e.g., 'Assumes 4-person split on rental')"
        }
      ],
      "destination_suggestions": [
        {
          "name": "string (e.g., 'Tulum, Mexico')",
          "why_it_fits": "string",
          "vibe_match": "string",
          "considerations": "string",
          "flight_info": "string (optional)"
        }
      ],
      "tradeoffs": ["string (what you give up with this path)"],
      "who_might_feel_meh": "string (e.g., 'The person who wanted a packed schedule might feel under-stimulated')",
      "watchouts": ["string"],
      "confidence_level": "high" | "medium" | "low"
    }
  ],
  "recommended_path_id": "path_a" | "path_b" | "path_c" | null,
  "organizer_next_steps": [
    "string (e.g., 'Share this summary with the group')",
    "string (e.g., 'Book lodging first - rentals go fast')",
    "string (e.g., 'Make dinner reservations 3 weeks out')"
  ],
  "notes_for_ui": ["string"]
}

=== FIELD REQUIREMENTS ===

Required for ALL paths:
- lodging_guidance (with all subfields)
- suggested_experiences (2-5 items)
- sample_day (all time periods)
- booking_priorities (1-3 items)
- budget_estimate (2-5 categories)
- tradeoffs (at least 1)
- who_might_feel_meh

destination_suggestions - CONDITIONAL REQUIREMENT:
- REQUIRED when organizer's destination_mode is "theme" or "hybrid"
- Include 1-2 destination options per path
- Each must have: name, why_it_fits, vibe_match, considerations
- Example for theme="European Holiday": "Barcelona, Spain", "Porto, Portugal"
- OMIT when destination_mode is "specific" (destination already chosen)

organizer_next_steps (1-4 items):
- Actionable steps for the trip organizer
- E.g., "Share this summary with the group for feedback"
- E.g., "Lock in lodging within the next 2 weeks"
- E.g., "Send a poll to choose between Path A and Path B"

=== SYNTHESIS LOGIC ===

A) Group Snapshot
- Alignment: Include bullets for meaningful shared preferences
- Tensions: Explicitly name real tensions without blame language
- Counts Summary: Concrete lines like "4 of 6 prefer a mixed or relaxed pace"

B) Constraints Acknowledged
- Include all hard constraints verbatim or lightly summarized
- Include sensitive items to signal awareness

C) Trip Paths (2-3)
- 2 paths for moderate tension
- 3 paths if budget + planning style conflict, multiple polarized dimensions, or large group
- Each path must respect all hard constraints, resolve tensions differently, be internally coherent

D) Path Construction Patterns:
Budget tension: Path A cost-aware, Path B balanced, Path C comfort-forward
Planning tension: Path A structured, Path B loose, Path C minimal
Energy tension: Path A chill, Path B mixed, Path C packed
Never mix extremes in one path.

E) Confidence Level:
- High: fits most preferences, few tradeoffs
- Medium: clear tradeoffs but viable
- Low: edge option, include only if useful

F) Destination Suggestions (for theme/hybrid mode only):
- If destination_mode is "theme": Suggest 1-2 specific destinations per path
- Destinations should align with the path's vibe and constraints
- Include practical details: flight info, visa considerations, language notes
- Avoid destinations that violate hard constraints

recommended_path_id: Include if tensions are low, set to null if high.`;

async function callClaude(systemPrompt: string, userPrompt: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Claude API error:", error);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonContent = content;
  if (content.includes("```json")) {
    jsonContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  } else if (content.includes("```")) {
    jsonContent = content.replace(/```\n?/g, "");
  }

  return JSON.parse(jsonContent.trim());
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const { trip_id, organizer, participants_responses, participants_total_invited } =
      await req.json();

    // Verify payment before allowing AI generation
    if (trip_id) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("payment_status")
        .eq("id", trip_id)
        .single();

      if (tripError) {
        console.error("Error fetching trip:", tripError);
        return new Response(
          JSON.stringify({
            error: "Failed to verify trip",
            details: tripError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (trip.payment_status !== "paid") {
        return new Response(
          JSON.stringify({
            error: "Payment required",
            code: "PAYMENT_REQUIRED",
            message: "Please complete payment to unlock AI trip generation.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Validate input
    if (!organizer || !participants_responses) {
      throw new Error("Missing required fields: organizer and participants_responses");
    }

    if (participants_responses.length === 0) {
      throw new Error("At least one participant response is required");
    }

    console.log(
      `Processing trip: ${organizer.trip_name} with ${participants_responses.length} responses`
    );

    // Step 1: Normalize and extract
    const normalizeInput = {
      organizer,
      participants_total_invited: participants_total_invited || participants_responses.length,
      participants_responses,
    };

    console.log("Step 1: Calling Claude for normalization...");
    const normalizedData = await callClaude(
      NORMALIZE_SYSTEM_PROMPT,
      `Normalize and extract from the INPUT JSON below. Return STRICT JSON matching the schema. Do not include markdown.\n\n${JSON.stringify(normalizeInput, null, 2)}`
    );
    console.log("Step 1 complete: Data normalized");

    // Step 2: Synthesize trip paths
    console.log("Step 2: Calling Claude for synthesis...");
    const tripPaths = await callClaude(
      SYNTHESIZE_SYSTEM_PROMPT,
      `Synthesize the group trip options using the normalized JSON below. Return STRICT JSON matching the schema.\n\n${JSON.stringify(normalizedData, null, 2)}`
    );
    console.log("Step 2 complete: Trip paths generated");
    console.log("Destination mode:", normalizedData.meta?.destination_mode);
    console.log("Trip paths with destinations:", tripPaths.trip_paths.map(p => ({
      path_id: p.path_id,
      has_destinations: !!p.destination_suggestions,
      destination_count: p.destination_suggestions?.length || 0
    })));

    // Step 3: Persist synthesis results to database
    if (trip_id) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabase
        .from("trips")
        .update({
          synthesis_result: tripPaths,
          synthesis_generated_at: new Date().toISOString(),
        })
        .eq("id", trip_id);

      if (updateError) {
        console.error("Error persisting synthesis results:", updateError);
        // Don't fail the request, just log the error
      } else {
        console.log("Step 3 complete: Synthesis results persisted to database");
      }
    }

    return new Response(JSON.stringify(tripPaths), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-trip-paths:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate trip options",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
