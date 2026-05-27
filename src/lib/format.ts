import { ASSET_CATEGORY_OPTIONS } from "@/lib/constants";

export function formatCurrency(value?: number | null) {
  if (!value) {
    return "Price on request";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatAssetCategory(assetCategory: string) {
  return (
    ASSET_CATEGORY_OPTIONS.find((option) => option.value === assetCategory)?.label ??
    startCase(assetCategory)
  );
}

export function formatPhotoCategory(category?: string | null) {
  if (!category) {
    return "Uncategorized";
  }

  return startCase(category.replaceAll("_", " "));
}

export function startCase(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
