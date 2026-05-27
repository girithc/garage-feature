import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ListingInput, ListingRecord } from "@/features/listings/types";
import type { PhotoAnalysis, PhotoRecord } from "@/features/photos/types";
import { AppError } from "@/lib/errors";
import { demoSeedData } from "@/server/demo/seedData";

type DemoStoreData = {
  listings: ListingRecord[];
  photos: PhotoRecord[];
};

const dataDirectory = path.join(process.cwd(), "data");
const dataFilePath = path.join(dataDirectory, "demo-store.json");
let mutationQueue = Promise.resolve();

async function ensureStoreFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(dataFilePath, "utf8");
  } catch {
    await writeFile(dataFilePath, JSON.stringify(demoSeedData, null, 2), "utf8");
  }
}

async function readStore(): Promise<DemoStoreData> {
  await ensureStoreFile();
  const raw = await readFile(dataFilePath, "utf8");

  try {
    return JSON.parse(raw) as DemoStoreData;
  } catch {
    await writeStore(demoSeedData);
    return structuredClone(demoSeedData) as DemoStoreData;
  }
}

async function writeStore(store: DemoStoreData) {
  await writeFile(dataFilePath, JSON.stringify(store, null, 2), "utf8");
}

async function mutateStore<T>(mutator: (store: DemoStoreData) => Promise<T> | T): Promise<T> {
  const run = mutationQueue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });

  mutationQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
}

export async function resetDemoStore() {
  await ensureStoreFile();
  await writeStore(demoSeedData);
}

export async function listListings() {
  const store = await readStore();
  return store.listings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getListingById(listingId: string) {
  const store = await readStore();
  return store.listings.find((listing) => listing.id === listingId) ?? null;
}

export async function createListing(input: ListingInput) {
  return mutateStore((store) => {
    const timestamp = new Date().toISOString();
    const listing: ListingRecord = {
      id: crypto.randomUUID(),
      title: input.title,
      assetCategory: input.assetCategory,
      year: input.year ?? null,
      make: input.make ?? null,
      model: input.model ?? null,
      location: input.location ?? null,
      price: input.price ?? null,
      description: input.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    store.listings.unshift(listing);
    return listing;
  });
}

export async function updateListing(listingId: string, patch: Partial<ListingRecord>) {
  return mutateStore((store) => {
    const listing = store.listings.find((item) => item.id === listingId);

    if (!listing) {
      throw new AppError("Listing not found.", 404);
    }

    Object.assign(listing, patch, { updatedAt: new Date().toISOString() });
    return listing;
  });
}

export async function listPhotosByListingId(listingId: string) {
  const store = await readStore();
  return store.photos
    .filter((photo) => photo.listingId === listingId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getPhotoById(photoId: string) {
  const store = await readStore();
  return store.photos.find((photo) => photo.id === photoId) ?? null;
}

export async function createPhoto(params: {
  listingId: string;
  url: string;
  originalFileName?: string | null;
}) {
  return mutateStore((store) => {
    const timestamp = new Date().toISOString();
    const photo: PhotoRecord = {
      id: crypto.randomUUID(),
      listingId: params.listingId,
      url: params.url,
      originalFileName: params.originalFileName ?? null,
      analysisStatus: "pending",
      predictedCategory: "unknown",
      predictedCategories: ["unknown"],
      correctedCategory: null,
      correctedCategories: [],
      categoryConfidence: null,
      caption: null,
      labels: [],
      aiModel: null,
      aiRawResponse: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    store.photos.push(photo);
    return photo;
  });
}

export async function updatePhotoAnalysis(photoId: string, analysis: PhotoAnalysis) {
  return mutateStore((store) => {
    const photo = store.photos.find((item) => item.id === photoId);

    if (!photo) {
      throw new AppError("Photo not found.", 404);
    }

    photo.predictedCategory = analysis.category;
    photo.predictedCategories = analysis.categories;
    photo.analysisStatus = "completed";
    photo.categoryConfidence = analysis.confidence;
    photo.caption = analysis.caption;
    photo.labels = analysis.labels;
    photo.aiModel = analysis.aiModel;
    photo.aiRawResponse = analysis.aiRawResponse;
    photo.updatedAt = new Date().toISOString();

    return photo;
  });
}

export async function updatePhotoCorrection(
  photoId: string,
  correctedCategory: string | null,
  correctedCategories?: string[]
) {
  return mutateStore((store) => {
    const photo = store.photos.find((item) => item.id === photoId);

    if (!photo) {
      throw new AppError("Photo not found.", 404);
    }

    photo.correctedCategory = correctedCategory;
    photo.correctedCategories = correctedCategories ?? (correctedCategory ? [correctedCategory] : []);
    photo.updatedAt = new Date().toISOString();

    return photo;
  });
}

export async function claimPendingPhotosForAnalysis(listingId: string) {
  return mutateStore((store) => {
    const pendingPhotos = store.photos.filter(
      (photo) =>
        photo.listingId === listingId &&
        (photo.analysisStatus === "pending" || photo.analysisStatus === "processing")
    );

    pendingPhotos.forEach((photo) => {
      photo.analysisStatus = "processing";
      photo.updatedAt = new Date().toISOString();
    });

    return pendingPhotos.map((photo) => ({ ...photo }));
  });
}

export async function markPhotoAnalysisFailed(photoId: string) {
  return mutateStore((store) => {
    const photo = store.photos.find((item) => item.id === photoId);

    if (!photo) {
      throw new AppError("Photo not found.", 404);
    }

    photo.analysisStatus = "failed";
    photo.updatedAt = new Date().toISOString();
    return photo;
  });
}

export async function getSearchIndex() {
  const store = await readStore();
  return store;
}
