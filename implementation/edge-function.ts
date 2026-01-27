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

// System prompt for Prompt #2: Synthesis & Trip Paths
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
- Never reveal or imply individual identities.
- Never judge preferences or frame them as problems.
- Use counts (X of N) rather than percentages.

Definitions:
- A "trip path" is a coherent way the trip could be experienced.
- A trip path is NOT necessarily a specific location.
- If the destination is fixed, paths describe different ways to experience that destination.
- If the destination is flexible, paths may imply destination types or regions.

Hard constraints must not be violated by any path.

Tone rules:
- Neutral, practical, supportive.
- Use collective language ("the group," "some participants").
- Frame tradeoffs as design choices, not conflicts.

Output rules:
- Output STRICT JSON only.
- Do not include markdown, commentary, or extra keys.
- Follow the output schema exactly.

Synthesis Logic:

A) Group Snapshot
- Alignment: Include bullets for meaningful shared preferences (don't list everything)
- Tensions: Explicitly name real tensions without blame language
- Counts Summary: Concrete, readable lines like "4 of 6 prefer a mixed or relaxed pace"

B) Constraints Acknowledged
- Include all hard constraints verbatim or lightly summarized
- Include sensitive items to signal awareness

C) Trip Paths (2-3)
- 2 paths for moderate tension
- 3 paths if budget + planning style conflict, multiple polarized dimensions, or large group
- Each path must respect all hard constraints, resolve tensions differently, and be internally coherent

D) Path Construction Patterns:
Budget tension: Path A cost-aware, Path B balanced, Path C comfort-forward
Planning tension: Path A structured, Path B loose, Path C minimal
Energy tension: Path A chill, Path B mixed, Path C packed
Never mix extremes in one path.

E) Confidence Level:
- High: fits most preferences, few tradeoffs
- Medium: clear tradeoffs but viable
- Low: edge option, include only if useful

recommended_path_id: Optional. Include if tensions are low, set to null if high.
notes_for_ui: Actionable hints for the frontend.`;

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
