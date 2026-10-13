import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { PlanId } from "@/lib/entitlements";
import { createCheckoutSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Влезте в акаунта." }, { status: 401 });
  }

  let plan: PlanId = "pro";
  try {
    const body = await request.json();
    if (body.plan === "clinic") plan = "clinic";
  } catch {
    /* default pro */
  }

  if (plan !== "pro" && plan !== "clinic") {
    return NextResponse.json({ error: "Невалиден план." }, { status: 400 });
  }

  try {
    const origin = new URL(request.url).origin;
    const checkout = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email,
      plan,
      origin,
    });
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe не е конфигуриран.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
