// hooks/useTripResponses.ts
// Hook for fetching survey responses for a trip

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SurveyResponse {
  id: string;
  trip_id: string;
  spend_attitude: string;
  lodging_price_bucket: string | null;
  energy_level: string;
  planning_density: string;
  safety_sensitivity: string;
  language_comfort: string | null;
  accommodation_pref: string;
  accommodation_other_text: string | null;
  activity_rank_top3: string[];
  activity_other_text: string | null;
  dietary_flags: string[];
  allergies_text: string | null;
  dietary_other_text: string | null;
  food_importance: string;
  style_vibe: string;
  style_other_text: string | null;
  pace_notes: string | null;
  accommodation_notes: string | null;
  dealbreakers: string | null;
  catch_all: string | null;
  created_at: string;
}

export function useTripResponses(tripId: string | undefined) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    const fetchResponses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("responses")
          .select("*")
          .eq("trip_id", tripId)
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;

        setResponses(data || []);
      } catch (err: any) {
        console.error("Error fetching responses:", err);
        setError(err.message || "Failed to fetch responses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponses();
  }, [tripId]);

  // Format responses for the Edge Function
  const formattedResponses = responses.map((r) => ({
    spend_attitude: r.spend_attitude,
    lodging_price_bucket: r.lodging_price_bucket,
    energy_level: r.energy_level,
    planning_density: r.planning_density,
    safety_sensitivity: r.safety_sensitivity,
    language_comfort: r.language_comfort,
    accommodation_pref: r.accommodation_pref,
    accommodation_other_text: r.accommodation_other_text,
    activity_rank_top3: r.activity_rank_top3,
    activity_other_text: r.activity_other_text,
    dietary_flags: r.dietary_flags,
    allergies_text: r.allergies_text,
    dietary_other_text: r.dietary_other_text,
    food_importance: r.food_importance,
    style_vibe: r.style_vibe,
    style_other_text: r.style_other_text,
    pace_notes: r.pace_notes,
    accommodation_notes: r.accommodation_notes,
    dealbreakers: r.dealbreakers,
    catch_all: r.catch_all,
  }));

  return {
    responses,
    formattedResponses,
    isLoading,
    error,
    responseCount: responses.length,
  };
}

export default useTripResponses;
