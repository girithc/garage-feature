import { ListingForm } from "@/features/listings/components/ListingForm";
import {
  demoListingPresets,
  demoAssetPathToUrl,
  getPresetAssetPaths
} from "@/server/demo/demoPresets";

export default async function HomePage() {
  const presetOptions = await Promise.all(
    demoListingPresets.map(async (preset) => {
      const presetPhotoAssetPaths = await getPresetAssetPaths(preset.assetDirectory);

      return {
        id: preset.id,
        label: preset.label,
        initialValues: preset.listing,
        presetPhotoAssetPaths,
        presetPhotoUrls: presetPhotoAssetPaths.map((assetPath) => demoAssetPathToUrl(assetPath))
      };
    })
  );

  return (
    <ListingForm
      description=""
      eyebrow=""
      heading="Create listing"
      presetOptions={presetOptions}
      submitLabel="Create listing"
    />
  );
}
