"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { PhotoThumbnail } from "@/features/photos/components/PhotoThumbnail";
import type {
  PhotoAnalysisDone,
  PhotoAnalysisProgress,
  PhotoRecord
} from "@/features/photos/types";
import { formatAssetCategory, formatPhotoCategory } from "@/lib/format";
import {
  getFinalPhotoCategories,
  getPrimaryPhotoCategory,
  getPresentGalleryTabs
} from "@/server/taxonomy/taxonomy.service";

function isPhotoPendingAnalysis(photo: PhotoRecord) {
  const status = photo.analysisStatus ?? "pending";
  return status === "pending" || status === "processing";
}

function buildMosaicPhotos(photos: PhotoRecord[], visiblePhotos: PhotoRecord[]) {
  const selected: PhotoRecord[] = [];
  const usedPhotoIds = new Set<string>();
  const usedCategories = new Set<string>();
  const sourcePhotos = visiblePhotos.length ? visiblePhotos : photos;
  const priorityCategories = ["exterior", "interior"];

  function addPhoto(photo?: PhotoRecord) {
    if (!photo || usedPhotoIds.has(photo.id) || selected.length >= 5) {
      return;
    }

    selected.push(photo);
    usedPhotoIds.add(photo.id);

    const primaryCategory = getPrimaryPhotoCategory(photo);
    if (primaryCategory && primaryCategory !== "unknown") {
      usedCategories.add(primaryCategory);
    }
  }

  for (const category of priorityCategories) {
    addPhoto(sourcePhotos.find((photo) => getPrimaryPhotoCategory(photo) === category));
  }

  for (const photo of sourcePhotos) {
    const primaryCategory = getPrimaryPhotoCategory(photo);

    if (primaryCategory === "unknown" || usedCategories.has(primaryCategory)) {
      continue;
    }

    addPhoto(photo);
  }

  for (const photo of sourcePhotos) {
    addPhoto(photo);
  }

  for (const photo of photos) {
    addPhoto(photo);
  }

  return selected.slice(0, 5);
}

type ListingDetailExperienceProps = {
  listing: {
    id: string;
    title: string;
    assetCategory: string;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    location?: string | null;
    price?: number | null;
    description?: string | null;
    photos: PhotoRecord[];
  };
  allowedCategories: readonly string[];
};

type GalleryTileProps = {
  photo: PhotoRecord;
  large?: boolean;
  showViewButton?: boolean;
  onOpenPhoto?: () => void;
  onViewImages?: () => void;
};

type SlideshowImageProps = {
  photo: PhotoRecord;
};

type SegmentedThumbnailProps = {
  photo: PhotoRecord;
  isActive?: boolean;
  onClick: () => void;
};

function GalleryTile({
  photo,
  large = false,
  showViewButton = false,
  onOpenPhoto,
  onViewImages
}: GalleryTileProps) {
  const category = getPrimaryPhotoCategory(photo);
  const imageClassName = large ? "h-full min-h-[520px]" : "h-full min-h-[258px]";

  return (
    <div className={`relative w-full overflow-hidden bg-sand ${imageClassName}`}>
      <button
        aria-label={`Open ${formatPhotoCategory(category)} image`}
        className="absolute inset-0 z-10 block h-full w-full"
        onClick={onOpenPhoto}
        type="button"
      />
      {photo.url.startsWith("placeholder:") ? (
        <PhotoThumbnail
          category={category}
          title={photo.caption ?? photo.originalFileName ?? "Uploaded photo"}
          url={photo.url}
        />
      ) : (
        <Image
          alt={photo.caption ?? photo.originalFileName ?? "Uploaded photo"}
          className="h-full w-full object-cover"
          fill
          sizes={large ? "(min-width: 1280px) 60vw, 100vw" : "(min-width: 1280px) 20vw, 50vw"}
          src={photo.url}
          unoptimized
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/28 via-black/5 to-transparent" />
      <div className="absolute left-4 top-4 rounded-[8px] bg-black/56 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
        {formatPhotoCategory(category)}
      </div>
      {showViewButton ? (
        <button
          className="absolute bottom-4 left-4 rounded-[10px] border border-white/12 bg-white/24 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/32"
          onClick={(event) => {
            event.stopPropagation();
            onViewImages?.();
          }}
          type="button"
        >
          View images
        </button>
      ) : null}
    </div>
  );
}

function SlideshowImage({ photo }: SlideshowImageProps) {
  const category = getPrimaryPhotoCategory(photo);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] bg-sand">
      {photo.url.startsWith("placeholder:") ? (
        <PhotoThumbnail
          category={category}
          title={photo.caption ?? photo.originalFileName ?? "Uploaded photo"}
          url={photo.url}
        />
      ) : (
        <Image
          alt={photo.caption ?? photo.originalFileName ?? "Uploaded photo"}
          className="h-full w-full object-cover"
          fill
          sizes="(min-width: 1280px) 62vw, 100vw"
          src={photo.url}
          unoptimized
        />
      )}
    </div>
  );
}

