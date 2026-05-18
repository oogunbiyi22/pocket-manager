import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { customerId?: string; returnUrl?: string };
    const origin = req.headers.get("origin") ?? "https://pocketmanager.app";
    const returnUrl = body.returnUrl ?? `${origin}/settings`;

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Billing portal is not configured yet." }, { status: 503 });
    }

    if (!body.customerId) {
      return NextResponse.json({ error: "No Stripe customer is linked to this account yet." }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: body.customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
