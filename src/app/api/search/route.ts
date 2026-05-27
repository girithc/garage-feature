import { NextResponse } from "next/server";

import { searchListings } from "@/features/search/server/search.queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const results = await searchListings(query);
  return NextResponse.json(results);
}
