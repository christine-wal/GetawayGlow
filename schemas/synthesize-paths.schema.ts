/**
 * Zod Validation Schema for Prompt #2: Synthesis & Trip Paths
 *
 * This schema validates the output from Claude to ensure
 * deterministic, render-ready JSON for the organizer UI.
 */

import { z } from "zod";

// ============================================
// ENUM SCHEMAS (Synthesis-specific)
// ============================================

export const PathIdSchema = z.enum(["path_a", "path_b", "path_c"]);

export const BudgetPostureSchema = z.enum([
  "keep_costs_low",
  "balanced",
  "comfort_forward",
]);

export const EnergyLevelSchema = z.enum(["chill", "mixed", "packed"]);

export const PlanningDensitySchema = z.enum(["minimal", "loose", "structured"]);

export const SafetyPostureSchema = z.enum([
  "adventurous",
  "balanced",
  "central_familiar",
]);

export const LanguagePostureSchema = z.enum([
  "comfortable",
  "some_barriers_ok",
  "prefer_english",
  "not_applicable",
]);

export const LodgingApproachSchema = z.enum([
  "hotel",
  "rental",
  "boutique",
  "luxury",
  "mixed",
]);

export const MobilityOptionSchema = z.enum([
  "walk",
  "public_transit",
  "rideshare",
  "rental_car",
]);

export const ActivityFocusSchema = z.enum([
  "food_dining",
  "nightlife",
  "culture_sightseeing",
  "relaxation_wellness",
  "shopping",
  "other",
]);

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);

// ============================================
// GROUP SNAPSHOT SCHEMAS
// ============================================

export const AlignmentItemSchema = z.object({
  text: z.string().min(1),
});

export const TensionItemSchema = z.object({
  text: z.string().min(1),
});

export const CountsSummaryItemSchema = z.object({
  dimension: z.string().min(1),
  summary: z.string().min(1),
});

export const GroupSnapshotSchema = z.object({
  alignment: z.array(AlignmentItemSchema),
  tensions: z.array(TensionItemSchema),
  counts_summary: z.array(CountsSummaryItemSchema),
});

// ============================================
// CONSTRAINTS ACKNOWLEDGED SCHEMA
// ============================================

export const ConstraintItemSchema = z.object({
  text: z.string().min(1),
  category: z.string().min(1),
});

export const ConstraintsAcknowledgedSchema = z.object({
  hard_constraints: z.array(ConstraintItemSchema),
  sensitive_items: z.array(ConstraintItemSchema),
});

// ============================================
// TRIP PATH SCHEMAS
// ============================================

export const PathProfileSchema = z.object({
  budget_posture: BudgetPostureSchema,
  energy_level: EnergyLevelSchema,
  planning_density: PlanningDensitySchema,
  safety_posture: SafetyPostureSchema,
  language_posture: LanguagePostureSchema,
  lodging_approach: LodgingApproachSchema,
  mobility_assumption: z.array(MobilityOptionSchema),
});

export const TripPathSchema = z.object({
  path_id: PathIdSchema,
  name: z.string().min(1),
  vibe_summary: z.string().min(1),
  profile: PathProfileSchema,
  activity_focus: z.array(ActivityFocusSchema).min(1),
  who_it_fits: z.string().min(1),
  tradeoffs: z.array(z.string().min(1)).min(1),
  watchouts: z.array(z.string().min(1)),
  confidence_level: ConfidenceLevelSchema,
});

// ============================================
// MAIN OUTPUT SCHEMA
// ============================================

export const SynthesizePathsOutputSchema = z.object({
  group_snapshot: GroupSnapshotSchema,
  constraints_acknowledged: ConstraintsAcknowledgedSchema,
  trip_paths: z.array(TripPathSchema).min(1).max(3),
  recommended_path_id: PathIdSchema.nullable(),
  notes_for_ui: z.array(z.string()),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type SynthesizePathsOutput = z.infer<typeof SynthesizePathsOutputSchema>;
export type TripPath = z.infer<typeof TripPathSchema>;
export type PathProfile = z.infer<typeof PathProfileSchema>;
export type GroupSnapshot = z.infer<typeof GroupSnapshotSchema>;
export type ConstraintsAcknowledged = z.infer<
  typeof ConstraintsAcknowledgedSchema
>;

// ============================================
// DISPLAY LABELS (for UI rendering)
// ============================================

export const SYNTHESIS_DISPLAY_LABELS = {
  budget_posture: {
    keep_costs_low: "Cost-conscious",
    balanced: "Balanced budget",
    comfort_forward: "Comfort-forward",
  },
  energy_level: {
    chill: "Relaxed pace",
    mixed: "Mixed energy",
    packed: "Action-packed",
  },
  planning_density: {
    minimal: "Minimal planning",
    loose: "Loose structure",
    structured: "Structured itinerary",
  },
  safety_posture: {
    adventurous: "Adventurous",
    balanced: "Balanced approach",
    central_familiar: "Central & familiar",
  },
  language_posture: {
    comfortable: "Language-flexible",
    some_barriers_ok: "Some barriers OK",
    prefer_english: "English preferred",
    not_applicable: "N/A",
  },
  lodging_approach: {
    hotel: "Hotel",
    rental: "Vacation rental",
    boutique: "Boutique hotel",
    luxury: "Luxury resort",
    mixed: "Mixed lodging",
  },
  mobility_option: {
    walk: "Walking",
    public_transit: "Public transit",
    rideshare: "Rideshare",
    rental_car: "Rental car",
  },
  activity_focus: {
    food_dining: "Food & dining",
    nightlife: "Nightlife",
    culture_sightseeing: "Culture & sightseeing",
    relaxation_wellness: "Relaxation & wellness",
    shopping: "Shopping",
    other: "Other",
  },
  confidence_level: {
    high: "High confidence",
    medium: "Medium confidence",
    low: "Lower confidence",
  },
} as const;
