# Complete Lovable Prompts for Claude AI Integration

Copy each prompt below into Lovable in order. Wait for Lovable to confirm completion before moving to the next step.

---

## Step 1: Add Environment Variable

**Copy this prompt into Lovable:**

```
Add an environment variable called ANTHROPIC_API_KEY for storing the Claude API key securely. This will be used by our Edge Function to call the Claude API.
```

**After Lovable confirms:**
1. Go to your Lovable project settings
2. Navigate to Environment Variables
3. Add a new variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key (get one at console.anthropic.com)

---

## Step 2: Create the Edge Function

**Copy this entire prompt into Lovable:**

```
Create a Supabase Edge Function called "generate-trip-paths" that generates AI-powered trip recommendations.

The function should:

1. Accept a POST request with JSON body containing:
   - organizer: object with trip_name, dates, destination_mode, theme_or_location_notes, budget_framing, transportation_assumptions (array), organizer_notes
   - participants_total_invited: number (optional)
   - participants_responses: array of survey response objects

2. Make TWO calls to the Anthropic Claude API (model: claude-sonnet-4-20250514):

FIRST CALL - Normalization:
- System prompt: "You are a data normalization and constraint-extraction engine for a group trip decision tool. You will receive organizer context and an array of private participant responses. Your tasks: validate and normalize participant enum inputs into ordinal signals, aggregate anonymized counts per dimension, convert ranked activity priorities into point totals (rank1=3, rank2=2, rank3=1), extract constraints from free text and classify into hard_constraints (must/cannot/medical/accessibility), soft_preferences (prefer/ideally), and sensitive_items (anxiety/money dynamics/interpersonal). Return STRICT JSON only. Privacy rules: refer to participants only by index p1, p2, etc. Never attribute statements to individuals."
- User prompt: "Normalize and extract from the INPUT JSON below. Return STRICT JSON matching the schema. Do not include markdown." followed by the input data

SECOND CALL - Synthesis:
- System prompt: "You are a decision-synthesis engine for a group trip planning product. You will receive normalized JSON with organizer context, anonymized participant aggregates, and extracted constraints. Your job: synthesize into clear, neutral guidance, surface alignment and tradeoffs, generate 2-3 coherent trip paths that resolve tensions differently. Never reveal individual identities. Use counts (X of N) not percentages. Tone: neutral, practical, supportive. Use collective language. Frame tradeoffs as design choices not conflicts. Output STRICT JSON only."
- User prompt: "Synthesize the group trip options using the normalized JSON below. Return STRICT JSON matching the schema." followed by the normalized data from step 1

3. Configuration:
   - Use ANTHROPIC_API_KEY from environment variables
   - Set temperature to 0.2 for consistent results
   - max_tokens: 4096
   - Include proper CORS headers

4. Return the synthesis result as JSON to the frontend

5. Handle errors gracefully - if Claude returns an error, return:
   { "error": "Failed to generate trip options", "details": error_message }

The response JSON structure should include:
- group_snapshot: { alignment: [{text}], tensions: [{text}], counts_summary: [{dimension, summary}] }
- constraints_acknowledged: { hard_constraints: [{text, category}], sensitive_items: [{text, category}] }
- trip_paths: array of 2-3 paths, each with: path_id, name, vibe_summary, profile (budget_posture, energy_level, planning_density, etc.), activity_focus, who_it_fits, tradeoffs, watchouts, confidence_level
- recommended_path_id: string or null
- notes_for_ui: string array
```

---

## Step 3: Create the Trip Paths Display Component

**Copy this entire prompt into Lovable:**

