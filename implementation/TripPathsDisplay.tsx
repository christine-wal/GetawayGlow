// components/TripPathsDisplay.tsx
// React component for displaying generated trip paths

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, Info, Lock, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";

interface TripPathsDisplayProps {
  tripId: string;
  tripData: {
    trip_name: string;
    dates: string | null;
    destination_mode: string;
    theme_or_location_notes: string | null;
    budget_framing: string | null;
    transportation_assumptions: string[];
    participants_invited: number | null;
    organizer_notes: string | null;
  };
  responses: any[];
  paymentStatus: PaymentStatus;
  onPaymentStatusChange?: (status: PaymentStatus) => void;
}

interface TripPath {
  path_id: string;
  name: string;
  vibe_summary: string;
  profile: {
    budget_posture: string;
    energy_level: string;
    planning_density: string;
    safety_posture: string;
    language_posture: string;
    lodging_approach: string;
    mobility_assumption: string[];
  };
  activity_focus: string[];
  who_it_fits: string;
  tradeoffs: string[];
  watchouts: string[];
  confidence_level: "high" | "medium" | "low";
}

interface TripPathsResult {
  group_snapshot: {
    alignment: { text: string }[];
    tensions: { text: string }[];
    counts_summary: { dimension: string; summary: string }[];
  };
  constraints_acknowledged: {
    hard_constraints: { text: string; category: string }[];
    sensitive_items: { text: string; category: string }[];
  };
  trip_paths: TripPath[];
  recommended_path_id: string | null;
  notes_for_ui: string[];
}

const confidenceColors = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const confidenceLabels = {
  high: "High Confidence",
  medium: "Medium Confidence",
  low: "Lower Confidence",
};

