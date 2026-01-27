/**
 * Zod Validation Schema for Prompt #2: Synthesis & Trip Paths (V2 - Enhanced)
 *
 * This schema produces ACTIONABLE, SPECIFIC recommendations
 * instead of generic descriptions.
 */

import { z } from "zod";

// ============================================
// ENUM SCHEMAS (unchanged)
// ============================================

export const PathIdSchema = z.enum(["path_a", "path_b", "path_c"]);

export const BudgetPostureSchema = z.enum([
  "budget_conscious",
  "balanced",
  "comfort_forward",
]);

export const EnergyLevelSchema = z.enum(["chill", "mixed", "packed"]);

export const PlanningDensitySchema = z.enum(["minimal", "loose", "structured"]);

export const LodgingApproachSchema = z.enum([
  "hotel",
  "rental",
  "boutique",
  "luxury",
  "mixed",
]);

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);

// ============================================
// GROUP SNAPSHOT (unchanged)
// ============================================

export const GroupSnapshotSchema = z.object({
  alignment: z.array(z.object({ text: z.string().min(1) })),
  tensions: z.array(z.object({ text: z.string().min(1) })),
  counts_summary: z.array(
    z.object({
      dimension: z.string().min(1),
      summary: z.string().min(1),
    })
  ),
});

// ============================================
// CONSTRAINTS ACKNOWLEDGED (unchanged)
// ============================================

export const ConstraintsAcknowledgedSchema = z.object({
  hard_constraints: z.array(
    z.object({
      text: z.string().min(1),
      category: z.string().min(1),
    })
  ),
  sensitive_items: z.array(
    z.object({
      text: z.string().min(1),
      category: z.string().min(1),
    })
  ),
});

// ============================================
// NEW: SPECIFIC RECOMMENDATIONS
// ============================================

export const SuggestedExperienceSchema = z.object({
  name: z.string().min(1), // e.g., "Sunset wine tasting at a boutique vineyard"
  why: z.string().min(1), // e.g., "Fits the group's food focus without requiring a full day commitment"
  timing: z.string().min(1), // e.g., "Late afternoon, Day 2"
  budget_note: z.string().optional(), // e.g., "$40-60 per person"
});

export const LodgingGuidanceSchema = z.object({
  recommendation: z.string().min(1), // e.g., "Look for a 3-bedroom rental in Yountville or St. Helena"
  why_this_works: z.string().min(1), // e.g., "Central to wineries, walkable to restaurants, shared space for group dinners"
  what_to_look_for: z.array(z.string()), // e.g., ["Outdoor space for morning coffee", "Kitchen for group breakfasts", "At least 2 bathrooms"]
  avoid: z.array(z.string()).optional(), // e.g., ["Properties requiring car for everything", "Places with strict quiet hours"]
  price_range: z.string().min(1), // e.g., "$300-450/night total (~$75-115/person)"
});

export const SampleDaySchema = z.object({
  label: z.string().min(1), // e.g., "A Typical Day on This Path"
  morning: z.string().min(1), // e.g., "Sleep in, slow breakfast at the rental"
  midday: z.string().min(1), // e.g., "One scheduled activity: winery tour or spa"
  afternoon: z.string().min(1), // e.g., "Free time - pool, reading, exploring town"
  evening: z.string().min(1), // e.g., "Group dinner reservation at a farm-to-table spot"
});

export const BookingPrioritySchema = z.object({
  item: z.string().min(1), // e.g., "Dinner at The French Laundry (or similar)"
  why_book_early: z.string().min(1), // e.g., "Books up 2+ months in advance"
  when_to_book: z.string().min(1), // e.g., "As soon as trip dates are confirmed"
});

export const BudgetEstimateSchema = z.object({
  category: z.string().min(1), // e.g., "Lodging (3 nights)"
  per_person_range: z.string().min(1), // e.g., "$225-340"
  notes: z.string().optional(), // e.g., "Assumes 4-person split on rental"
});

// ============================================
// DESTINATION SUGGESTIONS (for flexible destinations)
// ============================================

export const DestinationSuggestionSchema = z.object({
  name: z.string().min(1), // e.g., "Tulum, Mexico"
  why_it_fits: z.string().min(1), // e.g., "Laid-back beach vibe, great food scene, no need for packed itinerary"
  vibe_match: z.string().min(1), // e.g., "Chill energy, wellness-friendly, Instagram-worthy without trying"
  considerations: z.string().min(1), // e.g., "July can be hot; some places cash-only"
  flight_info: z.string().min(1), // e.g., "Fly into Cancun (CUN), 2hr drive south"
});

// ============================================
// ENHANCED TRIP PATH SCHEMA
// ============================================

export const TripPathV2Schema = z.object({
  path_id: PathIdSchema,
  name: z.string().min(1), // e.g., "Relaxed Wine Weekend"

  // HIGH-LEVEL (kept but more specific)
  vibe_summary: z.string().min(1), // More specific: "Long breakfasts, 1 winery per day max, early dinners, lots of porch time"
  who_it_fits: z.string().min(1), // More specific: "The 3 of you who rated energy as 'chill' and want to talk more than tour"

  // DESTINATION SUGGESTIONS (only when destination_mode is "theme" or "hybrid")
  // Omit this field when destination_mode is "specific"
  destination_suggestions: z.array(DestinationSuggestionSchema).min(1).max(2).optional(),

  // PROFILE (unchanged)
  profile: z.object({
    budget_posture: BudgetPostureSchema,
    energy_level: EnergyLevelSchema,
    planning_density: PlanningDensitySchema,
    lodging_approach: LodgingApproachSchema,
  }),

  // NEW: ACTIONABLE DETAILS
  lodging_guidance: LodgingGuidanceSchema,
  suggested_experiences: z.array(SuggestedExperienceSchema).min(2).max(5),
  sample_day: SampleDaySchema,
  booking_priorities: z.array(BookingPrioritySchema).min(1).max(3),
  budget_estimate: z.array(BudgetEstimateSchema).min(2).max(5),

  // TRADEOFFS (enhanced)
  tradeoffs: z.array(z.string().min(1)).min(1), // What you give up
  who_might_feel_meh: z.string().min(1), // e.g., "The person who wanted a packed schedule might feel under-stimulated"

  // WATCHOUTS (kept)
  watchouts: z.array(z.string().min(1)),

  confidence_level: ConfidenceLevelSchema,
});

// ============================================
// MAIN OUTPUT SCHEMA
// ============================================

export const SynthesizePathsV2OutputSchema = z.object({
  group_snapshot: GroupSnapshotSchema,
  constraints_acknowledged: ConstraintsAcknowledgedSchema,
  trip_paths: z.array(TripPathV2Schema).min(1).max(3),
  recommended_path_id: PathIdSchema.nullable(),
  organizer_next_steps: z.array(z.string()).min(1).max(4), // e.g., ["Share this summary with the group", "Book lodging first", "Make dinner reservations 3 weeks out"]
  notes_for_ui: z.array(z.string()),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type SynthesizePathsV2Output = z.infer<typeof SynthesizePathsV2OutputSchema>;
export type TripPathV2 = z.infer<typeof TripPathV2Schema>;
export type SuggestedExperience = z.infer<typeof SuggestedExperienceSchema>;
export type LodgingGuidance = z.infer<typeof LodgingGuidanceSchema>;
export type SampleDay = z.infer<typeof SampleDaySchema>;
export type BookingPriority = z.infer<typeof BookingPrioritySchema>;
export type BudgetEstimate = z.infer<typeof BudgetEstimateSchema>;
export type DestinationSuggestion = z.infer<typeof DestinationSuggestionSchema>;
