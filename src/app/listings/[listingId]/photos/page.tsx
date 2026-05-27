import { redirect } from "next/navigation";

export default async function ListingPhotosPage({
  params
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  redirect(`/listings/${listingId}`);
}
