export const ASSET_TO_PHOTO_CATEGORIES = {
  engines_pumpers: [
    "exterior",
    "interior",
    "engine",
    "tires",
    "pump_panel",
    "hose_storage",
    "equipment",
    "documents",
    "other",
    "unknown"
  ],
  ladders_aerials_quints: [
    "exterior",
    "interior",
    "engine",
    "tires",
    "ladder",
    "pump_panel",
    "outriggers",
    "equipment",
    "documents",
    "other",
    "unknown"
  ],
  tankers_tenders: [
    "exterior",
    "interior",
    "engine",
    "tires",
    "tank",
    "pump_panel",
    "equipment",
    "documents",
    "other",
    "unknown"
  ],
  rescue_trucks_squads: [
    "exterior",
    "interior",
    "engine",
    "tires",
    "compartments",
    "equipment",
    "documents",
    "other",
    "unknown"
  ],
  brush_trucks_minis: [
    "exterior",
    "interior",
    "engine",
    "tires",
    "skid_unit",
    "pump_panel",
    "equipment",
    "documents",
    "other",
    "unknown"
  ],
  ambulances: [
    "exterior",
    "interior",
    "engine",
    "tires",
    "patient_area",
    "equipment",
    "documents",
    "other",
    "unknown"
  ],
  dump_trucks: [
    "exterior",
    "interior",
    "engine",
    "tires",
    "dump_bed",
    "hydraulics",
    "documents",
    "other",
    "unknown"
  ],
  heavy_equipment: [
    "exterior",
    "cab",
    "engine",
    "tires",
    "tracks",
    "attachment",
    "hydraulics",
    "documents",
    "other",
    "unknown"
  ]
} as const;

export type AssetCategoryKey = keyof typeof ASSET_TO_PHOTO_CATEGORIES;
export type PhotoCategoryValue =
  (typeof ASSET_TO_PHOTO_CATEGORIES)[AssetCategoryKey][number];
