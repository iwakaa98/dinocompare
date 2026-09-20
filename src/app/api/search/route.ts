import { NextResponse } from "next/server";
import { runProductSearch } from "@/lib/search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query : "";
    if (!query.trim()) {
      return NextResponse.json(
        { error: "Въведете име на продукт за сравнение." },
        { status: 400 }
      );
    }

    const result = await runProductSearch(query);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Търсенето не успя.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
