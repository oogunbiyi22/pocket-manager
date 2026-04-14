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
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-03-25.dahlia" });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(body, sig, webhookSecret)
      : (JSON.parse(body) as Stripe.Event);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_email ?? session.customer_details?.email;
        const plan = (session.subscription
          ? ((await stripe.subscriptions.retrieve(session.subscription as string)).metadata.plan ?? "pro")
          : "pro") as string;

        if (customerEmail && supabase) {
          // Look up user by email via profiles table join
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .maybeSingle();

          const userId = profile?.id;
          if (userId) {
            await supabase
              .from("profiles")
              .update({
                plan,
                stripe_customer_id: session.customer as string,
              })
              .eq("id", userId);
          }
        }
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
            .update({ plan: activePlan })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        if (supabase) {
          await supabase
            .from("profiles")
            .update({ plan: "free" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        // Unhandled event — acknowledge so Stripe stops retrying
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    console.error(`Webhook handler error [${event.type}]:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// App Router reads raw body via req.text() — no bodyParser config needed
