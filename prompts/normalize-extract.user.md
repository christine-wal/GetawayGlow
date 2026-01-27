# User Prompt Template: Normalization & Extraction

Normalize and extract from the INPUT JSON below.

Return STRICT JSON that matches the schema exactly. Do not include any extra keys. Do not include markdown.

## INPUT JSON

```json
{{INPUT_JSON}}
```

## OUTPUT JSON SCHEMA (guidance only; do NOT echo it)

```json
{
  "meta": {
    "trip_name": "string",
    "destination_mode": "specific|theme|hybrid",
    "has_international_signal": "boolean",
    "participant_count_total": "number",
    "participant_count_responded": "number"
  },
  "organizer_context": {
    "dates": "string|null",
    "theme_or_location_notes": "string|null",
    "budget_framing": "string|null",
    "transportation_assumptions": {
      "options_selected": ["walk|public_transit|rideshare|rental_car|bike_scooter|unsure"],
      "is_uncertain": "boolean"
    },
    "organizer_notes_extracted": {
      "hard_constraints": [{"text":"string","category":"string"}],
      "soft_preferences": [{"text":"string","category":"string"}],
      "sensitive_items": [{"text":"string","category":"string"}]
    }
  },
  "participants_normalized": [
    {
      "pid": "p1",
      "signals": {
        "spend_attitude": "1|2|3",
        "lodging_price_bucket": "1|2|3|4|null",
        "energy_level": "1|2|3",
        "planning_density": "1|2|3",
        "safety_sensitivity": "1|2|3",
        "language_comfort": "1|2|3|null",
        "food_importance": "1|2|3",
        "style_vibe": "1|2|3",
        "accommodation_pref": "hotel|rental|boutique|luxury|no_preference|other"
      },
      "enums": {
        "spend_attitude": "keep_costs_low|spend_if_value_clear|comfort_vibe_over_cost",
        "lodging_price_bucket": "lt_150|150_300|300_600|600_plus|prefer_not_say|null",
        "energy_level": "chill|mixed|packed",
        "planning_density": "minimal|loose|structured",
        "safety_sensitivity": "adventurous|balanced|central_familiar",
        "language_comfort": "comfortable|some_barriers_ok|prefer_english|null",
        "food_importance": "low|medium|high",
        "style_vibe": "casual|elevated|glam|mix|other",
        "accommodation_pref": "hotel|rental|boutique|luxury|no_preference|other"
      },
      "activities_ranked": ["food_dining|nightlife|culture_sightseeing|relaxation_wellness|shopping|other","...","..."],
      "activity_other_text": "string|null",
      "activities_points": [{"category":"food_dining|nightlife|culture_sightseeing|relaxation_wellness|shopping|other","points":"1|2|3"}],
      "dietary": {
        "flags": ["none|vegetarian|vegan|gluten_free|allergies|other"],
        "allergies_text": "string|null",
        "other_text": "string|null"
      },
      "free_text": {
        "pace_notes": "string|null",
        "accommodation_notes": "string|null",
        "dealbreakers": "string|null",
        "catch_all": "string|null",
        "accommodation_other_text": "string|null",
        "style_other_text": "string|null"
      }
    }
  ],
  "aggregates": {
    "counts": {
      "spend_attitude": [{"option":"keep_costs_low|spend_if_value_clear|comfort_vibe_over_cost","count":"number"}],
      "lodging_price_bucket": [{"option":"lt_150|150_300|300_600|600_plus|prefer_not_say","count":"number"}],
      "energy_level": [{"option":"chill|mixed|packed","count":"number"}],
      "planning_density": [{"option":"minimal|loose|structured","count":"number"}],
      "safety_sensitivity": [{"option":"adventurous|balanced|central_familiar","count":"number"}],
      "language_comfort": [{"option":"comfortable|some_barriers_ok|prefer_english","count":"number"}],
      "accommodation_pref": [{"option":"hotel|rental|boutique|luxury|no_preference|other","count":"number"}],
      "food_importance": [{"option":"low|medium|high","count":"number"}],
      "style_vibe": [{"option":"casual|elevated|glam|mix|other","count":"number"}]
    },
    "activity_points_total": [{"category":"food_dining|nightlife|culture_sightseeing|relaxation_wellness|shopping|other","points_total":"number"}],
    "dietary_summary": {
      "has_allergies": "boolean",
      "dietary_flags_counts": [{"flag":"none|vegetarian|vegan|gluten_free|allergies|other","count":"number"}]
    }
  },
  "constraints_extracted": {
    "hard_constraints": [{"text":"string","category":"string"}],
    "soft_preferences": [{"text":"string","category":"string"}],
    "sensitive_items": [{"text":"string","category":"string"}]
  },
  "notes_for_next_step": ["string"]
}
```
