import { NextResponse } from "next/server";
import { getPopularCatalog } from "@/lib/search";

export const revalidate = 420;

export async function GET() {
  const catalog = await getPopularCatalog();
  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": "public, s-maxage=420, stale-while-revalidate=120",
    },
  });
}
