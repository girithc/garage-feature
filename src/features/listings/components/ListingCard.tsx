import Link from "next/link";
import Image from "next/image";

import { PhotoThumbnail } from "@/features/photos/components/PhotoThumbnail";
import { formatCurrency } from "@/lib/format";

type ListingCardProps = {
  listing: {
    id: string;
    title: string;
    assetCategory: string;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    location?: string | null;
    price?: number | null;
    photoCount: number;
    heroPhotoUrl?: string;
    heroPhotoCategory?: string | null;
  };
};

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link
      className="group block"
      href={`/listings/${listing.id}`}
    >
      <article className="space-y-3">
        <div className="overflow-hidden rounded-[12px] border border-black/8 bg-white">
          {listing.heroPhotoUrl ? (
            <Image
              alt={listing.title}
              className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.015]"
              height={900}
              src={listing.heroPhotoUrl}
              unoptimized
              width={960}
            />
          ) : (
            <div className="aspect-[4/3] w-full overflow-hidden">
              <PhotoThumbnail
                category={listing.heroPhotoCategory}
                title={listing.title}
                url="placeholder:exterior-overview"
              />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[1.02rem] font-medium leading-snug tracking-[-0.03em] text-black transition group-hover:text-[#d96f28]">
            {listing.title}
          </h2>
          <p className="text-[0.9rem] text-black/52">
            {listing.year ? `${listing.year}` : "Year n/a"}
            {listing.make ? ` • ${listing.make}` : ""}
            {listing.model ? ` • ${listing.model}` : ""}
          </p>
          <p className="text-[0.95rem] font-medium text-black/92">{formatCurrency(listing.price)}</p>
        </div>
      </article>
    </Link>
  );
}
