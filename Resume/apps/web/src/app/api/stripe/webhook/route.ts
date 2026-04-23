import { NextRequest, NextResponse } from "next/server";
import { prisma, sendSubscriptionSuccessEmail } from "@repo/core";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_test_your")) return null;
  return new Stripe(key);
}

const VALID_PLANS = ["FREE", "EARLY_BIRD", "PREMIUM"] as const;

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret || webhookSecret.startsWith("whsec_your")) {
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as
        | (typeof VALID_PLANS)[number]
        | undefined;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (userId && plan && VALID_PLANS.includes(plan)) {
        const user = await prisma.user.update({
          where: { id: userId },
          data: { 
            plan,
            stripeCustomerId,
            stripeSubscriptionId
          },
        });
        
        console.log(`[Stripe Webhook] Upgraded user ${userId} → ${plan}`);

        // Send confirmation email
        try {
          await sendSubscriptionSuccessEmail(user.email, user.name, plan);
        } catch (err) {
          console.error("[Stripe Webhook] Email notification failed:", err);
        }
      }
    }

    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.paused"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: "FREE" },
      });
      
      console.log(
        `[Stripe Webhook] Downgraded customer ${customerId} to FREE (Subscription deleted/paused)`
      );
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
