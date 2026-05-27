import { z } from "zod";

import type { ListingInput } from "@/features/listings/types";
import { createListing } from "@/server/demo/demoStore";
import { attachPresetPhotosToListingAction } from "@/features/photos/server/photo.actions";

const listingInputSchema = z.object({
  title: z.string().min(3),
  assetCategory: z.string().min(1),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  price: z.number().int().nonnegative().nullable().optional(),
  description: z.string().optional().nullable(),
  presetPhotoAssetPaths: z.array(z.string()).optional().default([])
});

export async function createListingAction(
  input: ListingInput & { presetPhotoAssetPaths?: string[] }
) {
  const parsed = listingInputSchema.parse(input);
  const listing = await createListing(parsed);

  if (parsed.presetPhotoAssetPaths.length > 0) {
    await attachPresetPhotosToListingAction({
      listingId: listing.id,
      presetPhotoAssetPaths: parsed.presetPhotoAssetPaths
    });
  }

  return listing;
}
