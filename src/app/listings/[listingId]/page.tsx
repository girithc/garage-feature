import { notFound } from "next/navigation";

import { ListingDetailExperience } from "@/features/listings/components/ListingDetailExperience";
import { getListingDetail } from "@/features/listings/server/listing.queries";
import { getAllowedPhotoCategories } from "@/server/taxonomy/taxonomy.service";

export default async function ListingDetailPage({
  params
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const listing = await getListingDetail(listingId);

  if (!listing) {
    notFound();
  }

  const allowedCategories = getAllowedPhotoCategories(listing.assetCategory);

  return <ListingDetailExperience allowedCategories={allowedCategories} listing={listing} />;
}
