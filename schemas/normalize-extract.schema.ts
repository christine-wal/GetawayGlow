/**
 * Zod Validation Schema for Prompt #1: Normalization & Extraction
 *
 * This schema validates the output from Claude to ensure
 * deterministic, render-ready JSON.
 */

import { z } from "zod";

// ============================================
// ENUM SCHEMAS
// ============================================

export const DestinationModeSchema = z.enum(["specific", "theme", "hybrid"]);

export const TransportOptionSchema = z.enum([
  "walk",
  "public_transit",
  "rideshare",
  "rental_car",
  "bike_scooter",
  "unsure",
]);

export const SpendAttitudeEnumSchema = z.enum([
  "keep_costs_low",
  "spend_if_value_clear",
  "comfort_vibe_over_cost",
]);

export const LodgingPriceBucketEnumSchema = z.enum([
  "lt_150",
  "150_300",
  "300_600",
  "600_plus",
  "prefer_not_say",
]);

export const EnergyLevelEnumSchema = z.enum(["chill", "mixed", "packed"]);

export const PlanningDensityEnumSchema = z.enum([
  "minimal",
  "loose",
  "structured",
]);

export const SafetySensitivityEnumSchema = z.enum([
  "adventurous",
  "balanced",
  "central_familiar",
]);

export const LanguageComfortEnumSchema = z.enum([
  "comfortable",
  "some_barriers_ok",
  "prefer_english",
]);

export const FoodImportanceEnumSchema = z.enum(["low", "medium", "high"]);

export const StyleVibeEnumSchema = z.enum([
  "casual",
  "elevated",
  "glam",
  "mix",
  "other",
]);

export const AccommodationPrefEnumSchema = z.enum([
  "hotel",
  "rental",
  "boutique",
  "luxury",
  "no_preference",
  "other",
]);

export const ActivityCategoryEnumSchema = z.enum([
  "food_dining",
  "nightlife",
  "culture_sightseeing",
  "relaxation_wellness",
  "shopping",
  "other",
]);

export const DietaryFlagEnumSchema = z.enum([
  "none",
  "vegetarian",
  "vegan",
  "gluten_free",
  "allergies",
  "other",
]);

// ============================================
// SHARED SCHEMAS
// ============================================

export const ConstraintItemSchema = z.object({
  text: z.string().min(1),
  category: z.string().min(1),
});

export const CountItemSchema = z.object({
  option: z.string().min(1),
  count: z.number().int().nonnegative(),
});

export const ActivityPointsSchema = z.object({
  category: ActivityCategoryEnumSchema,
  points: z.number().int().min(1).max(3),
});

export const ActivityPointsTotalSchema = z.object({
  category: ActivityCategoryEnumSchema,
  points_total: z.number().int().nonnegative(),
});

export const DietaryFlagCountSchema = z.object({
  flag: DietaryFlagEnumSchema,
  count: z.number().int().nonnegative(),
});

// ============================================
// PARTICIPANT SCHEMA
// ============================================

export const ParticipantSignalsSchema = z.object({
  spend_attitude: z.number().int().min(1).max(3),
  lodging_price_bucket: z.number().int().min(1).max(4).nullable(),
  energy_level: z.number().int().min(1).max(3),
  planning_density: z.number().int().min(1).max(3),
  safety_sensitivity: z.number().int().min(1).max(3),
  language_comfort: z.number().int().min(1).max(3).nullable(),
  food_importance: z.number().int().min(1).max(3),
  style_vibe: z.number().int().min(1).max(3),
  accommodation_pref: AccommodationPrefEnumSchema,
});

export const ParticipantEnumsSchema = z.object({
  spend_attitude: SpendAttitudeEnumSchema,
  lodging_price_bucket: LodgingPriceBucketEnumSchema.nullable(),
  energy_level: EnergyLevelEnumSchema,
  planning_density: PlanningDensityEnumSchema,
  safety_sensitivity: SafetySensitivityEnumSchema,
  language_comfort: LanguageComfortEnumSchema.nullable(),
  food_importance: FoodImportanceEnumSchema,
  style_vibe: StyleVibeEnumSchema,
  accommodation_pref: AccommodationPrefEnumSchema,
});

export const ParticipantDietarySchema = z.object({
  flags: z.array(DietaryFlagEnumSchema),
  allergies_text: z.string().nullable(),
  other_text: z.string().nullable(),
});

export const ParticipantFreeTextSchema = z.object({
  pace_notes: z.string().nullable(),
  accommodation_notes: z.string().nullable(),
  dealbreakers: z.string().nullable(),
  catch_all: z.string().nullable(),
  accommodation_other_text: z.string().nullable(),
  style_other_text: z.string().nullable(),
});

export const ParticipantNormalizedSchema = z.object({
  pid: z.string().regex(/^p\d+$/),
  signals: ParticipantSignalsSchema,
  enums: ParticipantEnumsSchema,
  activities_ranked: z.array(ActivityCategoryEnumSchema).min(1).max(3),
  activity_other_text: z.string().nullable(),
  activities_points: z.array(ActivityPointsSchema),
  dietary: ParticipantDietarySchema,
  free_text: ParticipantFreeTextSchema,
});

