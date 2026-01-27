// Example integration on the organizer dashboard page
// This shows how to wire up TripPathsDisplay with trip data

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTripResponses } from "@/hooks/useTripResponses";
import { TripPathsDisplay } from "@/components/TripPathsDisplay";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";

// Example: How to use on your dashboard page
function OrganizerDashboard() {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");

  // Fetch trip data including payment status
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*, payment_status")
        .eq("id", tripId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });

  // Update local payment status when trip data changes
  useEffect(() => {
    if (trip?.payment_status) {
      setPaymentStatus(trip.payment_status as PaymentStatus);
    }
  }, [trip?.payment_status]);

  // Handle payment redirect URL parameters
  useEffect(() => {
    const paymentParam = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (paymentParam === "success") {
      // Clear URL parameters
      setSearchParams({});

      // Show success toast
      toast({
        title: "Payment successful!",
        description: "AI trip generation is now unlocked. Click 'Generate Trip Options' to get started.",
      });

      // Refetch trip data to get updated payment status
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });

      // Optimistically update payment status
      setPaymentStatus("paid");
    } else if (paymentParam === "cancelled") {
      // Clear URL parameters
      setSearchParams({});

      toast({
        title: "Payment cancelled",
        description: "You can try again whenever you're ready.",
        variant: "destructive",
      });
    }
  }, [searchParams, setSearchParams, toast, queryClient, tripId]);

  // Handler for payment status changes from child component
  const handlePaymentStatusChange = (status: PaymentStatus) => {
    setPaymentStatus(status);
    queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
  };

  // Fetch responses using the hook
  const { formattedResponses, isLoading: responsesLoading, responseCount } = useTripResponses(tripId);

  if (tripLoading || responsesLoading) {
    return <div>Loading...</div>;
  }

  if (!trip) {
    return <div>Trip not found</div>;
  }

  // Format trip data for the component
  const tripData = {
    trip_name: trip.trip_name,
    dates: trip.dates,
    destination_mode: trip.destination_mode,
    theme_or_location_notes: trip.theme_or_location_notes,
    budget_framing: trip.budget_framing,
    transportation_assumptions: trip.transportation_assumptions || [],
    participants_invited: trip.participants_invited,
    organizer_notes: trip.organizer_notes,
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Trip Header */}
      <div>
        <h1 className="text-3xl font-bold">{trip.trip_name}</h1>
        <p className="text-gray-600">{trip.dates}</p>
        <p className="text-sm text-gray-500">{responseCount} responses received</p>
      </div>

      {/* Other dashboard sections... */}

      {/* Trip Paths Display - The AI Integration */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Trip Options</h2>
        <TripPathsDisplay
          tripId={tripId!}
          tripData={tripData}
          responses={formattedResponses}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={handlePaymentStatusChange}
        />
      </section>

      {/* Other sections... */}
    </div>
  );
}

export default OrganizerDashboard;
