import Stripe from "stripe";
import type { PlanId } from "@/lib/entitlements";

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY не е зададен.");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export function priceIdForPlan(plan: Exclude<PlanId, "free">): string {
  if (plan === "pro") {
    const id = process.env.STRIPE_PRICE_PRO;
    if (!id) throw new Error("STRIPE_PRICE_PRO не е зададен.");
    return id;
  }
  const id = process.env.STRIPE_PRICE_CLINIC;
  if (!id) throw new Error("STRIPE_PRICE_CLINIC не е зададен.");
  return id;
}

export async function createCheckoutSession(input: {
  userId: string;
  email: string;
  plan: Exclude<PlanId, "free">;
  origin: string;
}) {
  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.email,
    client_reference_id: input.userId,
    line_items: [{ price: priceIdForPlan(input.plan), quantity: 1 }],
    success_url: `${input.origin}/?checkout=success`,
    cancel_url: `${input.origin}/pricing?checkout=cancel`,
    metadata: {
      userId: input.userId,
      plan: input.plan,
    },
    subscription_data: {
      metadata: {
        userId: input.userId,
        plan: input.plan,
      },
    },
  });
  return session;
}

export async function createPortalSession(input: {
  customerId: string;
  origin: string;
}) {
  const stripe = stripeClient();
  return stripe.billingPortal.sessions.create({
    customer: input.customerId,
    return_url: `${input.origin}/`,
  });
}

export function constructWebhookEvent(body: string, signature: string) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET не е зададен.");
  return stripe.webhooks.constructEvent(body, signature, secret);
}

export { stripeClient };
