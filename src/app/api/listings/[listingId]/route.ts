import { NextResponse } from "next/server";

import { getListingDetail } from "@/features/listings/server/listing.queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  const listing = await getListingDetail(listingId);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json(listing);
}
