import path from "node:path";

import { getListingPhotos } from "@/features/photos/server/photo.queries";
import type { PhotoAnalysisProgress, PhotoRecord } from "@/features/photos/types";
import { AppError } from "@/lib/errors";
import { analyzeImage } from "@/server/ai/imageAnalysis.service";
import {
  claimPendingPhotosForAnalysis,
  createPhoto,
  getListingById,
  getPhotoById,
  markPhotoAnalysisFailed,
  updatePhotoAnalysis,
  updatePhotoCorrection
} from "@/server/demo/demoStore";
import { demoAssetPathToUrl } from "@/server/demo/demoPresets";
import { saveUploadedFile } from "@/server/storage/storage.service";
import {
  getFinalPhotoCategories,
  normalizePhotoCategories
} from "@/server/taxonomy/taxonomy.service";

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
) {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function uploadPhotosAction(params: {
  listingId: string;
  files: File[];
  deferAnalysis?: boolean;
}) {
  const listing = await getListingById(params.listingId);

  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }

  const uploadedPhotos = await Promise.all(
    params.files.map(async (file) => {
      const saved = await saveUploadedFile(file);
      const createdPhoto = await createPhoto({
        listingId: listing.id,
        url: saved.publicUrl,
        originalFileName: file.name
      });

      if (params.deferAnalysis) {
        return createdPhoto;
      }

      const analysis = await analyzeImage({
        assetCategory: listing.assetCategory,
        imageUrl: saved.publicUrl,
        fileName: file.name
      });

      return updatePhotoAnalysis(createdPhoto.id, analysis);
    })
  );

  return uploadedPhotos;
}

export async function categorizePhotoAction(photoId: string) {
  const photo = await getPhotoById(photoId);

  if (!photo) {
    throw new AppError("Photo not found.", 404);
  }

  const listing = await getListingById(photo.listingId);

  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }

  const analysis = await analyzeImage({
    assetCategory: listing.assetCategory,
    imageUrl: photo.url,
    fileName: photo.originalFileName
  });

  return updatePhotoAnalysis(photoId, analysis);
}

export async function attachPresetPhotosToListingAction(params: {
  listingId: string;
  presetPhotoAssetPaths: string[];
}) {
  const listing = await getListingById(params.listingId);

  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }

  const createdPhotos = [];

  for (const assetPath of params.presetPhotoAssetPaths) {
    const createdPhoto = await createPhoto({
      listingId: listing.id,
      url: demoAssetPathToUrl(assetPath),
      originalFileName: path.basename(assetPath)
    });
    createdPhotos.push(createdPhoto);
  }

  return createdPhotos;
}

export async function analyzeListingPhotosAction(listingId: string) {
  return analyzeListingPhotosWithProgress(listingId);
}

function buildPhotoAnalysisProgress(listingId: string, photos: PhotoRecord[]): PhotoAnalysisProgress {
  const total = photos.length;
  const completed = photos.filter((photo) => photo.analysisStatus === "completed").length;
  const processing = photos.filter((photo) => photo.analysisStatus === "processing").length;
  const pending = photos.filter((photo) => (photo.analysisStatus ?? "pending") === "pending").length;
  const failed = photos.filter((photo) => photo.analysisStatus === "failed").length;

  return {
    listingId,
    total,
    completed,
    processing,
    pending,
    failed,
    processed: completed + failed
  };
}

export async function analyzeListingPhotosWithProgress(
  listingId: string,
  options?: {
    onProgress?: (progress: PhotoAnalysisProgress) => Promise<void> | void;
  }
) {
  const listing = await getListingById(listingId);

  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }

  const emitProgress = async () => {
    if (!options?.onProgress) {
      return;
    }

    const photos = await getListingPhotos(listing.id);
    await options.onProgress(buildPhotoAnalysisProgress(listing.id, photos));
  };

  await emitProgress();

  const pendingPhotos = await claimPendingPhotosForAnalysis(listing.id);
  await emitProgress();

  if (pendingPhotos.length === 0) {
    return getListingPhotos(listing.id);
  }

  await mapWithConcurrency(pendingPhotos, 4, async (photo) => {
    try {
      const analysis = await analyzeImage({
        assetCategory: listing.assetCategory,
        imageUrl: photo.url,
        fileName: photo.originalFileName
      });

      await updatePhotoAnalysis(photo.id, analysis);
    } catch {
      await markPhotoAnalysisFailed(photo.id);
    } finally {
      await emitProgress();
    }
  });

  return getListingPhotos(listing.id);
}

export async function correctPhotoCategoryAction(params: {
  photoId: string;
  correctedCategory: string | null;
  correctedCategories?: string[] | null;
}) {
  const photo = await getPhotoById(params.photoId);

  if (!photo) {
    throw new AppError("Photo not found.", 404);
  }

  const listing = await getListingById(photo.listingId);

  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }

  const baseCategories =
    params.correctedCategories && params.correctedCategories.length > 0
      ? params.correctedCategories
      : params.correctedCategory
        ? [params.correctedCategory, ...getFinalPhotoCategories(photo)]
        : [];
  const normalizedCategories = normalizePhotoCategories(listing.assetCategory, baseCategories);
  const normalizedPrimary = params.correctedCategory === null ? null : normalizedCategories[0];

  return updatePhotoCorrection(params.photoId, normalizedPrimary, normalizedCategories);
}
