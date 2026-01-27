/**
 * Canonical Enums for Girls Trip Decision Engine
 *
 * These enums are the "source of truth" across:
 * - Form submissions (client)
 * - Storage (database)
 * - Claude inputs/outputs
 * - UI rendering
 * - Analytics
 */

// ============================================
// ORGANIZER ENUMS
// ============================================

export type DestinationMode = "specific" | "theme" | "hybrid";

export type TransportOption =
  | "walk"
  | "public_transit"
  | "rideshare"
  | "rental_car"
  | "bike_scooter"
  | "unsure";

// ============================================
// PARTICIPANT ENUMS
// ============================================

/**
 * Spend Attitude
 * Ordinal: keep_costs_low=1, spend_if_value_clear=2, comfort_vibe_over_cost=3
 */
export type SpendAttitude =
  | "keep_costs_low"
  | "spend_if_value_clear"
  | "comfort_vibe_over_cost";

/**
 * Lodging Price Bucket (per night)
 * Ordinal: lt_150=1, 150_300=2, 300_600=3, 600_plus=4, prefer_not_say=null
 */
export type LodgingPriceBucket =
  | "lt_150"
  | "150_300"
  | "300_600"
  | "600_plus"
  | "prefer_not_say";

/**
 * Energy Level
 * Ordinal: chill=1, mixed=2, packed=3
 */
export type EnergyLevel = "chill" | "mixed" | "packed";

/**
 * Planning Density
 * Ordinal: minimal=1, loose=2, structured=3
 */
export type PlanningDensity = "minimal" | "loose" | "structured";

/**
 * Safety Sensitivity
 * Ordinal: adventurous=1, balanced=2, central_familiar=3
 */
export type SafetySensitivity = "adventurous" | "balanced" | "central_familiar";

/**
 * Language Comfort (for international destinations)
 * Ordinal: comfortable=1, some_barriers_ok=2, prefer_english=3
 */
export type LanguageComfort =
  | "comfortable"
  | "some_barriers_ok"
  | "prefer_english";

/**
 * Accommodation Preference
 */
export type AccommodationPref =
  | "hotel"
  | "rental"
  | "boutique"
  | "luxury"
  | "no_preference"
  | "other";

/**
 * Activity Categories (for top 3 ranking)
 */
export type ActivityCategory =
  | "food_dining"
  | "nightlife"
  | "culture_sightseeing"
  | "relaxation_wellness"
  | "shopping"
  | "other";

/**
 * Dietary Flags
 */
export type DietaryFlag =
  | "none"
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "allergies"
  | "other";

/**
 * Food Importance
 * Ordinal: low=1, medium=2, high=3
 */
export type FoodImportance = "low" | "medium" | "high";

/**
 * Style Vibe
 * Ordinal: casual=1, elevated=2, mix=2, glam=3, other=2
 */
export type StyleVibe = "casual" | "elevated" | "glam" | "mix" | "other";

// ============================================
// ORDINAL MAPPINGS (for Claude's internal use)
// ============================================

export const ORDINAL_MAPPINGS = {
  spend_attitude: {
    keep_costs_low: 1,
    spend_if_value_clear: 2,
    comfort_vibe_over_cost: 3,
  },
  lodging_price_bucket: {
    lt_150: 1,
    "150_300": 2,
    "300_600": 3,
    "600_plus": 4,
    prefer_not_say: null,
  },
  energy_level: {
    chill: 1,
    mixed: 2,
    packed: 3,
  },
  planning_density: {
    minimal: 1,
    loose: 2,
    structured: 3,
  },
  safety_sensitivity: {
    adventurous: 1,
    balanced: 2,
    central_familiar: 3,
  },
  language_comfort: {
    comfortable: 1,
    some_barriers_ok: 2,
    prefer_english: 3,
  },
  food_importance: {
    low: 1,
    medium: 2,
    high: 3,
  },
  style_vibe: {
    casual: 1,
    elevated: 2,
    mix: 2,
    glam: 3,
    other: 2,
  },
} as const;

// ============================================
// DISPLAY LABELS (for UI rendering)
// ============================================

export const DISPLAY_LABELS = {
  destination_mode: {
    specific: "Specific destination",
    theme: "Theme-based",
    hybrid: "Hybrid",
  },
  transport_option: {
    walk: "Mostly walking",
    public_transit: "Public transit",
    rideshare: "Ride shares",
    rental_car: "Rental car",
    bike_scooter: "Biking / scooters",
    unsure: "Not sure yet",
  },
  spend_attitude: {
    keep_costs_low: "Keep costs low",
    spend_if_value_clear: "Spend more if value is clear",
    comfort_vibe_over_cost: "Comfort/vibe over cost",
  },
  lodging_price_bucket: {
    lt_150: "Under $150/night",
    "150_300": "$150–300/night",
    "300_600": "$300–600/night",
    "600_plus": "$600+/night",
    prefer_not_say: "Prefer not to say",
  },
  energy_level: {
    chill: "Chill / lots of downtime",
    mixed: "Mix of activities and rest",
    packed: "Packed / action-filled",
  },
  planning_density: {
    minimal: "Minimal plan",
    loose: "Loose structure",
    structured: "Structured plan",
  },
  safety_sensitivity: {
    adventurous: "Comfortable with uncertainty",
    balanced: "Balanced approach",
    central_familiar: "Prefer central/familiar areas",
  },
  language_comfort: {
    comfortable: "Language differences don't bother me",
    some_barriers_ok: "Comfortable navigating some barriers",
    prefer_english: "Prefer English widely spoken",
  },
  accommodation_pref: {
    hotel: "Hotel",
    rental: "Airbnb / rental",
    boutique: "Boutique hotel",
    luxury: "Luxury resort",
    no_preference: "No preference",
    other: "Other",
  },
  activity_category: {
    food_dining: "Food & dining",
    nightlife: "Nightlife",
    culture_sightseeing: "Culture & sightseeing",
    relaxation_wellness: "Relaxation / wellness",
    shopping: "Shopping",
    other: "Other",
  },
  dietary_flag: {
    none: "None",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    gluten_free: "Gluten-free",
    allergies: "Allergies",
    other: "Other",
  },
  food_importance: {
    low: "Low priority",
    medium: "Medium priority",
    high: "High priority",
  },
  style_vibe: {
    casual: "Casual / practical",
    elevated: "Elevated / chic",
    glam: "Glam / dressy",
    mix: "Mix of styles",
    other: "Other",
  },
} as const;
