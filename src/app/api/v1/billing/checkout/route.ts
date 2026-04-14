import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const PLANS = {
  pro: {
    name: "Pro",
    amount_usd: 9,
    interval: "month" as const,
    features: [
      "Exact Gap dollar estimates",
      "Unlimited songs",
      "Full action queue",
      "Signal + Harvest exports",
      "A — AI manager chat",
      "Release Radar",
      "Split sheet generation",
    ],
  },
  elite: {
    name: "Elite",
    amount_usd: 29,
    interval: "month" as const,
    features: [
      "Everything in Pro",
      "Contract scanner",
      "Catalog valuation report",
      "Sync brief matching",
      "Priority A responses",
      "White-label EPK",
    ],
  },
};

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });
}

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      plan?: string;
      email?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    const planKey = body.plan === "elite" ? "elite" : "pro";
    const plan = PLANS[planKey];
    const origin = req.headers.get("origin") ?? "https://pocketmanager.app";
    const successUrl = body.successUrl ?? `${origin}/settings?upgraded=${planKey}`;
    const cancelUrl = body.cancelUrl ?? `${origin}/settings`;

    const stripe = getStripe();

    // No secret key yet — return mock for dev/staging
    if (!stripe) {
      return NextResponse.json({ url: successUrl, mock: true, plan: plan.name });
    }

    const priceId = planKey === "elite"
      ? process.env.STRIPE_ELITE_PRICE_ID
      : process.env.STRIPE_PRO_PRICE_ID;

    // Price IDs not set yet — use dynamic pricing as fallback
    let lineItems: Stripe.Checkout.SessionCreateParams["line_items"];

    if (priceId) {
      lineItems = [{ price: priceId, quantity: 1 }];
    } else {
      // Dynamic pricing — no pre-created product needed
      lineItems = [{
        price_data: {
          currency: "usd",
          recurring: { interval: plan.interval },
          product_data: {
            name: `Pocket Manager ${plan.name}`,
            description: plan.features.slice(0, 3).join(" · "),
          },
          unit_amount: plan.amount_usd * 100,
        },
        quantity: 1,
      }];
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: lineItems,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
        metadata: { plan: planKey },
      },
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    };

    // Pre-fill email if provided
    if (body.email) {
      sessionParams.customer_email = body.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Billing error";
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
