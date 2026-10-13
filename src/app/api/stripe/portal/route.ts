import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createPortalSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Влезте в акаунта." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "Няма активен Stripe клиент." },
      { status: 400 }
    );
  }

  try {
    const origin = new URL(request.url).origin;
    const portal = await createPortalSession({
      customerId: user.stripeCustomerId,
      origin,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Порталът не е наличен.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
