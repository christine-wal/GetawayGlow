// supabase/functions/create-checkout-session/index.ts
// Edge Function for creating Stripe Checkout sessions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { trip_id, success_url, cancel_url } = await req.json();

    if (!trip_id || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: trip_id, success_url, cancel_url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns the trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id, trip_name, payment_status, organizer_id")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip) {
      return new Response(
        JSON.stringify({ error: "Trip not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trip.organizer_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "You do not have permission to access this trip" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already paid
    if (trip.payment_status === "paid") {
      return new Response(
        JSON.stringify({ error: "This trip has already been paid for", code: "ALREADY_PAID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch price from app_config
    const { data: priceConfig, error: configError } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "trip_generation_price")
      .single();

    if (configError || !priceConfig) {
      console.error("Failed to fetch price config:", configError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch pricing configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount_cents, currency, description } = priceConfig.value;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: "AI Trip Path Generation",
              description: `Generate AI-powered trip options for "${trip.trip_name}"`,
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${success_url}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancel_url}?payment=cancelled`,
      metadata: {
        trip_id: trip_id,
        user_id: user.id,
      },
      customer_email: user.email,
    });

    // Update trip with pending status and checkout session ID
    const { error: updateError } = await supabase
      .from("trips")
      .update({
        payment_status: "pending",
        stripe_checkout_session_id: session.id,
        payment_amount_cents: amount_cents,
      })
      .eq("id", trip_id);

    if (updateError) {
      console.error("Failed to update trip payment status:", updateError);
      // Don't fail the request - the checkout session is still valid
    }

    return new Response(
      JSON.stringify({
        checkout_url: session.url,
        session_id: session.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create checkout session",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
