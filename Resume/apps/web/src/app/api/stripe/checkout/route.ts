import { NextRequest, NextResponse } from "next/server";
import { auth, prisma } from "@repo/core";
import { headers } from "next/headers";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_test_your")) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(key);
}

const PRICE_IDS: Record<string, string | undefined> = {
  EARLY_BIRD: process.env.STRIPE_PRO_PRICE_ID,
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();
    if (!plan || !["EARLY_BIRD", "PREMIUM"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Choose EARLY_BIRD or PREMIUM." },
        { status: 400 },
      );
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId || priceId.startsWith("price_your")) {
      return NextResponse.json(
        { error: "Stripe is not yet configured. Add your Price IDs to .env." },
        { status: 503 },
      );
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Look up or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user?.email ?? session.user.email,
      metadata: {
        userId: session.user.id,
        plan,
      },
      success_url: `${appUrl}/dashboard/billing?success=1&plan=${plan}`,
      cancel_url: `${appUrl}/dashboard/billing?cancelled=1`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