export function TripPathsDisplay({
  tripId,
  tripData,
  responses,
  paymentStatus,
  onPaymentStatusChange
}: TripPathsDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [result, setResult] = useState<TripPathsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isPaid = paymentStatus === "paid";

  const handleStartCheckout = async () => {
    setIsCheckoutLoading(true);
    setError(null);

    try {
      const currentUrl = window.location.href.split("?")[0];

      const { data, error: fnError } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            trip_id: tripId,
            success_url: currentUrl,
            cancel_url: currentUrl,
          },
        }
      );

      if (fnError) throw fnError;
      if (data.error) {
        if (data.code === "ALREADY_PAID") {
          // Trip was already paid, refresh status
          onPaymentStatusChange?.("paid");
          toast({
            title: "Already unlocked!",
            description: "This trip's AI features are already unlocked.",
          });
          return;
        }
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err: any) {
      console.error("Error starting checkout:", err);
      setError(err.message || "Failed to start checkout. Please try again.");
      toast({
        title: "Checkout failed",
        description: "We couldn't start the checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleGeneratePaths = async () => {
    // Check payment status first
    if (!isPaid) {
      toast({
        title: "Payment required",
        description: "Please unlock AI features to generate trip options.",
        variant: "destructive",
      });
      return;
    }

    if (responses.length < 2) {
      toast({
        title: "Not enough responses",
        description: "You need at least 2 survey responses to generate trip options.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-trip-paths",
        {
          body: {
            trip_id: tripId,
            organizer: {
              trip_name: tripData.trip_name,
              dates: tripData.dates,
              destination_mode: tripData.destination_mode,
              theme_or_location_notes: tripData.theme_or_location_notes,
              budget_framing: tripData.budget_framing,
              transportation_assumptions: tripData.transportation_assumptions || [],
              organizer_notes: tripData.organizer_notes,
            },
            participants_total_invited: tripData.participants_invited,
            participants_responses: responses,
          },
        }
      );

      if (fnError) throw fnError;
      if (data.error) {
        // Handle payment required error
        if (data.code === "PAYMENT_REQUIRED") {
          onPaymentStatusChange?.("unpaid");
          toast({
            title: "Payment required",
            description: "Please unlock AI features to generate trip options.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.details || data.error);
      }

      setResult(data);
      toast({
        title: "Trip options generated!",
        description: `${data.trip_paths.length} options are ready for review.`,
      });
    } catch (err: any) {
      console.error("Error generating trip paths:", err);
      setError(err.message || "Failed to generate trip options. Please try again.");
      toast({
        title: "Generation failed",
        description: "We couldn't generate trip options right now. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!result) {
    return (
      <Card className={`border-dashed border-2 ${isPaid ? 'border-pink-200 bg-pink-50/30' : 'border-purple-200 bg-purple-50/30'}`}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          {isPaid ? (
            <Sparkles className="h-12 w-12 text-pink-400 mb-4" />
          ) : (
            <Lock className="h-12 w-12 text-purple-400 mb-4" />
          )}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {isPaid ? "Ready to Generate Trip Options" : "Unlock AI Trip Options"}
          </h3>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            {isPaid ? (
              <>
                Based on {responses.length} survey response{responses.length !== 1 ? "s" : ""},
                our AI will analyze preferences and suggest 2-3 trip paths that work for your group.
              </>
            ) : (
              <>
                Unlock AI-powered trip planning for a one-time payment of <span className="font-semibold">$29.97</span>.
                Our AI will analyze your group's {responses.length} response{responses.length !== 1 ? "s" : ""} and
                suggest personalized trip paths that work for everyone.
              </>
            )}
          </p>

          {isPaid ? (
            <Button
              onClick={handleGeneratePaths}
              disabled={isLoading || responses.length < 2}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing preferences...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Trip Options
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStartCheckout}
              disabled={isCheckoutLoading || responses.length < 2}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              {isCheckoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting checkout...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Unlock AI Trip Options - $29.97
                </>
              )}
            </Button>
          )}

          {responses.length < 2 && (
            <p className="text-sm text-amber-600 mt-3">
              Need at least 2 responses to {isPaid ? "generate options" : "unlock AI features"}
            </p>
          )}

          {paymentStatus === "pending" && (
            <p className="text-sm text-purple-600 mt-3 flex items-center">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Payment processing... If you completed payment, please refresh the page.
            </p>
          )}

          {paymentStatus === "failed" && (
            <p className="text-sm text-red-600 mt-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Payment failed. Please try again.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 mt-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Snapshot Card */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-800">
            <Info className="h-5 w-5 mr-2" />
            Group Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Where You Align */}
          <div>
            <h4 className="font-semibold text-green-700 flex items-center mb-2">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Where You Align
            </h4>
            <ul className="space-y-1">
              {result.group_snapshot.alignment.map((item, i) => (
                <li key={i} className="text-gray-700 text-sm pl-4 relative">
                  <span className="absolute left-0">•</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Tensions to Navigate */}
          {result.group_snapshot.tensions.length > 0 && (
            <div>
              <h4 className="font-semibold text-amber-700 flex items-center mb-2">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Tensions to Navigate
              </h4>
              <ul className="space-y-1">
                {result.group_snapshot.tensions.map((item, i) => (
                  <li key={i} className="text-gray-700 text-sm pl-4 relative">
                    <span className="absolute left-0">•</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Counts */}
          <div className="pt-2 border-t border-purple-100">
            <h4 className="font-medium text-gray-700 mb-2">Key Insights</h4>
            <div className="grid gap-2">
              {result.group_snapshot.counts_summary.map((item, i) => (
                <p key={i} className="text-sm text-gray-600">
                  <span className="font-medium">{item.dimension}:</span> {item.summary}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hard Constraints */}
      {result.constraints_acknowledged.hard_constraints.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-base flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Must Respect (Hard Constraints)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.constraints_acknowledged.hard_constraints.map((item, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {item.text}
                  <Badge variant="outline" className="ml-2 text-xs">
                    {item.category}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Trip Path Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Your Trip Options</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.trip_paths.map((path) => (
            <Card
              key={path.path_id}
              className={`relative ${
                path.path_id === result.recommended_path_id
                  ? "ring-2 ring-pink-400 shadow-lg"
                  : ""
              }`}
            >
              {path.path_id === result.recommended_path_id && (
                <Badge className="absolute -top-2 -right-2 bg-pink-500">
                  Recommended
                </Badge>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{path.name}</CardTitle>
                  <Badge
                    variant="outline"
                    className={confidenceColors[path.confidence_level]}
                  >
                    {confidenceLabels[path.confidence_level]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 italic">{path.vibe_summary}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Best For */}
                <div>
                  <h5 className="font-medium text-green-700 text-sm">Best for:</h5>
                  <p className="text-sm text-gray-600">{path.who_it_fits}</p>
                </div>

                {/* Tradeoffs */}
                <div>
                  <h5 className="font-medium text-amber-700 text-sm">Tradeoffs:</h5>
                  <ul className="text-sm text-gray-600">
                    {path.tradeoffs.map((t, i) => (
                      <li key={i} className="pl-3 relative">
                        <span className="absolute left-0">-</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Watch Out */}
                {path.watchouts.length > 0 && (
                  <div>
                    <h5 className="font-medium text-purple-700 text-sm">Watch out:</h5>
                    <ul className="text-sm text-gray-600">
                      {path.watchouts.map((w, i) => (
                        <li key={i} className="pl-3 relative">
                          <span className="absolute left-0">→</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Activity Focus Tags */}
                <div className="flex flex-wrap gap-1 pt-2">
                  {path.activity_focus.map((activity) => (
                    <Badge key={activity} variant="secondary" className="text-xs">
                      {activity.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sensitive Items (if any) */}
      {result.constraints_acknowledged.sensitive_items.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 text-base">
              Things to Be Mindful Of
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.constraints_acknowledged.sensitive_items.map((item, i) => (
                <li key={i} className="text-sm text-gray-700">
                  • {item.text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Notes for UI */}
      {result.notes_for_ui.length > 0 && (
        <div className="text-sm text-gray-500 italic space-y-1">
          {result.notes_for_ui.map((note, i) => (
            <p key={i}>💡 {note}</p>
          ))}
        </div>
      )}

      {/* Regenerate Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={handleGeneratePaths}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Regenerating...
            </>
          ) : (
            "Regenerate Options"
          )}
        </Button>
      </div>
    </div>
  );
}

export default TripPathsDisplay;
