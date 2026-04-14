import { NextRequest, NextResponse } from "next/server";

// Stripe Customer Portal scaffold.
// Wire by adding: STRIPE_SECRET_KEY + STRIPE_CUSTOMER_ID (from user record)
//
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { customerId?: string; returnUrl?: string };
    const returnUrl = body.returnUrl ?? `${req.headers.get("origin") ?? ""}/settings`;

    if (!process.env.STRIPE_SECRET_KEY || !body.customerId) {
      // Mock portal for development
      return NextResponse.json({ url: returnUrl, mock: true });
    }

    // Real portal (uncomment when stripe is installed):
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: body.customerId,
    //   return_url: returnUrl,
    // });
    // return NextResponse.json({ url: session.url });

    return NextResponse.json({ url: returnUrl, mock: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
