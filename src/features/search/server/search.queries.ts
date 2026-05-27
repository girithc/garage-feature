import type { SearchResult } from "@/features/search/types";
import { embedText, cosineSimilarity } from "@/server/ai/embeddings.service";
import { getSearchIndex } from "@/server/demo/demoStore";
import {
  getFinalPhotoCategories,
  getPrimaryPhotoCategory
} from "@/server/taxonomy/taxonomy.service";

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function includesTokenBag(text: string, tokens: string[]) {
  return tokens.every((token) => text.includes(token));
}

function buildListingFieldCorpus(listing: {
  title: string;
  description?: string | null;
  assetCategory: string;
  make?: string | null;
  model?: string | null;
  location?: string | null;
}) {
  return [
    listing.title,
    listing.description ?? "",
    listing.assetCategory,
    listing.make ?? "",
    listing.model ?? "",
    listing.location ?? ""
  ]
    .join(" ")
    .toLowerCase();
}

function buildPhotoCorpus(photo: {
  predictedCategory?: string | null;
  predictedCategories?: string[] | null;
  correctedCategory?: string | null;
  correctedCategories?: string[] | null;
  caption?: string | null;
  labels: string[];
  originalFileName?: string | null;
}) {
  const finalCategories = getFinalPhotoCategories(photo);

  return [
    finalCategories.join(" "),
    photo.predictedCategory ?? "",
    photo.predictedCategories?.join(" ") ?? "",
    photo.caption ?? "",
    photo.labels.join(" "),
    photo.originalFileName ?? ""
  ]
    .join(" ")
    .toLowerCase();
}

function buildListingSemanticDocument(params: {
  listing: {
    title: string;
    description?: string | null;
    assetCategory: string;
    make?: string | null;
    model?: string | null;
    location?: string | null;
  };
  photoCorpora: string[];
}) {
  return [
    params.listing.title,
    params.listing.description ?? "",
    params.listing.assetCategory.replaceAll("_", " "),
    params.listing.make ?? "",
    params.listing.model ?? "",
    params.listing.location ?? "",
    ...params.photoCorpora
  ]
    .join(" ")
    .trim();
}

export async function searchListings(query: string): Promise<SearchResult[]> {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return [];
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const { listings, photos } = await getSearchIndex();
  const queryEmbedding = await embedText(normalizedQuery);

  const results = await Promise.all(
    listings.map(async (listing) => {
      const listingPhotos = photos.filter((photo) => photo.listingId === listing.id);
      const listingFieldCorpus = buildListingFieldCorpus(listing);
      const matchedListingFields: string[] = [];
      let keywordScore = 0;

      if (includesTokenBag(listingFieldCorpus, tokens)) {
        matchedListingFields.push("title / specs");
        keywordScore += 2;
      }

      if (listingFieldCorpus.includes(normalizedQuery)) {
        keywordScore += 2;
      }

      const matchedPhotos = listingPhotos
        .map((photo) => {
          const finalCategories = getFinalPhotoCategories(photo);
          const finalCategory = getPrimaryPhotoCategory(photo);
          const photoCorpus = buildPhotoCorpus(photo);

          if (!includesTokenBag(photoCorpus, tokens)) {
            return null;
          }

          return {
            ...photo,
            finalCategory,
            finalCategories,
            matchedTerms: tokens.filter((token) => photoCorpus.includes(token))
          };
        })
        .filter(Boolean) as SearchResult["matchedPhotos"];

      keywordScore += matchedPhotos.length * 3;

      const semanticDocument = buildListingSemanticDocument({
        listing,
        photoCorpora: listingPhotos.map((photo) => buildPhotoCorpus(photo))
      });
      const listingEmbedding = await embedText(semanticDocument);
      const vectorScore = Math.max(0, cosineSimilarity(queryEmbedding, listingEmbedding));
      const semanticCandidateThreshold = 0.18;

      if (!keywordScore && vectorScore < semanticCandidateThreshold) {
        return null;
      }

      const rerankedScore = keywordScore * 10 + vectorScore * 8;

      return {
        listing,
        matchedPhotos,
        matchedListingFields,
        score: rerankedScore
      };
    })
  );

  return results
    .filter(Boolean)
    .sort((left, right) => (right?.score ?? 0) - (left?.score ?? 0)) as SearchResult[];
}
