// supabase/functions/stripe-webhook/index.ts
// Edge Function for handling Stripe webhook events

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return new Response(
      JSON.stringify({ error: "Missing stripe-signature header" }),
      { status: 400 }
    );
  }

  try {
    const body = await req.text();

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tripId = session.metadata?.trip_id;

        if (!tripId) {
          console.error("No trip_id in session metadata");
          return new Response(
            JSON.stringify({ error: "Missing trip_id in metadata" }),
            { status: 400 }
          );
        }

        console.log(`Payment completed for trip: ${tripId}`);

        // Update trip payment status to paid
        const { error: updateError } = await supabase
          .from("trips")
          .update({
            payment_status: "paid",
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
          })
          .eq("id", tripId)
          .eq("stripe_checkout_session_id", session.id);

        if (updateError) {
          console.error("Failed to update trip payment status:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update payment status" }),
            { status: 500 }
          );
        }

        console.log(`Trip ${tripId} marked as paid`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tripId = session.metadata?.trip_id;

        if (!tripId) {
          console.log("No trip_id in expired session metadata");
          break;
        }

        console.log(`Checkout session expired for trip: ${tripId}`);

        // Reset trip payment status to unpaid
        const { error: updateError } = await supabase
          .from("trips")
          .update({
            payment_status: "unpaid",
            stripe_checkout_session_id: null,
          })
          .eq("id", tripId)
          .eq("stripe_checkout_session_id", session.id);

        if (updateError) {
          console.error("Failed to reset trip payment status:", updateError);
        }

        console.log(`Trip ${tripId} reset to unpaid`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const tripId = paymentIntent.metadata?.trip_id;

        if (!tripId) {
          console.log("No trip_id in failed payment intent metadata");
          break;
        }

        console.log(`Payment failed for trip: ${tripId}`);

        // Update trip payment status to failed
        const { error: updateError } = await supabase
          .from("trips")
          .update({
            payment_status: "failed",
          })
          .eq("id", tripId);

        if (updateError) {
          console.error("Failed to update trip payment status:", updateError);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500 }
    );
  }
});
