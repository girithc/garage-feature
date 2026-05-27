export type ListingRecord = {
  id: string;
  title: string;
  assetCategory: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  location?: string | null;
  price?: number | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListingInput = {
  title: string;
  assetCategory: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  location?: string | null;
  price?: number | null;
  description?: string | null;
};
