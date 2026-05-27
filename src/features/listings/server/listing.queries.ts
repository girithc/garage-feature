import { listPhotosByListingId, getListingById, listListings } from "@/server/demo/demoStore";

export async function getListings() {
  const listings = await listListings();

  const photoCounts = await Promise.all(
    listings.map(async (listing) => {
      const photos = await listPhotosByListingId(listing.id);
      return [listing.id, photos.length] as const;
    })
  );

  const countMap = new Map(photoCounts);

  return listings.map((listing) => ({
    ...listing,
    photoCount: countMap.get(listing.id) ?? 0
  }));
}

export async function getListingDetail(listingId: string) {
  const listing = await getListingById(listingId);

  if (!listing) {
    return null;
  }

  const photos = await listPhotosByListingId(listing.id);

  return {
    ...listing,
    photos
  };
}
