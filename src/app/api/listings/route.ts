import { NextResponse } from "next/server";

import { createListingAction } from "@/features/listings/server/listing.actions";
import { getListings } from "@/features/listings/server/listing.queries";
import { AppError } from "@/lib/errors";

export async function GET() {
  const listings = await getListings();
  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Parameters<typeof createListingAction>[0];
    const listing = await createListingAction(payload);
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to create listing." }, { status: 400 });
  }
}
