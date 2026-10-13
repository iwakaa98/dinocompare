import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { constructWebhookEvent, stripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  const plan = subscription.metadata.plan === "clinic" ? "clinic" : "pro";
  if (!userId) return;

  const status =
    subscription.status === "active" || subscription.status === "trialing"
      ? "active"
      : subscription.status;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      plan: status === "active" ? plan : "free",
      planStatus: status,
      planCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.userId;
    const subscriptionId = session.subscription;
    if (userId && typeof subscriptionId === "string") {
      const stripe = stripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription);
      if (session.customer && typeof session.customer === "string") {
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: session.customer },
        });
      }
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    await syncSubscription(subscription);
    if (event.type === "customer.subscription.deleted") {
      const userId = subscription.metadata.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "free",
            planStatus: "canceled",
            stripeSubscriptionId: null,
          },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
