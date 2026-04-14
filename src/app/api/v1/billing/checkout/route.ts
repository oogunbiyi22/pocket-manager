import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

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

const CheckoutSchema = z.object({
  plan: z.enum(["pro", "elite"]).default("pro"),
  email: z.string().email().max(320).optional(),
  successUrl: z.string().url().max(500).optional(),
  cancelUrl: z.string().url().max(500).optional(),
});

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });
}

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}

export async function POST(req: NextRequest) {
  // Rate limiting — 3 checkout attempts per minute per IP
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`billing:${ip}`, RATE_LIMITS.billing.limit, RATE_LIMITS.billing.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.message },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  try {
    const rawBody = await req.json();
    const parsed = CheckoutSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const { plan: planKey, email } = parsed.data;
    const plan = PLANS[planKey];

    // Determine safe origin — only allow our own domain
    const origin = req.headers.get("origin") ?? "https://pocketmanager.online";
    const allowedOrigins = ["https://pocketmanager.online", "http://localhost:3000", "https://pocketmanager.vercel.app"];
    const safeOrigin = allowedOrigins.includes(origin) ? origin : "https://pocketmanager.online";

    const successUrl = parsed.data.successUrl ?? `${safeOrigin}/settings?upgraded=${planKey}`;
    const cancelUrl = parsed.data.cancelUrl ?? `${safeOrigin}/settings`;

    const stripe = getStripe();

    if (!stripe) {
      // Dev/staging — return mock for local development only
      console.warn("[billing] Stripe not configured — returning mock URL");
      return NextResponse.json({ url: successUrl, mock: true, plan: plan.name });
    }

    const priceId = planKey === "elite"
      ? process.env.STRIPE_ELITE_PRICE_ID
      : process.env.STRIPE_PRO_PRICE_ID;

    let lineItems: Stripe.Checkout.SessionCreateParams["line_items"];

    if (priceId) {
      lineItems = [{ price: priceId, quantity: 1 }];
    } else {
      // Dynamic pricing — no pre-created product needed
      // This works fine for launch; add price IDs later for better analytics
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

    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });

  } catch (err) {
    // Never expose Stripe error details to client
    console.error("[billing] Checkout error:", err instanceof Error ? err.message : "Unknown");
    return NextResponse.json({ error: "Billing unavailable. Please try again." }, { status: 500 });
  }
}
