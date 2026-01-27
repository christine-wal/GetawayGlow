# Implementation Files for Claude AI Integration

This folder contains the implementation code and prompts for adding Claude AI integration to Getaway Glow AI.

## Files Created

| File | Purpose |
|------|---------|
| `LOVABLE-PROMPTS.md` | Step-by-step prompts to copy into Lovable |
| `edge-function.ts` | Reference Edge Function code |
| `TripPathsDisplay.tsx` | React component for displaying trip paths |
| `useTripResponses.ts` | Hook for fetching survey responses |
| `DashboardIntegration.tsx` | Example dashboard integration |

## How to Use

### Option A: Use Lovable Prompts (Recommended)
1. Open `LOVABLE-PROMPTS.md`
2. Copy each prompt into Lovable in order
3. Wait for each step to complete before moving on

### Option B: Reference the Code
If Lovable needs more specific code, you can reference:
- `edge-function.ts` for the exact Edge Function implementation
- `TripPathsDisplay.tsx` for the display component
- `useTripResponses.ts` for data fetching logic

## Architecture Flow

```
User clicks "Generate Trip Options"
         ↓
TripPathsDisplay component calls Edge Function
         ↓
Edge Function makes first Claude call (normalize data)
         ↓
Edge Function makes second Claude call (generate paths)
         ↓
Returns trip paths JSON to frontend
         ↓
TripPathsDisplay renders cards for each path
```

## What Gets Generated

The AI produces:
- **Group Snapshot**: Where the group aligns and tensions to navigate
- **Hard Constraints**: Things all paths must respect (allergies, dealbreakers)
- **2-3 Trip Paths**: Each with name, vibe, tradeoffs, and confidence level
- **Recommended Path**: If there's a clear best option

## Prerequisites

1. Anthropic API key (get at console.anthropic.com)
2. At least 2 survey responses to generate meaningful options
3. Supabase Edge Functions enabled in your Lovable project