function SegmentedThumbnail({ photo, isActive = false, onClick }: SegmentedThumbnailProps) {
  const category = getPrimaryPhotoCategory(photo);

  return (
    <button
      className={`group relative overflow-hidden text-left transition ${
        isActive ? "ring-1 ring-inset ring-ember" : ""
      }`}
      onClick={onClick}
      type="button"
    >
      {photo.url.startsWith("placeholder:") ? (
        <PhotoThumbnail
          category={category}
          title={photo.caption ?? photo.originalFileName ?? "Uploaded photo"}
          url={photo.url}
        />
      ) : (
        <div className="relative aspect-[4/3] overflow-hidden bg-sand">
          <Image
            alt={photo.caption ?? photo.originalFileName ?? "Uploaded photo"}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.01]"
            fill
            sizes="(min-width: 1280px) 18vw, (min-width: 768px) 28vw, 90vw"
            src={photo.url}
            unoptimized
          />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/35 to-transparent px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
        {formatPhotoCategory(category)}
      </div>
    </button>
  );
}

export function ListingDetailExperience({
  listing,
  allowedCategories: _allowedCategories
}: ListingDetailExperienceProps) {
  void _allowedCategories;
  const startedAnalysisRef = useRef(false);
  const [photos, setPhotos] = useState(listing.photos);
  const [analysisProgress, setAnalysisProgress] = useState<PhotoAnalysisProgress | null>(null);
  const [analysisState, setAnalysisState] = useState<
    "idle" | "connecting" | "running" | "done" | "error"
  >("idle");
  const [showCompletedNotice, setShowCompletedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [galleryMode, setGalleryMode] = useState<"mosaic" | "slideshow">("mosaic");
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const hasPendingServerPhotos = useMemo(
    () => listing.photos.some(isPhotoPendingAnalysis),
    [listing.photos]
  );
  const tabs = useMemo(() => getPresentGalleryTabs(photos), [photos]);
  const visiblePhotos = useMemo(() => {
    if (activeCategory === "all") {
      return photos;
    }

    return photos.filter((photo) => getFinalPhotoCategories(photo).includes(activeCategory));
  }, [activeCategory, photos]);
  const mosaicPhotos = useMemo(() => buildMosaicPhotos(photos, visiblePhotos), [photos, visiblePhotos]);
  const currentPhotoIndex = useMemo(() => {
    if (!visiblePhotos.length) {
      return -1;
    }

    if (!currentPhotoId) {
      return 0;
    }

    const matchedIndex = visiblePhotos.findIndex((photo) => photo.id === currentPhotoId);
    return matchedIndex >= 0 ? matchedIndex : 0;
  }, [currentPhotoId, visiblePhotos]);
  const currentPhoto = currentPhotoIndex >= 0 ? visiblePhotos[currentPhotoIndex] : null;
  const progressPercent =
    analysisProgress && analysisProgress.total > 0
      ? Math.round((analysisProgress.processed / analysisProgress.total) * 100)
      : 0;

  useEffect(() => {
    if (!tabs.includes(activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, tabs]);

  useEffect(() => {
    if (!visiblePhotos.length) {
      setCurrentPhotoId(null);
      setIsImageExpanded(false);
      return;
    }

    if (!currentPhotoId || !visiblePhotos.some((photo) => photo.id === currentPhotoId)) {
      setCurrentPhotoId(visiblePhotos[0].id);
      setIsImageExpanded(false);
    }
  }, [currentPhotoId, visiblePhotos]);

  useEffect(() => {
    if (!hasPendingServerPhotos || startedAnalysisRef.current) {
      return;
    }

    startedAnalysisRef.current = true;
    setAnalysisState("connecting");
    setError(null);

    const eventSource = new EventSource(`/api/listings/${listing.id}/analyze`);

    const handleProgress = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as PhotoAnalysisProgress;
      setAnalysisProgress(payload);
      setAnalysisState(payload.pending > 0 || payload.processing > 0 ? "running" : "done");
    };

    const handleDone = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as PhotoAnalysisDone;
      setPhotos(payload.photos);
      setAnalysisProgress(payload);
      setAnalysisState("done");
      setShowCompletedNotice(true);
      eventSource.close();
    };

    const handleFatal = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as { message?: string };
      setAnalysisState("error");
      setError(payload.message ?? "Image analysis could not finish.");
      eventSource.close();
    };

    eventSource.addEventListener("progress", handleProgress as EventListener);
    eventSource.addEventListener("done", handleDone as EventListener);
    eventSource.addEventListener("fatal", handleFatal as EventListener);
    eventSource.onerror = () => {
      setAnalysisState("error");
      setError("Image analysis connection dropped.");
      eventSource.close();
    };

    return () => {
      startedAnalysisRef.current = false;
      eventSource.removeEventListener("progress", handleProgress as EventListener);
      eventSource.removeEventListener("done", handleDone as EventListener);
      eventSource.removeEventListener("fatal", handleFatal as EventListener);
      eventSource.close();
    };
  }, [hasPendingServerPhotos, listing.id]);

  function openSlideshow(photo: PhotoRecord) {
    void photo;
    setActiveCategory("all");
    setCurrentPhotoId(photo.id);
    setGalleryMode("slideshow");
    setIsImageExpanded(false);
  }

  function openExpandedCategoryView(photo: PhotoRecord) {
    const primaryCategory = getPrimaryPhotoCategory(photo);

    setActiveCategory(tabs.includes(primaryCategory) ? primaryCategory : "all");
    setCurrentPhotoId(photo.id);
    setGalleryMode("slideshow");
    setIsImageExpanded(true);
  }

  function stepPhoto(direction: -1 | 1) {
    if (!visiblePhotos.length) {
      return;
    }

    const nextIndex = (currentPhotoIndex + direction + visiblePhotos.length) % visiblePhotos.length;
    setCurrentPhotoId(visiblePhotos[nextIndex].id);
  }

  return (
    <div className="space-y-8">
      {analysisState === "connecting" || analysisState === "running" ? (
        <section className="rounded-[12px] border border-ink/10 bg-white/92 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">
                Image analysis
              </p>
              <p className="mt-1 text-sm text-ink/78">
                {analysisState === "connecting"
                  ? "Connecting to the live analysis stream for this listing."
                  : "Categories and search labels are streaming in from the backend."}
              </p>
            </div>
            <Badge>
              {analysisState === "connecting"
                ? "Connecting"
                : `${analysisProgress?.processed ?? 0} / ${analysisProgress?.total ?? 0}`}
            </Badge>
          </div>
          {analysisState === "running" ? (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-ember transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
                <span>{analysisProgress?.processed ?? 0} analyzed</span>
                <span>{analysisProgress?.processing ?? 0} in flight</span>
                <span>{analysisProgress?.pending ?? 0} queued</span>
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {analysisState === "done" && showCompletedNotice ? (
        <section className="rounded-[12px] border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Image analysis complete
              </p>
              <p className="mt-1 text-sm text-emerald-900/80">
                The gallery below is now organized by detected visual category and ready for search.
              </p>
            </div>
            <button
              className="rounded-[10px] border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800"
              onClick={() => setShowCompletedNotice(false)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      {analysisState === "error" ? (
        <section className="rounded-[12px] border border-rust/20 bg-rust/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rust">
            Image analysis paused
          </p>
          <p className="mt-1 text-sm text-rust/90">{error ?? "Image analysis could not finish."}</p>
        </section>
      ) : null}

      {galleryMode === "mosaic" ? (
        <section className="overflow-hidden rounded-[14px] border border-ink/10 bg-white/95 shadow-card">
          <div className="grid gap-px bg-ink/10 lg:grid-cols-[1.6fr_0.8fr_0.8fr] lg:grid-rows-[260px_260px]">
            {mosaicPhotos[0] ? (
              <div className="lg:row-span-2">
                <GalleryTile
                  large
                  onOpenPhoto={() => openExpandedCategoryView(mosaicPhotos[0])}
                  onViewImages={() => openSlideshow(mosaicPhotos[0])}
                  photo={mosaicPhotos[0]}
                  showViewButton
                />
              </div>
            ) : null}
            {mosaicPhotos.slice(1, 5).map((photo) => (
              <GalleryTile
                key={photo.id}
                onOpenPhoto={() => openExpandedCategoryView(photo)}
                photo={photo}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[14px] border border-ink/10 bg-white/95 shadow-card">
          <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="border-b border-ink/10 bg-white p-4 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">
                  Categories
                </p>
                <button
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/62 transition hover:text-ink"
                  onClick={() => setGalleryMode("mosaic")}
                  type="button"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {tabs.map((tab) => {
                  const tabPhotos =
                    tab === "all"
                      ? photos
                      : photos.filter((photo) => getFinalPhotoCategories(photo).includes(tab));

                  return (
                    <button
                      className={`flex w-full items-center justify-between rounded-[10px] border px-4 py-3 text-left transition ${
                        activeCategory === tab
                          ? "border-ember bg-white text-ink"
                          : "border-transparent bg-transparent text-ink hover:border-ink/10 hover:bg-white/70"
                      }`}
                      key={tab}
                  onClick={() => {
                        setActiveCategory(tab);
                        if (tabPhotos[0]) {
                          setCurrentPhotoId(tabPhotos[0].id);
                        }
                        setIsImageExpanded(false);
                      }}
                      type="button"
                    >
                      <span className="text-sm font-semibold">
                        {tab === "all" ? "All images" : formatPhotoCategory(tab)}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">
                        {tabPhotos.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white">
              {currentPhoto ? (
                <div className={isImageExpanded ? "space-y-4 p-4 sm:p-6" : ""}>
                  {isImageExpanded ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">
                            {formatPhotoCategory(getPrimaryPhotoCategory(currentPhoto))}
                          </p>
                          <p className="mt-1 text-sm text-ink/72">
                            {currentPhotoIndex + 1} of {visiblePhotos.length}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-[10px] border border-ink/12 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/72 transition hover:border-ink/25 hover:bg-sand"
                            onClick={() => setIsImageExpanded(false)}
                            type="button"
                          >
                            Back to grid
                          </button>
                          <button
                            className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-ink/12 bg-white text-2xl text-ink transition hover:border-ink/25 hover:bg-sand"
                            onClick={() => stepPhoto(-1)}
                            type="button"
                          >
                            ‹
                          </button>
                          <button
                            className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-ink/12 bg-white text-2xl text-ink transition hover:border-ink/25 hover:bg-sand"
                            onClick={() => stepPhoto(1)}
                            type="button"
                          >
                            ›
                          </button>
                        </div>
                      </div>

                      <SlideshowImage photo={currentPhoto} />

                      <div className="flex items-center justify-between gap-4">
                        <p className="max-w-3xl text-sm leading-6 text-steel">
                          {currentPhoto.caption ?? "AI metadata will appear here after analysis completes."}
                        </p>
                        <div className="hidden flex-wrap gap-2 lg:flex">
                          {getFinalPhotoCategories(currentPhoto).map((category) => (
                            <span
                              className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/58"
                              key={category}
                            >
                              {formatPhotoCategory(category)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="max-h-[820px] overflow-y-auto">
                      <div className="grid grid-cols-1 gap-px bg-ink/8 sm:grid-cols-2 xl:grid-cols-3">
                        {visiblePhotos.map((photo) => (
                          <SegmentedThumbnail
                            isActive={photo.id === currentPhotoId}
                            key={photo.id}
                            onClick={() => {
                              setCurrentPhotoId(photo.id);
                              setIsImageExpanded(true);
                            }}
                            photo={photo}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center text-sm text-steel">
                  No images available in this category yet.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="space-y-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="font-sans text-5xl font-semibold tracking-[-0.03em] text-ink sm:text-6xl">
                {listing.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-[10px] border border-ink/12 bg-white px-5 py-3 text-lg font-medium text-ink">
                  {formatAssetCategory(listing.assetCategory)}
                </span>
                <span className="inline-flex items-center rounded-[10px] border border-ink/12 bg-white px-5 py-3 text-lg font-medium text-ink">
                  Vehicles
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 text-base text-ink/88 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <span className="text-ember">●</span>
              <div>
                <div className="font-semibold">Verified seller</div>
                <div className="text-steel">Marketplace-ready intake</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-ember">●</span>
              <div>
                <div className="font-semibold">Located in {listing.location ?? "Seller provided location"}</div>
                <div className="text-steel">{[listing.year, listing.make, listing.model].filter(Boolean).join(" • ")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-ember">●</span>
              <div>
                <div className="font-semibold">{photos.length} uploaded photos</div>
                <div className="text-steel">AI-organized gallery</div>
              </div>
            </div>
          </div>

          <p className="max-w-4xl text-lg leading-8 text-ink/82">
            {listing.description}
          </p>
      </div>
    </div>
  );
}
