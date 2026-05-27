import { readdir } from "node:fs/promises";
import path from "node:path";

import type { ListingInput } from "@/features/listings/types";

export type DemoListingPreset = {
  id: string;
  label: string;
  listing: ListingInput;
  assetDirectory: string;
};

export const demoListingPresets: DemoListingPreset[] = [
  {
    id: "ambulance",
    label: "Ambulance",
    assetDirectory: "ambulance-1",
    listing: {
      title: "2019 Ford E-450 Type III Ambulance",
      assetCategory: "ambulances",
      year: 2019,
      make: "Ford",
      model: "E-450",
      location: "Nashua, NH",
      price: 128000,
      description:
        "Type III ambulance with patient compartment cabinetry, exterior warning lights, cab controls, and service-ready medical transport configuration."
    }
  },
  {
    id: "tanker",
    label: "Pumper Tanker",
    assetDirectory: "tanker-1",
    listing: {
      title: "2019 US Tanker Freightliner Pumper Tanker",
      assetCategory: "tankers_tenders",
      year: 2019,
      make: "US Tanker",
      model: "Freightliner",
      location: "NC",
      price: 289000,
      description:
        "Verified seller tanker based in NC with 12,893 miles, a 1,250 GPM pump, and a 2,000 gallon tank. Built for shuttle work and rural water supply with pumper tanker configuration."
    }
  }
] as const;

export async function getPresetAssetPaths(assetDirectory: string) {
  const presetDirectory = path.join(process.cwd(), "assets", assetDirectory);
  const fileNames = await readdir(presetDirectory);

  return fileNames
    .filter((fileName) => fileName.toLowerCase().endsWith(".webp"))
    .sort()
    .map((fileName) => `${assetDirectory}/${fileName}`);
}

export function demoAssetPathToUrl(assetPath: string) {
  return `/api/demo-assets/${assetPath.replaceAll("\\", "/")}`;
}
