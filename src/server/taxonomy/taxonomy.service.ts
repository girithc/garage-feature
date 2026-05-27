import {
  ASSET_TO_PHOTO_CATEGORIES,
  type AssetCategoryKey,
  type PhotoCategoryValue
} from "@/server/taxonomy/assetPhotoCategories";

export function getAllowedPhotoCategories(assetCategory: string): readonly string[] {
  return (
    ASSET_TO_PHOTO_CATEGORIES[assetCategory as AssetCategoryKey] ??
    ASSET_TO_PHOTO_CATEGORIES.engines_pumpers
  );
}

export function normalizePhotoCategory(
  assetCategory: string,
  category?: string | null
): PhotoCategoryValue {
  const allowedCategories = getAllowedPhotoCategories(assetCategory);

  if (category && allowedCategories.includes(category)) {
    return category as PhotoCategoryValue;
  }

  return "unknown";
}

export function normalizePhotoCategories(
  assetCategory: string,
  categories?: Array<string | null | undefined>
) {
  const normalized = Array.from(
    new Set(
      (categories ?? [])
        .map((category) => normalizePhotoCategory(assetCategory, category))
        .filter(Boolean)
    )
  );

  return normalized.length > 0 ? normalized : ["unknown"];
}

export function getFinalPhotoCategories(photo: {
  predictedCategory?: string | null;
  predictedCategories?: string[] | null;
  correctedCategory?: string | null;
  correctedCategories?: string[] | null;
}) {
  if (photo.correctedCategories?.length) {
    return photo.correctedCategories;
  }

  if (photo.correctedCategory) {
    return [photo.correctedCategory];
  }

  if (photo.predictedCategories?.length) {
    return photo.predictedCategories;
  }

  if (photo.predictedCategory) {
    return [photo.predictedCategory];
  }

  return ["unknown"];
}

export function getPrimaryPhotoCategory(photo: {
  predictedCategory?: string | null;
  predictedCategories?: string[] | null;
  correctedCategory?: string | null;
  correctedCategories?: string[] | null;
}) {
  return getFinalPhotoCategories(photo)[0] ?? "unknown";
}

export function getPresentGalleryTabs(photos: Array<{
  predictedCategory?: string | null;
  predictedCategories?: string[] | null;
  correctedCategory?: string | null;
  correctedCategories?: string[] | null;
}>) {
  const presentCategories = Array.from(
    new Set(
      photos.flatMap((photo) => getFinalPhotoCategories(photo)).filter((category) => category !== "unknown")
    )
  );

  return ["all", ...presentCategories];
}
