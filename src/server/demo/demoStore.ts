import { Prisma, type Listing, type Photo } from "@prisma/client";

import type { ListingInput, ListingRecord } from "@/features/listings/types";
import type { PhotoAnalysis, PhotoRecord } from "@/features/photos/types";
import { AppError } from "@/lib/errors";
import { getPrismaClient } from "@/server/db/prisma";
import { demoSeedData } from "@/server/demo/seedData";

type DemoStoreData = {
  listings: ListingRecord[];
  photos: PhotoRecord[];
};

function getDb() {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new AppError("NEON_URL is required for database access.", 500);
  }

  return prisma;
}

function mapListingRecord(listing: Listing): ListingRecord {
  return {
    id: listing.id,
    title: listing.title,
    assetCategory: listing.assetCategory,
    year: listing.year,
    make: listing.make,
    model: listing.model,
    location: listing.location,
    price: listing.price,
    description: listing.description,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString()
  };
}

function mapPhotoRecord(photo: Photo): PhotoRecord {
  return {
    id: photo.id,
    listingId: photo.listingId,
    url: photo.url,
    originalFileName: photo.originalFileName,
    analysisStatus: photo.analysisStatus as PhotoRecord["analysisStatus"],
    predictedCategory: photo.predictedCategory,
    predictedCategories: photo.predictedCategories,
    correctedCategory: photo.correctedCategory,
    correctedCategories: photo.correctedCategories,
    categoryConfidence: photo.categoryConfidence,
    caption: photo.caption,
    labels: photo.labels,
    aiModel: photo.aiModel,
    aiRawResponse: photo.aiRawResponse,
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt.toISOString()
  };
}

function mapListingCreateInput(input: ListingInput): Prisma.ListingCreateInput {
  return {
    title: input.title,
    assetCategory: input.assetCategory,
    year: input.year ?? null,
    make: input.make ?? null,
    model: input.model ?? null,
    location: input.location ?? null,
    price: input.price ?? null,
    description: input.description ?? null
  };
}

function mapPhotoCreateInput(params: {
  listingId: string;
  url: string;
  originalFileName?: string | null;
}) {
  return {
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
    aiRawResponse: Prisma.JsonNull
  } satisfies Prisma.PhotoUncheckedCreateInput;
}

export async function resetDemoStore() {
  const prisma = getDb();

  await prisma.$transaction(async (tx) => {
    await tx.photo.deleteMany();
    await tx.listing.deleteMany();

    for (const listing of demoSeedData.listings) {
      await tx.listing.create({
        data: {
          id: listing.id,
          title: listing.title,
          assetCategory: listing.assetCategory,
          year: listing.year ?? null,
          make: listing.make ?? null,
          model: listing.model ?? null,
          location: listing.location ?? null,
          price: listing.price ?? null,
          description: listing.description ?? null,
          createdAt: new Date(listing.createdAt),
          updatedAt: new Date(listing.updatedAt)
        }
      });
    }

    for (const photo of demoSeedData.photos) {
      await tx.photo.create({
        data: {
          id: photo.id,
          listingId: photo.listingId,
          url: photo.url,
          originalFileName: photo.originalFileName ?? null,
          analysisStatus: photo.analysisStatus ?? "completed",
          predictedCategory: photo.predictedCategory ?? null,
          predictedCategories: photo.predictedCategories ?? [],
          correctedCategory: photo.correctedCategory ?? null,
          correctedCategories: photo.correctedCategories ?? [],
          categoryConfidence: photo.categoryConfidence ?? null,
          caption: photo.caption ?? null,
          labels: photo.labels,
          aiModel: photo.aiModel ?? null,
          aiRawResponse:
            photo.aiRawResponse === undefined ? Prisma.JsonNull : (photo.aiRawResponse as Prisma.InputJsonValue),
          createdAt: new Date(photo.createdAt),
          updatedAt: new Date(photo.updatedAt)
        }
      });
    }
  });
}

export async function listListings() {
  const prisma = getDb();
  const listings = await prisma.listing.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  return listings.map(mapListingRecord);
}