```
Create a React component called TripPathsDisplay for the organizer dashboard that shows AI-generated trip options.

The component should accept props:
- tripId: string
- tripData: object with trip_name, dates, destination_mode, theme_or_location_notes, budget_framing, transportation_assumptions, participants_invited, organizer_notes
- responses: array of survey response objects

INITIAL STATE (before generation):
Show a card with:
- Sparkles icon
- Title: "Ready to Generate Trip Options"
- Text: "Based on X survey responses, our AI will analyze preferences and suggest 2-3 trip paths that work for your group."
- Pink/purple gradient "Generate Trip Options" button with Sparkles icon
- Disable button and show warning if less than 2 responses

LOADING STATE:
- Button shows spinner with text "Analyzing preferences..."
- Button is disabled

WHEN BUTTON IS CLICKED:
1. Call the "generate-trip-paths" Edge Function via supabase.functions.invoke
2. Pass the tripData as "organizer" object and responses as "participants_responses"

RESULTS DISPLAY:
Once data comes back, show these sections:

1. GROUP SNAPSHOT CARD (purple/pink gradient background):
   - "Where You Align" section with green checkmark icon
     - Bullet list from group_snapshot.alignment
   - "Tensions to Navigate" section with amber warning icon
     - Bullet list from group_snapshot.tensions
   - "Key Insights" section
     - Show counts_summary items as "Dimension: Summary" pairs

2. HARD CONSTRAINTS CARD (red-tinted background):
   - Title: "Must Respect (Hard Constraints)" with warning icon
   - List each constraint with its category as a badge

3. TRIP PATH CARDS (2-3 cards in a grid):
   Each card shows:
   - Path name as title
   - Confidence badge in corner (green for high, yellow for medium, gray for low)
   - If recommended_path_id matches this path, show "Recommended" badge and ring highlight
   - Vibe summary as italic subtitle
   - "Best for:" section with who_it_fits text
   - "Tradeoffs:" section with bullet list
   - "Watch out:" section with watchouts list (if any)
   - Activity focus tags at bottom

4. SENSITIVE ITEMS CARD (blue-tinted, only if items exist):
   - Title: "Things to Be Mindful Of"
   - Bullet list of sensitive items

5. UI NOTES (if any):
   - Show as light gray italic text with lightbulb emoji

6. REGENERATE BUTTON:
   - Outline style button at bottom
   - "Regenerate Options" text

ERROR HANDLING:
- Show toast notification on error
- Display error message in red below the button
- Keep the generate button visible so user can retry

STYLING:
- Use the app's existing color palette (pink, purple accents)
- Cards should have subtle shadows and rounded corners
- Use Tailwind CSS classes
- Import from @/components/ui for Card, Badge, Button
- Use lucide-react for icons (Sparkles, Loader2, AlertTriangle, CheckCircle2, Info)
```

---

## Step 4: Wire Up the Dashboard

**Copy this prompt into Lovable:**

```
On the organizer dashboard page where trip details are shown:

1. Import and add the TripPathsDisplay component

2. Fetch the survey responses for the current trip from the responses table

3. Pass to TripPathsDisplay:
   - tripId: the current trip's ID
   - tripData: object containing the trip's details (trip_name, dates, destination_mode, theme_or_location_notes, budget_framing, transportation_assumptions, participants_invited, organizer_notes)
   - responses: the fetched survey responses array

4. Position the TripPathsDisplay component in a logical place on the dashboard, likely below the trip details/stats section

5. The component handles its own state for loading and displaying results

Make sure the responses are formatted correctly for the Edge Function:
- Each response should include: spend_attitude, lodging_price_bucket, energy_level, planning_density, safety_sensitivity, language_comfort, accommodation_pref, accommodation_other_text, activity_rank_top3, activity_other_text, dietary_flags, allergies_text, dietary_other_text, food_importance, style_vibe, style_other_text, pace_notes, accommodation_notes, dealbreakers, catch_all
```

---

## Step 5: Test the Integration

After all steps are complete:

1. **Create a test trip** in your app with some details filled in

2. **Open the survey link** in an incognito/private window

3. **Submit 2-3 test responses** with DIFFERENT preferences:

   Response 1 (Budget-conscious):
   - spend_attitude: keep_costs_low
   - energy_level: chill
   - planning_density: loose
   - accommodation_pref: rental

   Response 2 (Comfort-forward):
   - spend_attitude: comfort_vibe_over_cost
   - energy_level: packed
   - planning_density: structured
   - accommodation_pref: hotel

   Response 3 (Middle ground):
   - spend_attitude: spend_if_value_clear
   - energy_level: mixed
   - planning_density: loose
   - accommodation_pref: no_preference

4. **Go to the organizer dashboard** and click "Generate Trip Options"

5. **Wait 10-15 seconds** for Claude to process

6. **Verify you see:**
   - Group snapshot with alignment and tensions
   - 2-3 trip path cards
   - A recommended path highlighted (if applicable)
   - Hard constraints listed

---

## Troubleshooting

### "Generate Trip Options" button doesn't work
- Check that ANTHROPIC_API_KEY is set correctly in Lovable settings
- Make sure you have at least 2 survey responses
- Check Lovable's Edge Function logs for errors
- Verify the Edge Function was deployed successfully

### Results look wrong or missing data
- The AI needs varied responses to show tensions
- If everyone picks the same options, there won't be multiple paths
- Try submitting responses with conflicting preferences

### API errors
- Verify your Anthropic API key is valid and has credits
- Check that the model name is correct: claude-sonnet-4-20250514
- Look at the Edge Function logs for detailed error messages

### Slow response
- Claude API calls can take 10-15 seconds with two sequential calls
- This is normal - the loading state should indicate progress
- Consider showing progress messages during the wait

---

## Quick Reference

| Step | What to Do |
|------|------------|
| 1 | Add ANTHROPIC_API_KEY environment variable |
| 2 | Create "generate-trip-paths" Edge Function |
| 3 | Create TripPathsDisplay component |
| 4 | Wire up component on dashboard |
| 5 | Test with sample data |
