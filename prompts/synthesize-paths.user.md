# User Prompt Template: Synthesis & Trip Paths

Synthesize the group trip options using the normalized JSON below.

Return STRICT JSON matching the schema exactly. Do not include extra keys or commentary.

## INPUT JSON

```json
{{NORMALIZED_JSON}}
```

## OUTPUT JSON SCHEMA (guidance only; do NOT echo)

```json
{
  "group_snapshot": {
    "alignment": [{"text":"string"}],
    "tensions": [{"text":"string"}],
    "counts_summary": [
      {
        "dimension":"string",
        "summary":"string"
      }
    ]
  },
  "constraints_acknowledged": {
    "hard_constraints": [{"text":"string","category":"string"}],
    "sensitive_items": [{"text":"string","category":"string"}]
  },
  "trip_paths": [
    {
      "path_id":"path_a|path_b|path_c",
      "name":"string",
      "vibe_summary":"string",
      "profile": {
        "budget_posture":"keep_costs_low|balanced|comfort_forward",
        "energy_level":"chill|mixed|packed",
        "planning_density":"minimal|loose|structured",
        "safety_posture":"adventurous|balanced|central_familiar",
        "language_posture":"comfortable|some_barriers_ok|prefer_english|not_applicable",
        "lodging_approach":"hotel|rental|boutique|luxury|mixed",
        "mobility_assumption":["walk|public_transit|rideshare|rental_car"]
      },
      "activity_focus":["food_dining|nightlife|culture_sightseeing|relaxation_wellness|shopping|other"],
      "who_it_fits":"string",
      "tradeoffs":["string","string"],
      "watchouts":["string"],
      "confidence_level":"high|medium|low"
    }
  ],
  "recommended_path_id":"path_a|path_b|path_c|null",
  "notes_for_ui":["string"]
}
```
