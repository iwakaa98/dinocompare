import { NextResponse } from "next/server";
import { getPopularCatalog } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await getPopularCatalog();
  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": "public, s-maxage=420, stale-while-revalidate=120",
    },
  });
}
