import type { ListingRecord } from "@/features/listings/types";
import type { PhotoRecord } from "@/features/photos/types";

type DemoStore = {
  listings: ListingRecord[];
  photos: PhotoRecord[];
};

export const demoSeedData: DemoStore = {
  listings: [],
  photos: []
};