export async function getListingById(listingId: string) {
  const prisma = getDb();
  const listing = await prisma.listing.findUnique({
    where: { id: listingId }
  });

  return listing ? mapListingRecord(listing) : null;
}

export async function createListing(input: ListingInput) {
  const prisma = getDb();
  const listing = await prisma.listing.create({
    data: mapListingCreateInput(input)
  });

  return mapListingRecord(listing);
}

export async function updateListing(listingId: string, patch: Partial<ListingRecord>) {
  const prisma = getDb();

  try {
    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        title: patch.title,
        assetCategory: patch.assetCategory,
        year: patch.year,
        make: patch.make,
        model: patch.model,
        location: patch.location,
        price: patch.price,
        description: patch.description
      }
    });

    return mapListingRecord(listing);
  } catch {
    throw new AppError("Listing not found.", 404);
  }
}

export async function listPhotosByListingId(listingId: string) {
  const prisma = getDb();
  const photos = await prisma.photo.findMany({
    where: { listingId },
    orderBy: {
      createdAt: "asc"
    }
  });

  return photos.map(mapPhotoRecord);
}

export async function getPhotoById(photoId: string) {
  const prisma = getDb();
  const photo = await prisma.photo.findUnique({
    where: { id: photoId }
  });

  return photo ? mapPhotoRecord(photo) : null;
}

export async function createPhoto(params: {
  listingId: string;
  url: string;
  originalFileName?: string | null;
}) {
  const prisma = getDb();
  const photo = await prisma.photo.create({
    data: mapPhotoCreateInput(params)
  });

  return mapPhotoRecord(photo);
}

export async function updatePhotoAnalysis(photoId: string, analysis: PhotoAnalysis) {
  const prisma = getDb();

  try {
    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: {
        predictedCategory: analysis.category,
        predictedCategories: analysis.categories,
        analysisStatus: "completed",
        categoryConfidence: analysis.confidence,
        caption: analysis.caption,
        labels: analysis.labels,
        aiModel: analysis.aiModel,
        aiRawResponse: analysis.aiRawResponse as Prisma.InputJsonValue
      }
    });

    return mapPhotoRecord(photo);
  } catch {
    throw new AppError("Photo not found.", 404);
  }
}

export async function updatePhotoCorrection(
  photoId: string,
  correctedCategory: string | null,
  correctedCategories?: string[]
) {
  const prisma = getDb();

  try {
    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: {
        correctedCategory,
        correctedCategories: correctedCategories ?? (correctedCategory ? [correctedCategory] : [])
      }
    });

    return mapPhotoRecord(photo);
  } catch {
    throw new AppError("Photo not found.", 404);
  }
}

export async function claimPendingPhotosForAnalysis(listingId: string) {
  const prisma = getDb();

  return prisma.$transaction(async (tx) => {
    const pendingPhotos = await tx.photo.findMany({
      where: {
        listingId,
        analysisStatus: {
          in: ["pending", "processing"]
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (!pendingPhotos.length) {
      return [];
    }

    await tx.photo.updateMany({
      where: {
        id: {
          in: pendingPhotos.map((photo) => photo.id)
        }
      },
      data: {
        analysisStatus: "processing"
      }
    });

    const refreshedPhotos = await tx.photo.findMany({
      where: {
        id: {
          in: pendingPhotos.map((photo) => photo.id)
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return refreshedPhotos.map(mapPhotoRecord);
  });
}

export async function markPhotoAnalysisFailed(photoId: string) {
  const prisma = getDb();

  try {
    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: {
        analysisStatus: "failed"
      }
    });

    return mapPhotoRecord(photo);
  } catch {
    throw new AppError("Photo not found.", 404);
  }
}

export async function getSearchIndex(): Promise<DemoStoreData> {
  const prisma = getDb();
  const [listings, photos] = await Promise.all([
    prisma.listing.findMany(),
    prisma.photo.findMany()
  ]);

  return {
    listings: listings.map(mapListingRecord),
    photos: photos.map(mapPhotoRecord)
  };
}
