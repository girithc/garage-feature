import type { ListingRecord } from "@/features/listings/types";
import type { PhotoRecord } from "@/features/photos/types";

export type SearchResult = {
  listing: ListingRecord;
  matchedPhotos: Array<
    PhotoRecord & {
      finalCategory: string;
      finalCategories: string[];
      matchedTerms: string[];
    }
  >;
  matchedListingFields: string[];
  score: number;
};
