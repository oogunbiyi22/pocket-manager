import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Use service role for webhook — bypasses RLS to update any user
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret) {
    console.error("[webhook] STRIPE_SECRET_KEY not configured");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  // Webhook signature is REQUIRED in production — reject unsigned requests
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not configured — rejecting request for security");
    return NextResponse.json(
      { error: "Webhook secret not configured. Set STRIPE_WEBHOOK_SECRET in environment." },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-03-25.dahlia" });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[webhook] Signature error:", message);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_email ?? session.customer_details?.email;

        // Determine plan from subscription metadata
        let plan = "pro";
        if (session.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string);
            plan = sub.metadata.plan ?? "pro";
          } catch {
            // Default to pro if we can't retrieve subscription
          }
        }

        if (customerEmail && supabase) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .maybeSingle();

          if (profile?.id) {
            await supabase
              .from("profiles")
              .update({
                plan,
                stripe_customer_id: session.customer as string,
                updated_at: new Date().toISOString(),
              })
              .eq("id", profile.id);
          }
        }

        console.info(`[webhook] checkout.session.completed — ${customerEmail} → ${plan}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const status = sub.status;
        const plan = sub.metadata.plan ?? "pro";
        const activePlan = ["active", "trialing"].includes(status) ? plan : "free";

        if (supabase) {
          await supabase
            .from("profiles")
            .update({ plan: activePlan, updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", customerId);
        }

        console.info(`[webhook] subscription.updated — ${customerId} → ${activePlan}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        if (supabase) {
          await supabase
            .from("profiles")
            .update({ plan: "free", updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", customerId);
        }

        console.info(`[webhook] subscription.deleted — ${customerId} → free`);
        break;
      }

      default:
        // Acknowledge unhandled events so Stripe stops retrying
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    // Log but don't expose internal details
    console.error(`[webhook] Handler error [${event.type}]:`, message);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }
}
