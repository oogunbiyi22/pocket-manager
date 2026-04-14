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
    if (!stripe || !body.customerId) {
      return NextResponse.json({ url: returnUrl, mock: true });
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
