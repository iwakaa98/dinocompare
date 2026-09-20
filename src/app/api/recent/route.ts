import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRecentSearches } from "@/lib/search";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getRecentSearches(session.user.id);
  return NextResponse.json({ items });
}
