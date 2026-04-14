import { NextRequest, NextResponse } from "next/server";

// Stripe Checkout session scaffold.
// Wire real Stripe by:
// 1. npm install stripe
// 2. Set STRIPE_SECRET_KEY + STRIPE_PRO_PRICE_ID in .env.local
// 3. Uncomment the Stripe block below.
//
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

const PLANS = {
  pro: {
    name: "Pro",
    price_id: process.env.STRIPE_PRO_PRICE_ID ?? "",
    amount_usd: 9,
    interval: "month",
    features: [
      "Exact Gap estimates",
      "Unlimited songs",
      "Full action queue",
      "Signal + Harvest exports",
      "A — AI manager",
      "Release Radar",
      "Split sheet generation",
    ],
  },
  elite: {
    name: "Elite",
    price_id: process.env.STRIPE_ELITE_PRICE_ID ?? "",
    amount_usd: 29,
    interval: "month",
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { plan?: string; successUrl?: string; cancelUrl?: string };
    const plan = body.plan === "elite" ? PLANS.elite : PLANS.pro;

    // If Stripe is not configured, return a mock redirect for development
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        url: body.successUrl ?? "/settings?trial=started",
        mock: true,
        plan: plan.name,
      });
    }

    // Real Stripe checkout (uncomment when stripe is installed):
    // const session = await stripe.checkout.sessions.create({
    //   mode: "subscription",
    //   line_items: [{ price: plan.price_id, quantity: 1 }],
    //   allow_promotion_codes: true,
    //   trial_period_days: 7,
    //   success_url: body.successUrl ?? `${req.headers.get("origin")}/settings?trial=started`,
    //   cancel_url: body.cancelUrl ?? `${req.headers.get("origin")}/settings`,
    // });
    // return NextResponse.json({ url: session.url });

    return NextResponse.json({
      url: body.successUrl ?? "/settings?trial=started",
      mock: true,
      plan: plan.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Billing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}
