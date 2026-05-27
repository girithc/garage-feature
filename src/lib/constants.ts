export const ASSET_CATEGORY_OPTIONS = [
  { value: "engines_pumpers", label: "Engines & Pumpers" },
  { value: "ladders_aerials_quints", label: "Ladders / Aerials / Quints" },
  { value: "tankers_tenders", label: "Tankers / Tenders" },
  { value: "rescue_trucks_squads", label: "Rescue Trucks / Squads" },
  { value: "brush_trucks_minis", label: "Brush Trucks / Minis" },
  { value: "ambulances", label: "Ambulances" },
  { value: "dump_trucks", label: "Dump Trucks" },
  { value: "heavy_equipment", label: "Heavy Equipment" }
] as const;

export const DEFAULT_GALLERY_TABS = [
  "all",
  "exterior",
  "interior",
  "engine",
  "tires",
  "pump_panel",
  "equipment",
  "documents",
  "other"
] as const;

export const NAV_LINKS = [
  { href: "/", label: "Create listing" },
  { href: "/listings", label: "Listings" }
];
