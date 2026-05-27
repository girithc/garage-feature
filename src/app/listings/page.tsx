import { ListingCard } from "@/features/listings/components/ListingCard";
import { getListings } from "@/features/listings/server/listing.queries";
import { getListingPhotos } from "@/features/photos/server/photo.queries";
import { searchListings } from "@/features/search/server/search.queries";
import { getFinalPhotoCategories } from "@/server/taxonomy/taxonomy.service";

type ListingsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

function getPreferredPreviewPhoto<
  T extends {
    correctedCategory?: string | null;
    correctedCategories?: string[] | null;
    predictedCategory?: string | null;
    predictedCategories?: string[] | null;
  }
>(photos: T[]) {
  return (
    photos.find((photo) => getFinalPhotoCategories(photo).includes("exterior")) ??
    photos.find((photo) => getFinalPhotoCategories(photo).includes("interior")) ??
    photos[0]
  );
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const listings = query
    ? (await searchListings(query)).map((result) => result.listing)
    : await getListings();

  const cards = await Promise.all(
    listings.map(async (listing) => {
      const photos = await getListingPhotos(listing.id);
      const previewPhoto = getPreferredPreviewPhoto(photos);
      const listingWithCount = listing as unknown as { photoCount?: number };
      const photoCount =
        typeof listingWithCount.photoCount === "number"
          ? listingWithCount.photoCount
          : photos.length;

      return {
        ...listing,
        photoCount,
        heroPhotoUrl: previewPhoto?.url,
        heroPhotoCategory:
          previewPhoto?.correctedCategory ?? previewPhoto?.predictedCategory
      };
    })
  );

  const heroImage = cards[0]?.heroPhotoUrl;

  return (
    <div className="mx-[-24px] space-y-0 md:mx-[-32px]">
      <section className="relative overflow-hidden border-y border-black/8 bg-[#181818]">
        <div className="absolute inset-0">
          {heroImage ? (
            <div
              className="h-full w-full bg-cover bg-center opacity-70"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,24,24,0.96)_0%,rgba(24,24,24,0.88)_34%,rgba(24,24,24,0.45)_72%,rgba(24,24,24,0.2)_100%)]" />
        </div>
        <div className="relative mx-auto flex min-h-[204px] max-w-[1720px] items-end px-8 py-9 md:px-12">
          <div>
            <h1 className="text-5xl font-semibold tracking-[-0.04em] text-white md:text-[4.5rem]">
              {query ? `Results for "${query}"` : "Ambulances"}
            </h1>
            {query ? (
              <p className="mt-3 text-base text-white/72">
                {cards.length} {cards.length === 1 ? "listing" : "listings"} matched your search.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 bg-white/88 px-8 py-5 md:px-12">
        <div className="mx-auto flex max-w-[1720px] items-center gap-3 text-[1.05rem] text-black/72">
          <span className="underline decoration-black/28 underline-offset-4">Vehicles</span>
          <span>/</span>
          <span className="flex items-center gap-2 font-medium text-black">
            {query ? "Search results" : "Ambulances"}
          </span>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1720px] px-8 py-12 md:px-12">
          {cards.length ? (
            <div className="grid gap-x-5 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] border border-black/10 bg-white px-8 py-16 text-center text-black/60">
              No listings matched <span className="font-medium text-black">{query}</span>.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