// ============================================
// AGGREGATES SCHEMA
// ============================================

export const AggregateCountsSchema = z.object({
  spend_attitude: z.array(CountItemSchema),
  lodging_price_bucket: z.array(CountItemSchema),
  energy_level: z.array(CountItemSchema),
  planning_density: z.array(CountItemSchema),
  safety_sensitivity: z.array(CountItemSchema),
  language_comfort: z.array(CountItemSchema),
  accommodation_pref: z.array(CountItemSchema),
  food_importance: z.array(CountItemSchema),
  style_vibe: z.array(CountItemSchema),
});

export const DietarySummarySchema = z.object({
  has_allergies: z.boolean(),
  dietary_flags_counts: z.array(DietaryFlagCountSchema),
});

export const AggregatesSchema = z.object({
  counts: AggregateCountsSchema,
  activity_points_total: z.array(ActivityPointsTotalSchema),
  dietary_summary: DietarySummarySchema,
});

// ============================================
// ORGANIZER CONTEXT SCHEMA
// ============================================

export const TransportationAssumptionsSchema = z.object({
  options_selected: z.array(TransportOptionSchema),
  is_uncertain: z.boolean(),
});

export const OrganizerNotesExtractedSchema = z.object({
  hard_constraints: z.array(ConstraintItemSchema),
  soft_preferences: z.array(ConstraintItemSchema),
  sensitive_items: z.array(ConstraintItemSchema),
});

export const OrganizerContextSchema = z.object({
  dates: z.string().nullable(),
  theme_or_location_notes: z.string().nullable(),
  budget_framing: z.string().nullable(),
  transportation_assumptions: TransportationAssumptionsSchema,
  organizer_notes_extracted: OrganizerNotesExtractedSchema,
});

// ============================================
// META SCHEMA
// ============================================

export const MetaSchema = z.object({
  trip_name: z.string().min(1),
  destination_mode: DestinationModeSchema,
  has_international_signal: z.boolean(),
  participant_count_total: z.number().int().positive(),
  participant_count_responded: z.number().int().nonnegative(),
});

// ============================================
// CONSTRAINTS EXTRACTED SCHEMA
// ============================================

export const ConstraintsExtractedSchema = z.object({
  hard_constraints: z.array(ConstraintItemSchema),
  soft_preferences: z.array(ConstraintItemSchema),
  sensitive_items: z.array(ConstraintItemSchema),
});

// ============================================
// MAIN OUTPUT SCHEMA
// ============================================

export const NormalizeExtractOutputSchema = z.object({
  meta: MetaSchema,
  organizer_context: OrganizerContextSchema,
  participants_normalized: z.array(ParticipantNormalizedSchema),
  aggregates: AggregatesSchema,
  constraints_extracted: ConstraintsExtractedSchema,
  notes_for_next_step: z.array(z.string()),
});

// ============================================
// INPUT SCHEMA (for validation before calling Claude)
// ============================================

export const ParticipantResponseInputSchema = z.object({
  spend_attitude: SpendAttitudeEnumSchema,
  lodging_price_bucket: LodgingPriceBucketEnumSchema.nullable(),
  energy_level: EnergyLevelEnumSchema,
  planning_density: PlanningDensityEnumSchema,
  safety_sensitivity: SafetySensitivityEnumSchema,
  language_comfort: LanguageComfortEnumSchema.nullable(),
  accommodation_pref: AccommodationPrefEnumSchema,
  accommodation_other_text: z.string().nullable(),
  activity_rank_top3: z.array(ActivityCategoryEnumSchema).min(1).max(3),
  activity_other_text: z.string().nullable(),
  dietary_flags: z.array(DietaryFlagEnumSchema),
  allergies_text: z.string().nullable(),
  dietary_other_text: z.string().nullable(),
  food_importance: FoodImportanceEnumSchema,
  style_vibe: StyleVibeEnumSchema,
  style_other_text: z.string().nullable(),
  pace_notes: z.string().nullable(),
  accommodation_notes: z.string().nullable(),
  dealbreakers: z.string().nullable(),
  catch_all: z.string().nullable(),
});

export const OrganizerInputSchema = z.object({
  trip_name: z.string().min(1),
  dates: z.string().nullable(),
  destination_mode: DestinationModeSchema,
  theme_or_location_notes: z.string().nullable(),
  budget_framing: z.string().nullable(),
  transportation_assumptions: z.array(TransportOptionSchema),
  organizer_notes: z.string().nullable(),
});

export const NormalizeExtractInputSchema = z.object({
  organizer: OrganizerInputSchema,
  participants_total_invited: z.number().int().positive().nullable(),
  participants_responses: z.array(ParticipantResponseInputSchema),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type NormalizeExtractInput = z.infer<typeof NormalizeExtractInputSchema>;
export type NormalizeExtractOutput = z.infer<
  typeof NormalizeExtractOutputSchema
>;
export type ParticipantNormalized = z.infer<typeof ParticipantNormalizedSchema>;
export type ParticipantResponseInput = z.infer<
  typeof ParticipantResponseInputSchema
>;
export type OrganizerInput = z.infer<typeof OrganizerInputSchema>;
export type ConstraintItem = z.infer<typeof ConstraintItemSchema>;
