import { NextResponse } from "next/server";
import { refreshCatalogSnapshots } from "@/lib/catalog-snapshot";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshCatalogSnapshots();
  return NextResponse.json(result);
}
